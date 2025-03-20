import { MCard } from '../content/model/mcard.js';
import { SQLiteEngine, SQLiteConnection } from '../engine/sqlite_engine.js';
import { CARDS_DB_PATH } from '../config/config_constants.js';

// Singleton instance
let engineInstance: SQLiteEngine | null = null;

/**
 * Get a singleton instance of SQLiteEngine
 */
export function getStoreEngine(): SQLiteEngine {
  if (!engineInstance) {
    const connection = SQLiteConnection.getInstance(CARDS_DB_PATH);
    engineInstance = new SQLiteEngine(connection);
  }
  return engineInstance;
}

/**
 * Safely create a Buffer from content in both Node.js and browser environments
 * @param content The content to convert to Buffer
 * @returns Buffer or Uint8Array depending on environment
 */
function safeBufferFrom(content: string): any {
  // Use TextEncoder to convert string to Uint8Array in any environment
  const encoder = new TextEncoder();
  return encoder.encode(content);
}

/**
 * Store data as an MCard
 * @param data The data to store
 * @returns The hash of the created card
 */
export function storeData(data: any): string {
  try {
    // Format the data for storage
    let content: string;
    
    // If it's already a string, use it directly
    if (typeof data === 'string') {
      content = data;
    } else {
      // Otherwise, stringify it
      content = JSON.stringify(data);
    }
    
    // Create an MCard with the content using our safe buffer approach
    const card = new MCard(safeBufferFrom(content));
    
    // Store the card using the engine
    const engine = getStoreEngine();
    const hashValue = engine.add(card);
    
    return hashValue;
  } catch (error) {
    console.error('Error storing data as MCard:', error);
    throw error;
  }
}

/**
 * Get a card by its hash
 * @param hash The hash of the card to retrieve
 * @returns The card if found, null otherwise
 */
export function getCardByHash(hash: string): any {
  try {
    const engine = getStoreEngine();
    const card = engine.get(hash);
    
    if (!card) {
      return null;
    }
    
    // Try to parse the content as JSON if possible
    try {
      return JSON.parse(card.content.toString());
    } catch {
      // If parsing fails, return the raw content as string
      return card.content.toString();
    }
  } catch (error) {
    console.error('Error retrieving card by hash:', error);
    throw error;
  }
}

/**
 * Get all cards (paginated)
 * @param pageNumber Page number (default: 1)
 * @param pageSize Page size (default: 10)
 * @returns Paginated list of cards
 */
export function getAllCards(pageNumber = 1, pageSize = 10): any {
  try {
    const engine = getStoreEngine();
    return engine.get_all(pageNumber, pageSize);
  } catch (error) {
    console.error('Error retrieving all cards:', error);
    throw error;
  }
}
