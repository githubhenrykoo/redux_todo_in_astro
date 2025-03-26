import { MCardFromData } from '../content/model/mcard.js';
import { Page } from '../content/model/card-collection.js';
import { DEFAULT_PAGE_SIZE, CARDS_DB_PATH } from '../config/config_constants.js';
import { MCARD_TABLE_SCHEMA, TRIGGERS } from '../models/database_schemas.js';
import path from 'path';
import Database from 'better-sqlite3';
import fs from 'fs';

class SQLiteConnection {
  /**
   * Singleton instance management
   */
  static _instance = null;

  /**
   * Get singleton instance of SQLiteConnection
   * @param {string} [dbPath] - Optional path to the SQLite database file
   * @returns {SQLiteConnection} Singleton instance
   */
  static getInstance(dbPath = null) {
    if (!this._instance) {
      this._instance = new SQLiteConnection(dbPath);
    }
    return this._instance;
  }

  /**
   * Create a new SQLite database connection
   * @param {string} [dbPath] - Optional path to the SQLite database file
   * Prioritizes the provided path, then environment variable, then default config
   */
  constructor(dbPath = null) {
    // Determine the database path in order of priority:
    // 1. Explicitly provided path
    // 2. Environment variable
    // 3. Default configuration path
    this.dbPath = dbPath || 
                  process.env.MCARD_DB_PATH || 
                  CARDS_DB_PATH;
    
    // Ensure the path is an absolute path
    this.dbPath = path.resolve(this.dbPath);
    
    this.conn = null;
  }

