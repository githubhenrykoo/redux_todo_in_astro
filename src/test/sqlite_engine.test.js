import { SQLiteEngine, SQLiteConnection } from 'src/engine/sqlite_engine.js';
import { MCardFromData } from 'src/content/model/mcard.js';
import { GTime } from 'src/content/model/g_time.js';
import fs from 'fs';
import path from 'path';

// Temporary test database path
const TEST_DB_PATH = path.join(__dirname, 'test_cards.db');

describe('SQLiteEngine', () => {
  let sqliteEngine;
  let testCard;

  beforeEach(() => {
    // Create a new SQLite connection with a unique test database path for each test
    // This ensures that each test starts with a clean, isolated database
    const connection = new SQLiteConnection(TEST_DB_PATH);
    sqliteEngine = new SQLiteEngine(connection);

    // Create a test card with predefined content and hash
    // This card will be used in multiple tests to verify basic database operations
    const timestamp = GTime.stampNow();
    testCard = new MCardFromData(
      Buffer.from(JSON.stringify({ 
        title: 'Test Card', 
        content: 'This is a test card content' 
      })), 
      'test_hash_123', 
      timestamp
    );
  });

  afterEach(() => {
    // Clean up after each test:
    // 1. Clear all data from the database
    // 2. Disconnect the database connection
    // 3. Remove the temporary database file
    // This ensures each test starts with a clean slate and no leftover data
    sqliteEngine.clear();
    sqliteEngine.connection.disconnect();

    // Remove the test database file to prevent file accumulation
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  /**
   * Test adding a card to the database.
   * Verifies that the add() method returns the hash of the added card.
   */
  test('should add a card to the database', () => {
    const hash = sqliteEngine.add(testCard);
    expect(hash).toBe(testCard.hash);
  });

  /**
   * Test retrieving a card by its hash.
   * Verifies that the retrieved card matches the original card.
   */
  test('should retrieve a card by hash', () => {
    sqliteEngine.add(testCard);
    const retrievedCard = sqliteEngine.get(testCard.hash);
    
    expect(retrievedCard).toBeTruthy(); // Card should exist
    expect(retrievedCard.hash).toBe(testCard.hash); // Hash should match
    expect(retrievedCard.content).toEqual(testCard.content); // Content should match
  });

  /**
   * Test retrieving a non-existent card.
   * Verifies that attempting to retrieve a card with a non-existent hash returns null.
   */
  test('should return null when retrieving non-existent card', () => {
    const nonExistentCard = sqliteEngine.get('non_existent_hash');
    expect(nonExistentCard).toBeNull();
  });

  /**
   * Test deleting a card.
   * Verifies that the delete() method returns true and the card is no longer retrievable.
   */
  test('should delete a card', () => {
    sqliteEngine.add(testCard);
    const deleteResult = sqliteEngine.delete(testCard.hash);
    
    expect(deleteResult).toBe(true); // Deletion should return true
    
    const retrievedCard = sqliteEngine.get(testCard.hash);
    expect(retrievedCard).toBeNull(); // Card should no longer exist
  });

  /**
   * Test pagination functionality.
   * Verifies that the get_page() method returns the correct number of items and pagination details.
   */
  test('should get paginated results', () => {
    const cards = [
      new MCardFromData(Buffer.from(JSON.stringify({ title: 'Card 1' })), 'hash1', GTime.stampNow()),
      new MCardFromData(Buffer.from(JSON.stringify({ title: 'Card 2' })), 'hash2', GTime.stampNow()),
      new MCardFromData(Buffer.from(JSON.stringify({ title: 'Card 3' })), 'hash3', GTime.stampNow())
    ];

    cards.forEach(card => sqliteEngine.add(card));

    // Retrieve first page with 2 items
    const page = sqliteEngine.get_page(1, 2);
    
    expect(page.items.length).toBe(2); // Should return 2 items
    expect(page.total_items).toBe(3); // Total number of cards
    expect(page.page_number).toBe(1); // Current page number
    expect(page.page_size).toBe(2); // Page size
    expect(page.has_next).toBe(true); // More items available
  });

  /**
   * Test search functionality.
   * Verifies that the search_by_string() method returns the correct number of items and search results.
   */
  test('should search cards by string', () => {
    const cards = [
      new MCardFromData(Buffer.from(JSON.stringify({ title: 'Search Test Card 1', content: 'First test card' })), 'hash1', GTime.stampNow()),
      new MCardFromData(Buffer.from(JSON.stringify({ title: 'Search Test Card 2', content: 'Second test card' })), 'hash2', GTime.stampNow())
    ];

    cards.forEach(card => sqliteEngine.add(card));

    // Search for cards containing 'test card'
    const searchResults = sqliteEngine.search_by_string('test card');
    
    expect(searchResults.items.length).toBe(2); // Both cards should match
    expect(searchResults.total_items).toBe(2); // Total matching cards
  });

  /**
   * Test counting the total number of cards.
   * Verifies that the count() method returns the correct number of cards.
   */
  test('should count total cards', () => {
    const cards = [
      new MCardFromData(Buffer.from(JSON.stringify({ title: 'Card 1' })), 'hash1', GTime.stampNow()),
      new MCardFromData(Buffer.from(JSON.stringify({ title: 'Card 2' })), 'hash2', GTime.stampNow())
    ];

    cards.forEach(card => sqliteEngine.add(card));

    // Count total number of cards
    const cardCount = sqliteEngine.count();
    expect(cardCount).toBe(2); // Should match number of added cards
  });

  /**
   * Test transaction rollback.
   * Verifies that the rollback() method correctly reverts changes made during the transaction.
   */
  test('should handle transaction rollback', () => {
    try {
      sqliteEngine.begin(); // Start a transaction
      sqliteEngine.add(testCard); // Add a card
      sqliteEngine.rollback(); // Rollback the transaction

      // Verify the card was not added
      const retrievedCard = sqliteEngine.get(testCard.hash);
      expect(retrievedCard).toBeNull();
    } catch (error) {
      console.log('Transaction rollback failed:', error);
      fail('Transaction rollback failed');
    }
  });

  /**
   * Test transaction commit.
   * Verifies that the commit() method correctly commits changes made during the transaction.
   */
  test('should handle transaction commit', () => {
    try {
      sqliteEngine.begin(); // Start a transaction
      sqliteEngine.add(testCard); // Add a card
      sqliteEngine.commit(); // Commit the transaction

      // Verify the card was added
      const retrievedCard = sqliteEngine.get(testCard.hash);
      expect(retrievedCard).toBeTruthy();
    } catch (error) {
      console.log('Transaction commit failed:', error);
      fail('Transaction commit failed');
    }
  });

  /**
   * Test retrieving all cards.
   * Verifies that the get_all() method returns the correct number of cards and their details.
   */
  test('should get all cards', () => {
    const cards = [
      new MCardFromData(Buffer.from(JSON.stringify({ title: 'Card 1' })), 'hash1', GTime.stampNow()),
      new MCardFromData(Buffer.from(JSON.stringify({ title: 'Card 2' })), 'hash2', GTime.stampNow()),
      new MCardFromData(Buffer.from(JSON.stringify({ title: 'Card 3' })), 'hash3', GTime.stampNow())
    ];

    cards.forEach(card => {
      console.log('Adding card:', card.hash);
      sqliteEngine.add(card);
    });

    // Retrieve all cards
    const allCards = sqliteEngine.get_all();
    
    // Log details for debugging
    console.log('All cards:', allCards);
    console.log('Items:', allCards.items);
    console.log('Total items:', allCards.total_items);

    // Verify the number of cards
    expect(allCards.items.length).toBe(3);
    expect(allCards.total_items).toBe(3);
  });

  /**
   * Test error handling for invalid page numbers.
   * Verifies that the get_page() method throws an error for page numbers less than 1.
   */
  test('should throw error for invalid page number', () => {
    expect(() => sqliteEngine.get_page(0, 10)).toThrow('Page number and size must be >= 1');
    expect(() => sqliteEngine.get_page(-1, 10)).toThrow('Page number and size must be >= 1');
  });

  /**
   * Test error handling for invalid page sizes.
   * Verifies that the get_page() method throws an error for page sizes less than 1.
   */
  test('should throw error for invalid page size', () => {
    expect(() => sqliteEngine.get_page(1, 0)).toThrow('Page number and size must be >= 1');
    expect(() => sqliteEngine.get_page(1, -1)).toThrow('Page number and size must be >= 1');
  });
});
