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
    // Comprehensive logging of input data
    console.log('storeData called with full data keys:', Object.keys(data));
    
    // Deep clone with JSON parse/stringify to ensure complete object preservation
    const fullData = JSON.parse(JSON.stringify(data));
    
    // Exhaustive logging of each major slice of the store
    const slicesToLog = [
      'theme', 'user', 'content', 'search', 
      'system', 'todo', 'panellayout', 'activePanel', 
      'resizeable', '__stateTimestamp'
    ];
    
    slicesToLog.forEach(slice => {
      if (fullData[slice]) {
        console.log(`Detailed ${slice} slice:`, 
          slice === 'todo' 
            ? { 
                todos: fullData[slice].todos?.length, 
                actionHistory: fullData[slice].actionHistory?.length,
                searchQuery: fullData[slice].searchQuery,
                selectedContent: fullData[slice].selectedContent
              }
            : fullData[slice]
        );
      }
    });
    
    // Verify todos and action history are preserved
    if (fullData.todo) {
      console.log('Todos preservation check:', {
        todosCount: fullData.todo.todos?.length,
        actionHistoryCount: fullData.todo.actionHistory?.length,
        actionHistoryDetails: fullData.todo.actionHistory
      });
    }
    
    // Create MCard with full, unmodified data
    const mcard = new MCard(fullData);
    console.log('Created MCard successfully with complete state');
    
    // Store the card
    const engine = getStoreEngine();
    const hash = engine.add(mcard);
    console.log('Added card to engine, received hash:', hash);
    
    // Additional verification logging
    const storedCard = getCardByHash(hash);
    console.log('Verification - Stored card details:', {
      hash: storedCard?.hash,
      contentKeys: Object.keys(storedCard?.content || {}),
      todoCount: storedCard?.content?.todo?.todos?.length,
      actionHistoryCount: storedCard?.content?.todo?.actionHistory?.length
    });
    
    return hash;
  } catch (error) {
    console.error('Critical error in storeData:', error);
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
