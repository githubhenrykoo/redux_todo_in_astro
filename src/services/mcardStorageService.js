import { MCard } from '../content/model/mcard.js';
import { SQLiteEngine, SQLiteConnection } from '../engine/sqlite_engine.js';

/**
 * Service for creating and storing MCards from Redux actions
 */
class McardStorageService {
  static initialized = false;
  static sqliteEngine = null;

  /**
   * Initialize the SQLite engine
   */
  static async initialize() {
    if (!this.initialized) {
      const connection = new SQLiteConnection();
      await connection.setup_database();
      this.sqliteEngine = new SQLiteEngine(connection);
      this.initialized = true;
    }
    return this.sqliteEngine;
  }

  /**
   * Create and store a new MCard from a Redux action
   * @param {Object} action - Redux action
   * @returns {Promise<string>} - Hash of the created MCard
   */
  static async createAndStoreMCard(action) {
    try {
      // Ensure the engine is initialized
      await this.initialize();
      
      // Sanitize the payload before storing
      const sanitizedPayload = this.sanitizePayload(action.payload);
      
      // Create action content with timestamp
      const actionContent = {
        type: action.type,
        payload: sanitizedPayload,
        timestamp: new Date().toISOString(),
        meta: action.meta || {}
      };
      
      // Create the MCard
      const mcard = new MCard(JSON.stringify(actionContent));
      
      // Store the MCard and return its hash
      return this.sqliteEngine.add(mcard);
    } catch (error) {
      console.error(`Failed to store action ${action.type} as MCard:`, error);
      throw error;
    }
  }

  /**
   * Sanitize payload to remove sensitive information
   * @param {Object} payload - Action payload
   * @returns {Object} - Sanitized payload
   */
  static sanitizePayload(payload) {
    if (!payload) return payload;
    
    // Create a deep copy of the payload
    const sanitized = JSON.parse(JSON.stringify(payload));
    
    // List of sensitive field keys to remove
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
    
    // Remove sensitive data recursively
    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        // Check if key contains sensitive information
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      });
    };
    
    sanitizeObject(sanitized);
    return sanitized;
  }

  /**
   * Get MCards by action type
   * @param {string} actionType - Action type to search for
   * @param {Object} options - Options for pagination
   * @returns {Promise<Array>} - Array of MCards
   */
  static async getMCardsByActionType(actionType, options = {}) {
    try {
      // Ensure the engine is initialized
      await this.initialize();
      
      // Search for MCards with the specific action type
      const searchString = actionType;
      const pageNumber = options.page || 1;
      const pageSize = options.limit || 100;
      
      return this.sqliteEngine.search_by_content(searchString, pageNumber, pageSize);
    } catch (error) {
      console.error(`Failed to retrieve MCards for action type ${actionType}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve all stored cards
   * @returns {Promise<Array>} - Array of stored cards
   */
  static async getAllCards() {
    // Ensure the engine is initialized
    await this.initialize();
    
    // Use the sqliteEngine to search for all cards
    const allCards = await this.sqliteEngine.search_by_content('', 1, 1000);
    
    return allCards.items || [];
  }
}

export default McardStorageService;