  /**
   * Establish a database connection
   */
  connect() {
    try {
      // Ensure the directory exists
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Open the database connection with appropriate flags
      // Don't remove the existing database file to prevent data loss
      this.conn = new Database(this.dbPath, {
        // Open in read-write mode, create if not exists
        mode: Database.OPEN_READWRITE | Database.OPEN_CREATE,
        // Disable verbose mode to reduce unnecessary logging
        verbose: null
      });

      return this;
    } catch (error) {
      console.error(`Database connection error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set up the database, creating the file and table if they don't exist
   */
  setup_database() {
    try {
      // Ensure the connection is open
      if (!this.conn) {
        this.connect();
      }

      // Check if the tables already exist
      const tableExists = this.conn.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='card'
      `).get();

      // Only create tables if they don't exist
      if (!tableExists) {
        console.log('Creating new database tables...');
        
        // Create the table using the schema
        this.conn.exec(MCARD_TABLE_SCHEMA);
        
        // Add triggers
        TRIGGERS.forEach(trigger => {
          try {
            this.conn.exec(trigger);
          } catch (triggerError) {
            console.warn(`Warning during trigger creation: ${triggerError.message}`);
          }
        });

        console.log('Database tables created successfully');
      } else {
        console.log('Database tables already exist, skipping creation');
      }
    } catch (error) {
      console.error('Database setup failed:', error);
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  disconnect() {
    try {
      if (this.conn) {
        this.conn.close();
        this.conn = null;
      }
    } catch (error) {
      console.warn(`Error during database disconnect: ${error.message}`);
    }
  }

  /**
   * Commit the current transaction
   */
  commit() {
    if (this.conn) {
      this.conn.prepare('COMMIT').run();
    }
  }

  /**
   * Rollback the current transaction
   */
  rollback() {
    if (this.conn) {
      this.conn.prepare('ROLLBACK').run();
    }
  }

  /**
   * Add a method to execute raw queries
   * @param {string} query - Raw query to execute
   * @param {array} params - Parameters for the query
   * @returns {array} Results of the query
   */
  executeQuery(query, params = []) {
    if (!this.conn) {
      this.connect();
    }
    const stmt = this.conn.prepare(query);
    return stmt.all(...params);
  }
}

class SQLiteEngine {
  /**
   * Create a new SQLite storage engine
   * @param {SQLiteConnection} connection - Database connection
   */
  constructor(connection = null) {
    this.connection = connection || SQLiteConnection.getInstance();
    this.connection.connect();
    this.connection.setup_database();
    this.clearStmt = this.connection.conn.prepare('DELETE FROM card');
  }

  /**
   * Destructor to ensure database connection is closed
   */
  destructor() {
    this.connection.disconnect();
  }

  /**
   * Symbol.dispose method for resource cleanup
   */
  [Symbol.dispose]() {
    this.destructor();
  }

  /**
   * Add a card to the database
   * @param {MCard} card - Card to add
   * @returns {string} Hash of the added card
   */
  add(card) {
    try {
      console.log('SQLiteEngine.add called with card hash:', card.hash);
      
      // Check if the card already exists
      const existingCard = this.get(card.hash);
      if (existingCard) {
        console.log('Card already exists with hash:', card.hash);
        return card.hash;
      }

      // Ensure content is properly serialized for SQLite storage
      let finalContent;
      if (typeof card.content === 'object' && card.content !== null && !(card.content instanceof Buffer)) {
        // For objects, stringify to ensure proper SQLite storage
        finalContent = JSON.stringify(card.content);
        console.log('Serialized object content to JSON string');
      } else if (typeof card.content === 'string') {
        // Strings can be stored directly
        finalContent = card.content;
        console.log('Using string content directly');
      } else if (Buffer.isBuffer(card.content)) {
        // Buffers can be stored directly
        finalContent = card.content;
        console.log('Using Buffer content directly');
      } else {
        // Convert other types to string
        finalContent = String(card.content);
        console.log('Converted content to string');
      }

      // Insert the card into the database
      try {
        const stmt = this.connection.conn.prepare(
          'INSERT INTO card (hash, content, g_time) VALUES (?, ?, ?)'
        );
        
        stmt.run(card.hash, finalContent, card.g_time);
        
        console.log('Card inserted successfully with hash:', card.hash);
        return card.hash;
      } catch (sqlError) {
        console.error('SQL error inserting card:', sqlError);
        throw sqlError;
      }
    } catch (error) {
      console.error('Error in SQLiteEngine.add:', error);
      throw error;
    }
  }

  /**
   * Retrieve a card by its hash
   * @param {string} hashValue - Hash of the card to retrieve
   * @returns {MCard|null} Retrieved card or null
   */
  get(hash) {
    try {
      console.log('SQLiteEngine.get called with hash:', hash);
      
      // Query the database for the card
      const stmt = this.connection.conn.prepare(
        'SELECT hash, content, g_time FROM card WHERE hash = ?'
      );
      
      const row = stmt.get(String(hash));
      
      if (!row) {
        console.log('No card found with hash:', hash);
        return null;
      }
      
      // Parse content if it's a JSON string
      let content = row.content;
      if (typeof content === 'string') {
        try {
          // Check if the string is a JSON object
          if (content.startsWith('{') || content.startsWith('[')) {
            const parsed = JSON.parse(content);
            content = parsed;
            console.log('Parsed JSON content successfully');
          }
        } catch (e) {
          // If parsing fails, keep the original string
          console.log('Content is not a valid JSON string, keeping as-is');
        }
      }
      
      console.log('Card retrieved successfully with hash:', hash);
      
      return {
        hash: row.hash,
        content: content,
        g_time: row.g_time
      };
    } catch (error) {
      console.error('Error retrieving card:', error);
      return null;
    }
  }

  /**
   * Delete a card by its hash
   * @param {string} hashValue - Hash of the card to delete
   * @returns {boolean} Whether deletion was successful
   */
  delete(hashValue) {
    try {
      const stmt = this.connection.conn.prepare(
        'DELETE FROM card WHERE hash = ?'
      );
      
      const result = stmt.run(String(hashValue));
      return result.changes > 0;
    } catch (error) {
      console.error(`Error deleting card: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a page of cards
   * @param {number} page_number - Page number to retrieve
   * @param {number} page_size - Number of items per page
   * @returns {Page} Page of cards
   */
  get_page(page_number = 1, page_size = DEFAULT_PAGE_SIZE) {
    if (page_number < 1 || page_size < 1) {
      throw new Error('Page number and size must be >= 1');
    }

    const offset = (page_number - 1) * page_size;

    // Get total count of items
    const countStmt = this.connection.conn.prepare(
      'SELECT COUNT(*) as total FROM card'
    );
    const { total } = countStmt.get();

    // Get page of items
    const stmt = this.connection.conn.prepare(`
      SELECT content, g_time, hash 
      FROM card 
      ORDER BY g_time DESC 
      LIMIT ? OFFSET ?
    `);
    
    const rows = stmt.all(page_size, offset);

    // Convert rows to cards
    const items = [];
    for (const row of rows) {
        const [content, g_time, hash] = [row.content, row.g_time, row.hash];
        
        // Parse content if it's a JSON string
        let parsedContent = content;
        if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
          try {
            parsedContent = JSON.parse(content);
          } catch (e) {
            console.warn('Failed to parse JSON content for hash:', hash);
          }
        }
        
        // Create card with properly parsed content
        const card = new MCardFromData(parsedContent, hash, g_time);
        items.push(card);
    }

    // Calculate total pages
    const total_pages = Math.ceil(total / page_size);

    return new Page({
      items,
      total_items: total,
      page_number,
      page_size,
      has_next: offset + page_size < total,
      has_previous: page_number > 1,
      total_pages
    });
  }

  /**
   * Search cards by string
   * @param {string} search_string - String to search for
   * @param {number} page_number - Page number to retrieve
   * @param {number} page_size - Number of items per page
   * @returns {Page} Page of matching cards
   */
  search_by_string(searchString, pageNumber = 1, pageSize = DEFAULT_PAGE_SIZE) {
    try {
      if (pageNumber < 1) {
        throw new Error('Page number must be >= 1');
      }
      if (pageSize < 1) {
        throw new Error('Page size must be >= 1');
      }

      const offset = (pageNumber - 1) * pageSize;
      const cursor = this.connection.conn;

      // First, get total count of matching items
      const countStmt = cursor.prepare(`
        SELECT COUNT(*) as total FROM card 
        WHERE 
          CAST(content AS TEXT) LIKE ? OR 
          hash LIKE ? OR 
          g_time LIKE ?
      `);
      const { total } = countStmt.get(
        `%${searchString}%`, 
        `%${searchString}%`, 
        `%${searchString}%`
      );

      // Then, get the actual items for the current page
      const stmt = cursor.prepare(`
        SELECT content, g_time, hash FROM card 
        WHERE 
          CAST(content AS TEXT) LIKE ? OR 
          hash LIKE ? OR 
          g_time LIKE ?
        ORDER BY g_time DESC LIMIT ? OFFSET ?
      `);
      
      const rows = stmt.all(
        `%${searchString}%`, 
        `%${searchString}%`, 
        `%${searchString}%`,
        pageSize, 
        offset
      );

      // Convert rows to cards
      const items = [];
      for (const row of rows) {
        const { content, g_time, hash } = row;
        
        // Parse content if it's a JSON string
        let parsedContent = content;
        if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
          try {
            parsedContent = JSON.parse(content);
          } catch (e) {
            console.warn('Failed to parse JSON content for hash:', hash);
          }
        }
        
        // Create card with properly parsed content
        const card = new MCardFromData(parsedContent, hash, g_time);
        items.push(card);
      }

      // Calculate pagination flags
      const has_next = total > (pageNumber * pageSize);
      const has_previous = pageNumber > 1;

      return new Page({
        items,
        total_items: total,
        page_number: pageNumber,
        page_size: pageSize,
        has_next,
        has_previous,
        total_pages: Math.ceil(total / pageSize)
      });
    } catch (error) {
      console.error(`Error searching cards: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search for cards by content, hash, or g_time
   * @param {string} searchString - String to search for
   * @param {number} pageNumber - Page number for pagination
   * @param {number} pageSize - Number of items per page
   * @returns {Page} Paginated search results
   */
  search_by_content(searchString, pageNumber = 1, pageSize = DEFAULT_PAGE_SIZE) {
    try {
      if (pageNumber < 1) {
        throw new Error('Page number must be >= 1');
      }
      if (pageSize < 1) {
        throw new Error('Page size must be >= 1');
      }

      const offset = (pageNumber - 1) * pageSize;
      const cursor = this.connection.conn;

      // First, get total count of matching items
      const countStmt = cursor.prepare(
        'SELECT COUNT(*) as total FROM card WHERE CAST(content AS TEXT) LIKE ?'
      );
      const { total } = countStmt.get(`%${searchString}%`);

      // Then, get the actual items for the current page
      const stmt = cursor.prepare(`
        SELECT content, g_time, hash FROM card 
        WHERE CAST(content AS TEXT) LIKE ?
        ORDER BY g_time DESC LIMIT ? OFFSET ?
      `);
      
      const rows = stmt.all(
        `%${searchString}%`,
        pageSize, 
        offset
      );

      // Convert rows to cards
      const items = [];
      for (const row of rows) {
        const { content, g_time, hash } = row;
        
        // Parse content if it's a JSON string
        let parsedContent = content;
        if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
          try {
            parsedContent = JSON.parse(content);
          } catch (e) {
            console.warn('Failed to parse JSON content for hash:', hash);
          }
        }
        
        // Create card with properly parsed content
        const card = new MCardFromData(parsedContent, hash, g_time);
        items.push(card);
      }

      // Calculate pagination flags
      const has_next = total > (pageNumber * pageSize);
      const has_previous = pageNumber > 1;

      return new Page({
        items,
        total_items: total,
        page_number: pageNumber,
        page_size: pageSize,
        has_next,
        has_previous,
        total_pages: Math.ceil(total / pageSize)
      });
    } catch (error) {
      console.error(`Error searching cards: ${error.message}`);
      throw error;
    }
  }

  begin() {
    if (this.connection.conn) {
      this.connection.conn.prepare('BEGIN TRANSACTION').run();
    }
  }

  commit() {
    if (this.connection.conn) {
      this.connection.conn.prepare('COMMIT').run();
    }
  }

  rollback() {
    if (this.connection.conn) {
      this.connection.conn.prepare('ROLLBACK').run();
    }
  }

  clear() {
    try {
      this.begin();
      this.clearStmt.run();
      this.commit();
    } catch (error) {
      this.rollback();
      throw error;
    }
  }

  /**
   * Count the total number of cards
   * @returns {number} Total number of cards
   */
  count() {
    const stmt = this.connection.conn.prepare('SELECT COUNT(*) as total FROM card');
    const { total } = stmt.get();
    return total;
  }

  /**
   * Update a card's content by hash
   * @param {string} hash - Hash of the card to update
   * @param {any} newContent - New content for the card
   * @returns {boolean} Whether the update was successful
   */
  update(hash, newContent) {
    try {
      console.log('SQLiteEngine.update called with hash:', hash);
      
      // First verify the card exists
      const existingCard = this.get(hash);
      if (!existingCard) {
        console.log('No card found with hash:', hash);
        return false;
      }
      
      // Prepare content for storage
      let finalContent;
      
      if (typeof newContent === 'object' && newContent !== null && !(newContent instanceof Buffer)) {
        // For objects, stringify to ensure proper SQLite storage
        finalContent = JSON.stringify(newContent);
        console.log('Serialized object content to JSON string for update');
      } else if (typeof newContent === 'string') {
        // Strings can be stored directly
        finalContent = newContent;
        console.log('Using string content directly for update');
      } else if (Buffer.isBuffer(newContent)) {
        // Buffers can be stored directly
        finalContent = newContent;
        console.log('Using Buffer content directly for update');
      } else {
        // Convert other types to string
        finalContent = String(newContent);
        console.log('Converted content to string for update');
      }
      
      // Update the card in the database
      const stmt = this.connection.conn.prepare(
        'UPDATE card SET content = ? WHERE hash = ?'
      );
      
      const result = stmt.run(finalContent, String(hash));
      
      if (result.changes > 0) {
        console.log('Card updated successfully with hash:', hash);
        return true;
      } else {
        console.log('Card update had no effect for hash:', hash);
        return false;
      }
    } catch (error) {
      console.error('Error updating card:', error);
      return false;
    }
  }

  /**
   * Get all cards
   * @param {number} page_number - Page number to retrieve
   * @param {number} page_size - Number of items per page
   * @returns {Page} Page of all cards
   */
  get_all(page_number = 1, page_size = DEFAULT_PAGE_SIZE) {
    if (page_number < 1) {
      throw new Error("Page number must be >= 1");
    }
    if (page_size < 1) {
      throw new Error("Page size must be >= 1");
    }
    
    const offset = (page_number - 1) * page_size;
    
    // Get total count of items
    const countStmt = this.connection.conn.prepare(
      'SELECT COUNT(*) as total FROM card'
    );
    const { total } = countStmt.get();
    console.log('Total cards:', total);

    // Get page of items
    const stmt = this.connection.conn.prepare(`
      SELECT content, g_time, hash 
      FROM card 
      ORDER BY g_time DESC 
      LIMIT ? OFFSET ?
    `);
    
    const rows = stmt.all(page_size, offset);
    console.log('Rows found:', rows.length);

    // Convert rows to cards
    const items = [];
    for (const row of rows) {
        const { content, g_time, hash } = row;
        
        // Parse content if it's a JSON string
        let parsedContent = content;
        if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
          try {
            parsedContent = JSON.parse(content);
          } catch (e) {
            console.warn('Failed to parse JSON content for hash:', hash);
          }
        }
        
        // Create card with properly parsed content
        const card = new MCardFromData(parsedContent, hash, g_time);
        items.push(card);
    }

    // Calculate total pages
    const total_pages = Math.ceil(total / page_size);

    return new Page({
      items,
      total_items: total,
      page_number,
      page_size,
      has_next: offset + page_size < total,
      has_previous: page_number > 1,
      total_pages
    });
  }
}

export { SQLiteEngine, SQLiteConnection };