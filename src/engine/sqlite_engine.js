import { MCardFromData } from '../content/model/mcard.js';
import { Page } from '../content/model/card-collection.js';
import { DEFAULT_PAGE_SIZE } from '../config/config_constants.js';
import { MCARD_TABLE_SCHEMA, TRIGGERS } from '../models/database_schemas.js';
import path from 'path';
import Database from 'better-sqlite3';
import fs from 'fs';

class SQLiteConnection {
  /**
   * Create a new SQLite database connection
   * @param {string} dbPath - Path to the SQLite database file
   */
  constructor(dbPath = path.resolve(__dirname, '../test/db/test_cards.db')) {
    this.dbPath = dbPath;
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

      // Remove existing database file to start fresh
      if (fs.existsSync(this.dbPath)) {
        fs.unlinkSync(this.dbPath);
      }

      // Open the database connection with appropriate flags
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

      // Drop existing tables if they exist
      const dropTableStatements = [
        'DROP TABLE IF EXISTS documents',
        'DROP TABLE IF EXISTS card',
        'DROP TABLE IF EXISTS card_metadata'
      ];

      dropTableStatements.forEach(stmt => {
        try {
          this.conn.prepare(stmt).run();
        } catch (dropError) {
          console.warn(`Warning during table drop: ${dropError.message}`);
        }
      });

      // Create tables from schema
      Object.entries(MCARD_TABLE_SCHEMA).forEach(([tableName, schema]) => {
        try {
          this.conn.prepare(schema).run();
        } catch (createError) {
          console.error(`Error creating table ${tableName}: ${createError.message}`);
          throw createError;
        }
      });

      // Create triggers
      TRIGGERS.forEach((trigger) => {
        try {
          this.conn.prepare(trigger).run();
        } catch (triggerError) {
          console.warn(`Warning creating trigger: ${triggerError.message}`);
        }
      });

      return this;
    } catch (error) {
      console.error(`Database setup error: ${error.message}`);
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
}

class SQLiteEngine {
  /**
   * Create a new SQLite storage engine
   * @param {SQLiteConnection} connection - Database connection
   */
  constructor(connection = null) {
    this.connection = connection || new SQLiteConnection();
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
      const stmt = this.connection.conn.prepare(
        'INSERT OR REPLACE INTO card (hash, content, g_time) VALUES (?, ?, ?)'
      );
      
      const result = stmt.run(
        String(card.hash), 
        card.content, 
        card.g_time
      );

      return String(card.hash);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        throw new Error(`Card with hash ${card.hash} already exists`);
      }
      console.error(`Error adding card: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieve a card by its hash
   * @param {string} hashValue - Hash of the card to retrieve
   * @returns {MCard|null} Retrieved card or null
   */
  get(hashValue) {
    try {
      const stmt = this.connection.conn.prepare(
        'SELECT content, g_time, hash FROM card WHERE hash = ?'
      );
      
      const row = stmt.get(String(hashValue));
      
      if (!row) return null;
      
      // Convert content to Buffer
      const contentBuffer = Buffer.from(row.content, 'utf8');
      
      return new MCardFromData(contentBuffer, row.hash, row.g_time);
    } catch (error) {
      console.error(`Error retrieving card: ${error.message}`);
      throw error;
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
        
        // Convert content to Buffer
        const contentBuffer = Buffer.from(content, 'utf8');
        
        const card = new MCardFromData(contentBuffer, hash, g_time);
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
        const [content, g_time, hash] = [row.content, row.g_time, row.hash];
        
        // Convert content to Buffer
        const contentBuffer = Buffer.from(content, 'utf8');
        
        const card = new MCardFromData(contentBuffer, hash, g_time);
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
        const [content, g_time, hash] = [row.content, row.g_time, row.hash];
        
        // Convert content to Buffer
        const contentBuffer = Buffer.from(content, 'utf8');
        
        const card = new MCardFromData(contentBuffer, hash, g_time);
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
    console.log('Rows:', rows);

    // Convert rows to cards
    const items = [];
    for (const row of rows) {
        const [content, g_time, hash] = [row.content, row.g_time, row.hash];
        
        // Convert content to Buffer
        const contentBuffer = Buffer.from(content, 'utf8');
        
        const card = new MCardFromData(contentBuffer, hash, g_time);
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