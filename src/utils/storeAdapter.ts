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
    try {
      console.log('Initializing SQLiteEngine with database path:', CARDS_DB_PATH);
      const connection = SQLiteConnection.getInstance(CARDS_DB_PATH);
      engineInstance = new SQLiteEngine(connection);
      console.log('SQLiteEngine initialized successfully');
    } catch (error) {
      console.error('Error initializing SQLiteEngine:', error);
      throw error;
    }
  }
  return engineInstance;
}

/**
 * Safely create a Buffer from content in both Node.js and browser environments
 * @param content The content to convert to Buffer
 * @returns Buffer or Uint8Array depending on environment
 */
function safeBufferFrom(content: string): any {
  try {
    // Use TextEncoder to convert string to Uint8Array in any environment
    const encoder = new TextEncoder();
    return encoder.encode(content);
  } catch (error) {
    console.error('Error creating buffer:', error);
    throw error;
  }
}

/**
 * Store data as an MCard
 * @param data The data to store
 * @returns The hash of the created card
 */
export function storeData(data: any): string {
  try {
    // Log what we're trying to store
    console.log('storeData called with data type:', typeof data);
    console.log('Data has these keys:', Object.keys(data || {}));
    
    // Format the data for storage
    let content: string;
    
    // If it's already a string, use it directly
    if (typeof data === 'string') {
      content = data;
      console.log('Data is already a string, length:', content.length);
    } else {
      // Otherwise, stringify it
      content = JSON.stringify(data);
      console.log('Stringified data, length:', content.length);
    }
    
    // Create an MCard with the content using our safe buffer approach
    const buffer = safeBufferFrom(content);
    console.log('Created buffer with length:', buffer.length);
    
    const card = new MCard(buffer);
    console.log('Created MCard successfully');
    
    // Store the card using the engine
    const engine = getStoreEngine();
    const hashValue = engine.add(card);
    console.log('Added card to engine, received hash:', hashValue);
    
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
    console.log('Getting card with hash:', hash);
    const engine = getStoreEngine();
    const card = engine.get(hash);
    
    if (!card) {
      console.log('No card found with hash:', hash);
      return null;
    }
    
    console.log('Card found, content type:', typeof card.content);
    
    // Try to parse the content as JSON if possible
    try {
      const contentStr = card.content.toString();
      console.log('Card content as string length:', contentStr.length);
      
      const parsed = JSON.parse(contentStr);
      console.log('Successfully parsed card content as JSON');
      return parsed;
    } catch (parseError) {
      console.log('Failed to parse as JSON, returning as string:', parseError);
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
    console.log(`Getting cards page ${pageNumber} with size ${pageSize}`);
    const engine = getStoreEngine();
    const results = engine.get_all(pageNumber, pageSize);
    console.log(`Retrieved ${results.items.length} cards`);
    return results;
  } catch (error) {
    console.error('Error retrieving all cards:', error);
    throw error;
  }
}
