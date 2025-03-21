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
    
    // Create MCard with data as-is
    const mcard = new MCard(data);
    console.log('Created MCard successfully');
    
    // Store the card
    const engine = getStoreEngine();
    const hash = engine.add(mcard);
    console.log('Added card to engine, received hash:', hash);
    
    return hash;
  } catch (error) {
    console.error('Error in storeData:', error);
    throw error;
  }
}

/**
 * Get a card by its hash
 * @param hash Hash of the card to retrieve
 * @returns The card if found, null otherwise
 */
export function getCardByHash(hash: string): any {
  try {
    console.log('getCardByHash called with hash:', hash);
    const engine = getStoreEngine();
    const card = engine.get(hash);
    
    if (!card) {
      console.log('No card found for hash:', hash);
      return null;
    }
    
    // Return the card with additional metadata
    return {
      hash: card.hash,
      content: card.content,
      timestamp: card.g_time,
      retrievedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in getCardByHash:', error);
    return null;
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
