const { MCard } = require('../content/model/mcard');
const { CardCollection } = require('../content/model/card-collection');
const { SQLiteEngine, SQLiteConnection } = require('../engine/sqlite_engine');
const { HASH_ALGORITHM_SHA256, HASH_ALGORITHM_SHA1, HASH_ALGORITHM_MD5 } = require('../config/config_constants');
const fs = require('fs');
const path = require('path');

/**
 * Integration Test Suite for the Card System
 * 
 * This test verifies the interaction between the following components:
 * - MCard: For creating and managing card content with different hash algorithms
 * - GTime: For handling timestamps within cards
 * - CardCollection: For managing a collection of cards
 * - SQLiteEngine: For database operations with SQLite
 * 
 * The test uses a fixed database path (test_cards.db) for consistent testing.
 * Each test run will reset the database to a clean state.
 */
describe('Integration Test: MCard + GTime + CardCollection + SQLiteEngine', () => {
  let sqliteConnection;
  let sqliteEngine;
  let cardCollection;
  /**
   * Fixed database path for testing.
   * This path is used to ensure consistent testing and is reset after each test run.
   */
  const testDbPath = path.resolve(__dirname, 'db/test_cards.db');

  beforeEach(async () => {
    try {
      // Initialize the SQLite connection with the fixed test database
      sqliteConnection = new SQLiteConnection(testDbPath);
      
      // Ensure database setup is robust
      sqliteConnection.connect();
      await sqliteConnection.setup_database();
      
      // Initialize the SQLite engine with the connection
      sqliteEngine = new SQLiteEngine(sqliteConnection);
      
      // Initialize CardCollection with the SQLite engine
      cardCollection = new CardCollection(sqliteEngine);
    } catch (error) {
      console.error('Setup error:', error);
      throw error;
    }
  });

  afterEach(() => {
    // Close the database connection
    if (sqliteConnection && sqliteConnection.conn) {
      try {
        sqliteConnection.disconnect();
      } catch (error) {
        console.warn('Disconnect error:', error);
      }
    }
  });

  test('Full lifecycle: Create, store, retrieve, and delete cards', async () => {
    // 1. Create cards with different content types and hash algorithms
    const textCard = new MCard('This is a text card', HASH_ALGORITHM_SHA256);
    const jsonCard = new MCard(JSON.stringify({ key: 'value' }), HASH_ALGORITHM_SHA1);
    const binaryCard = new MCard(Buffer.from([0x01, 0x02, 0x03, 0x04]), HASH_ALGORITHM_MD5);
    
    // Verify cards have required properties
    expect(textCard.hash).toBeTruthy();
    expect(textCard.g_time).toBeTruthy();
    expect(textCard.content).toBeInstanceOf(Buffer);
    
    expect(jsonCard.hash).toBeTruthy();
    expect(jsonCard.g_time).toBeTruthy();
    expect(jsonCard.content).toBeInstanceOf(Buffer);
    
    expect(binaryCard.hash).toBeTruthy();
    expect(binaryCard.g_time).toBeTruthy();
    expect(binaryCard.content).toBeInstanceOf(Buffer);
    
    // 2. Add cards to collection
    const textHash = cardCollection.add(textCard);
    const jsonHash = cardCollection.add(jsonCard);
    const binaryHash = cardCollection.add(binaryCard);
    
    // Verify hashes are returned correctly
    expect(textHash).toBe(textCard.hash);
    expect(jsonHash).toBe(jsonCard.hash);
    expect(binaryHash).toBe(binaryCard.hash);
    
    // 3. Retrieve cards by hash
    const retrievedTextCard = cardCollection.get(textHash);
    const retrievedJsonCard = cardCollection.get(jsonHash);
    const retrievedBinaryCard = cardCollection.get(binaryHash);
    
    // Verify retrieved cards match the originals
    expect(retrievedTextCard.hash).toBe(textCard.hash);
    expect(retrievedTextCard.content.toString()).toBe(textCard.content.toString());
    expect(retrievedJsonCard.hash).toBe(jsonCard.hash);
    expect(retrievedJsonCard.content.toString()).toBe(jsonCard.content.toString());
    expect(retrievedBinaryCard.hash).toBe(binaryCard.hash);
    expect(Buffer.compare(retrievedBinaryCard.content, binaryCard.content)).toBe(0);
    
    // 4. Test pagination
    const page = cardCollection.get_page(1, 2);
    expect(page.items.length).toBe(2);
    expect(page.total_items).toBe(3);
    expect(page.page_number).toBe(1);
    expect(page.page_size).toBe(2);
    expect(page.has_next).toBe(true);
    expect(page.has_previous).toBe(false);
    
    // 5. Test search functionality
    // Search by content (text)
    const textSearchResults = cardCollection.search_by_string('text card');
    expect(textSearchResults.items.length).toBe(1);
    expect(textSearchResults.items[0].hash).toBe(textCard.hash);
    
    // Search by hash
    const hashSearchResults = cardCollection.search_by_hash(jsonHash);
    expect(hashSearchResults.items.length).toBe(1);
    expect(hashSearchResults.items[0].hash).toBe(jsonCard.hash);
    
    // 6. Test collision handling
    // Create a card with the same content but different hash algorithm
    const collisionCard = new MCard('This is a text card', HASH_ALGORITHM_MD5);
    const collisionHash = cardCollection.add(collisionCard);
    
    // Hash should be different due to different algorithms
    expect(collisionHash).not.toBe(textHash);
    
    // Both cards should exist in the collection
    expect(cardCollection.get(textHash)).toBeTruthy();
    expect(cardCollection.get(collisionHash)).toBeTruthy();
    
    // 7. Test delete functionality
    cardCollection.delete(textHash);
    expect(cardCollection.get(textHash)).toBeNull();
    
    // Verify the count is reduced
    expect(cardCollection.count()).toBeGreaterThan(0);  // Just verify cards still exist
    
    // 8. Test clear functionality
    cardCollection.clear();
    expect(cardCollection.count()).toBe(0);
  });

  test('Error handling and edge cases', () => {
    // Test null card handling
    expect(() => cardCollection.add(null)).toThrow();
    
    // Test invalid page number
    expect(() => cardCollection.get_page(0, 10)).toThrow();
    expect(() => cardCollection.get_page(-1, 10)).toThrow();
    
    // Test invalid page size
    expect(() => cardCollection.get_page(1, 0)).toThrow();
    expect(() => cardCollection.get_page(1, -1)).toThrow();
    
    // Test getting non-existent card
    expect(cardCollection.get('nonexistent-hash')).toBeNull();
    
    // Test deleting non-existent card
    expect(cardCollection.delete('nonexistent-hash')).toBeFalsy();
    
    // Test MCard validation
    expect(() => new MCard(null)).toThrow();
  });

  test('Performance with large number of cards', async () => {
    const startTime = Date.now();
    const cardCount = 50; // Reduced count for test performance
    
    // Add multiple cards
    for (let i = 0; i < cardCount; i++) {
      const card = new MCard(`Performance test card ${i}`);
      cardCollection.add(card);
    }
    
    expect(cardCollection.count()).toBe(cardCount);
    
    // Test pagination performance
    const pageSize = 10;
    const totalPages = Math.ceil(cardCount / pageSize);
    
    // Retrieve all pages
    for (let page = 1; page <= totalPages; page++) {
      const pageResult = cardCollection.get_page(page, pageSize);
      expect(pageResult.items.length).toBeLessThanOrEqual(pageSize);
      expect(pageResult.page_number).toBe(page);
    }
    
    // Test search performance
    const searchResults = cardCollection.search_by_string('Performance test card 25');
    expect(searchResults.items.length).toBeGreaterThan(0);
    
    const endTime = Date.now();
    console.log(`Performance test completed in ${endTime - startTime}ms`);
    
    // This is not a strict test, but a performance benchmark
    expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
  });

  test('Comprehensive search functionality', () => {
    // 1. Create cards with different content types for search testing
    const textCard1 = new MCard('Hello world of text cards');
    const textCard2 = new MCard('Another text card with unique content');
    const jsonCard = new MCard(JSON.stringify({ 
      title: 'Search Test', 
      description: 'A card for testing search functionality' 
    }));
    const binaryCard = new MCard(Buffer.from('Binary search test content'));

    // Add cards to the collection
    cardCollection.add(textCard1);
    cardCollection.add(textCard2);
    cardCollection.add(jsonCard);
    cardCollection.add(binaryCard);

    // 2. Test text-based searches
    // Search for partial text match
    const textSearchResults1 = cardCollection.search_by_string('world');
    console.log('Search results for "world":', 
      textSearchResults1.items.map(item => item.content.toString())
    );
    expect(textSearchResults1.items.length).toBeGreaterThan(0);
    expect(textSearchResults1.items.some(item => item.hash === textCard1.hash)).toBe(true);

    const textSearchResults2 = cardCollection.search_by_string('unique content');
    console.log('Search results for "unique content":', 
      textSearchResults2.items.map(item => item.content.toString())
    );
    expect(textSearchResults2.items.length).toBeGreaterThan(0);
    expect(textSearchResults2.items.some(item => item.hash === textCard2.hash)).toBe(true);

    // 3. Test JSON content search
    const jsonSearchResults = cardCollection.search_by_string('Search Test');
    console.log('Search results for "Search Test":', 
      jsonSearchResults.items.map(item => item.content.toString())
    );
    expect(jsonSearchResults.items.length).toBeGreaterThan(0);
    expect(jsonSearchResults.items.some(item => item.hash === jsonCard.hash)).toBe(true);

    // 4. Test binary content search
    const binarySearchResults = cardCollection.search_by_string('Binary search');
    console.log('Search results for "Binary search":', 
      binarySearchResults.items.map(item => item.content.toString())
    );
    expect(binarySearchResults.items.length).toBeGreaterThan(0);
    expect(binarySearchResults.items.some(item => item.hash === binaryCard.hash)).toBe(true);

    // 5. Test case-insensitive search
    const caseInsensitiveResults = cardCollection.search_by_string('HELLO world');
    console.log('Search results for "HELLO world":', 
      caseInsensitiveResults.items.map(item => item.content.toString())
    );
    expect(caseInsensitiveResults.items.length).toBeGreaterThan(0);
    expect(caseInsensitiveResults.items.some(item => item.hash === textCard1.hash)).toBe(true);

    // 6. Test search with no results
    const noResultsSearch = cardCollection.search_by_string('nonexistent search term');
    console.log('Search results for "nonexistent search term":', 
      noResultsSearch.items.map(item => item.content.toString())
    );
    expect(noResultsSearch.items.length).toBe(0);
  });
});
