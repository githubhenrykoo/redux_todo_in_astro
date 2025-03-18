import { SQLiteEngine, SQLiteConnection } from 'src/engine/sqlite_engine.js';
import { MCardFromData } from 'src/content/model/mcard.js';
import fs from 'fs';
import path from 'path';

// Temporary test database path
const TEST_DB_PATH = path.join(__dirname, 'test_cards.sqlite');

describe('SQLiteEngine', () => {
  let sqliteEngine;
  let testCard;

  beforeEach(() => {
    // Create a new SQLite connection with a test database path
    const connection = new SQLiteConnection(TEST_DB_PATH);
    sqliteEngine = new SQLiteEngine(connection);

    // Create a test card
    testCard = new MCardFromData(
      JSON.stringify({ 
        title: 'Test Card', 
        content: 'This is a test card content' 
      }), 
      'test_hash_123', 
      Date.now()
    );
  });

  afterEach(() => {
    // Clear the database after each test
    sqliteEngine.clear();
    sqliteEngine.connection.disconnect();

    // Remove the test database file
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  test('should add a card to the database', () => {
    const hash = sqliteEngine.add(testCard);
    expect(hash).toBe(testCard.hash);
  });

  test('should retrieve a card by hash', () => {
    sqliteEngine.add(testCard);
    const retrievedCard = sqliteEngine.get(testCard.hash);
    
    expect(retrievedCard).toBeTruthy();
    expect(retrievedCard.hash).toBe(testCard.hash);
    expect(retrievedCard.content).toBe(testCard.content);
  });

  test('should return null when retrieving non-existent card', () => {
    const nonExistentCard = sqliteEngine.get('non_existent_hash');
    expect(nonExistentCard).toBeNull();
  });

  test('should delete a card', () => {
    sqliteEngine.add(testCard);
    const deleteResult = sqliteEngine.delete(testCard.hash);
    
    expect(deleteResult).toBe(true);
    
    const retrievedCard = sqliteEngine.get(testCard.hash);
    expect(retrievedCard).toBeNull();
  });

  test('should get paginated results', () => {
    // Add multiple cards
    const cards = [
      new MCardFromData(JSON.stringify({ title: 'Card 1' }), 'hash1', Date.now()),
      new MCardFromData(JSON.stringify({ title: 'Card 2' }), 'hash2', Date.now()),
      new MCardFromData(JSON.stringify({ title: 'Card 3' }), 'hash3', Date.now())
    ];

    cards.forEach(card => sqliteEngine.add(card));

    const page = sqliteEngine.get_page(1, 2);
    
    expect(page.items.length).toBe(2);
    expect(page.total_items).toBe(3);
    expect(page.page_number).toBe(1);
    expect(page.page_size).toBe(2);
    expect(page.has_next).toBe(true);
  });

  test('should search cards by string', () => {
    // Add multiple cards with different content
    const cards = [
      new MCardFromData(JSON.stringify({ title: 'Search Test Card 1', content: 'First test card' }), 'hash1', Date.now()),
      new MCardFromData(JSON.stringify({ title: 'Search Test Card 2', content: 'Second test card' }), 'hash2', Date.now())
    ];

    cards.forEach(card => sqliteEngine.add(card));

    const searchResults = sqliteEngine.search_by_string('test card');
    
    expect(searchResults.items.length).toBe(2);
    expect(searchResults.total_items).toBe(2);
  });

  test('should count total cards', () => {
    // Add multiple cards
    const cards = [
      new MCardFromData(JSON.stringify({ title: 'Card 1' }), 'hash1', Date.now()),
      new MCardFromData(JSON.stringify({ title: 'Card 2' }), 'hash2', Date.now())
    ];

    cards.forEach(card => sqliteEngine.add(card));

    const cardCount = sqliteEngine.count();
    expect(cardCount).toBe(2);
  });

  test('should handle transaction rollback', () => {
    try {
      sqliteEngine.begin();
      sqliteEngine.add(testCard);
      sqliteEngine.rollback();

      const retrievedCard = sqliteEngine.get(testCard.hash);
      expect(retrievedCard).toBeNull();
    } catch (error) {
      console.log('Transaction rollback failed:', error);
      fail('Transaction rollback failed');
    }
  });

  test('should handle transaction commit', () => {
    try {
      sqliteEngine.begin();
      sqliteEngine.add(testCard);
      sqliteEngine.commit();

      const retrievedCard = sqliteEngine.get(testCard.hash);
      expect(retrievedCard).toBeTruthy();
    } catch (error) {
      console.log('Transaction commit failed:', error);
      fail('Transaction commit failed');
    }
  });

  test('should get all cards', () => {
    // Add multiple cards
    const cards = [
      new MCardFromData(JSON.stringify({ title: 'Card 1' }), 'hash1', Date.now()),
      new MCardFromData(JSON.stringify({ title: 'Card 2' }), 'hash2', Date.now()),
      new MCardFromData(JSON.stringify({ title: 'Card 3' }), 'hash3', Date.now())
    ];

    cards.forEach(card => sqliteEngine.add(card));

    const allCards = sqliteEngine.get_all();
    
    expect(allCards.items.length).toBe(3);
    expect(allCards.total_items).toBe(3);
  });

  test('should throw error for invalid page number', () => {
    expect(() => sqliteEngine.get_page(0, 10)).toThrow('Page number must be >= 1');
    expect(() => sqliteEngine.get_page(-1, 10)).toThrow('Page number must be >= 1');
  });

  test('should throw error for invalid page size', () => {
    expect(() => sqliteEngine.get_page(1, 0)).toThrow('Page size must be >= 1');
    expect(() => sqliteEngine.get_page(1, -1)).toThrow('Page size must be >= 1');
  });
});
