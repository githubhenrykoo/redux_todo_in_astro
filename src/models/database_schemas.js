// Database schema definitions for SQLite 
// Table Schemas v0.0.1

/**
 * MCARD_TABLE_SCHEMA defines the structure of database tables used in the Monadic Card system.
 * 
 * @property {string} documents - A virtual FTS5 (Full-Text Search) table for efficient content searching
 *   - Uses SQLite's FTS5 extension to enable fast, full-text content indexing
 *   - Allows complex text-based queries and relevance ranking
 * 
 * @property {string} card - The primary table storing card metadata
 *   - hash: Unique identifier for the card (Primary Key)
 *   - content: Blob storing the card's content
 *   - g_time: Timestamp for card generation/insertion
 */
export const MCARD_TABLE_SCHEMA = {
  documents: "CREATE VIRTUAL TABLE documents USING fts5( content );",
  card: "CREATE TABLE IF NOT EXISTS card ( hash TEXT PRIMARY KEY, content BLOB NOT NULL, g_time TEXT NOT NULL );"
};

/**
 * TRIGGERS define database-level synchronization mechanisms between tables
 * 
 * @description These triggers ensure data consistency across the card and documents tables
 * 
 * 1. card_insert: 
 *    - Automatically inserts content into the documents table when a new card is added
 *    - Maintains full-text search index in sync with card table
 * 
 * 2. card_update:
 *    - Updates the corresponding content in the documents table when a card is modified
 *    - Ensures search index reflects the latest card content
 * 
 * 3. card_delete:
 *    - Removes the corresponding content from the documents table when a card is deleted
 *    - Keeps the full-text search index clean and up-to-date
 */
export const TRIGGERS = [
  "CREATE TRIGGER card_insert AFTER INSERT ON card BEGIN INSERT INTO documents(content) VALUES (new.content); END;",
  "CREATE TRIGGER card_update AFTER UPDATE ON card BEGIN UPDATE documents SET content = new.content WHERE rowid = (SELECT rowid FROM documents WHERE content = old.content LIMIT 1); END;",
  "CREATE TRIGGER card_delete AFTER DELETE ON card BEGIN DELETE FROM documents WHERE content = old.content; END;"
];
