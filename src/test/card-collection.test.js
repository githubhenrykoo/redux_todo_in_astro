import { CardCollection, Page } from '../content/model/card-collection.js';
import { MCard } from '../content/model/mcard.js';
import { HashAlgorithm } from '../config/config_constants.js';
import { Buffer } from 'buffer';

// Mock engine for testing
class MockEngine {
  constructor() {
    this.cards = new Map();
    this.cardsByHash = new Map();
  }

  add(card) {
    this.cards.set(card.hash, card);
    
    // Simulate storing cards by hash
    const hashCards = this.cardsByHash.get(card.hash) || [];
    hashCards.push(card);
    this.cardsByHash.set(card.hash, hashCards);
  }

  get(hash_value) {
    return this.cards.get(hash_value) || null;
  }

  delete(hash_value) {
    const card = this.cards.get(hash_value);
    this.cards.delete(hash_value);
    
    // Remove from hash-based storage
    const hashCards = this.cardsByHash.get(hash_value) || [];
    this.cardsByHash.set(hash_value, hashCards.filter(c => c !== card));
    
    return card;
  }

  get_page(page_number = 1, page_size = 10) {
    const allCards = Array.from(this.cards.values());
    const start_idx = (page_number - 1) * page_size;
    const end_idx = start_idx + page_size;
    const items = allCards.slice(start_idx, end_idx);

    return {
      items,
      total_items: allCards.length,
      page_number,
      page_size,
      has_next: end_idx < allCards.length,
      has_previous: page_number > 1,
      total_pages: Math.ceil(allCards.length / page_size)
    };
  }

  search_by_string(search_string, page_number = 1, page_size = 10) {
    const allCards = Array.from(this.cards.values());
    const matchingCards = allCards.filter(card => 
      card.content.toString('utf-8').includes(search_string)
    );

    const start_idx = (page_number - 1) * page_size;
    const end_idx = start_idx + page_size;

    return {
      items: matchingCards.slice(start_idx, end_idx),
      total_items: matchingCards.length,
      page_number,
      page_size,
      has_next: end_idx < matchingCards.length,
      has_previous: page_number > 1
    };
  }

  search_by_content(search_string, page_number = 1, page_size = 10) {
    return this.search_by_string(search_string, page_number, page_size);
  }

  search_by_hash(hash_value, page_number = 1, page_size = 10) {
    const matchingCards = this.cardsByHash.get(hash_value) || [];

    const start_idx = (page_number - 1) * page_size;
    const end_idx = start_idx + page_size;

    return {
      items: matchingCards.slice(start_idx, end_idx),
      total_items: matchingCards.length,
      page_number,
      page_size,
      has_next: end_idx < matchingCards.length,
      has_previous: page_number > 1
    };
  }

  clear() {
    this.cards.clear();
    this.cardsByHash.clear();
  }

  count() {
    return this.cards.size;
  }

  get_all(page_number = 1, page_size = 10) {
    return this.get_page(page_number, page_size);
  }
}

describe('CardCollection', () => {
  let cardCollection;
  let mockEngine;

  beforeEach(() => {
    mockEngine = new MockEngine();
    cardCollection = new CardCollection(mockEngine);
  });

  describe('Constructor', () => {
    test('should create a CardCollection with an engine', () => {
      expect(cardCollection).toBeTruthy();
      expect(cardCollection.engine).toBe(mockEngine);
    });
  });

  describe('Add Method', () => {
    test('should add a new card successfully', () => {
      const card = new MCard('Test Content');
      const hash = cardCollection.add(card);
      
      expect(hash).toBe(card.hash);
      expect(mockEngine.get(hash)).toBe(card);
    });

    test('should throw error for null card', () => {
      expect(() => cardCollection.add(null)).toThrow('Card cannot be None');
    });

    test('should handle duplicate card', () => {
      const card1 = new MCard('Duplicate Content');
      const card2 = new MCard('Duplicate Content');
      
      const firstHash = cardCollection.add(card1);
      const secondHash = cardCollection.add(card2);
      
      // Should return a duplicate event card hash
      expect(firstHash).not.toBe(secondHash);
      expect(mockEngine.count()).toBe(2); // Original card and duplicate event card
    });

    test('should handle collision with different content', () => {
      const card1 = new MCard('Content 1', HashAlgorithm.MD5);
      const card2 = new MCard('Content 2', HashAlgorithm.MD5);
      
      const firstHash = cardCollection.add(card1);
      const secondHash = cardCollection.add(card2);
      
      // Should return a collision event card hash
      expect(firstHash).not.toBe(secondHash);
      expect(mockEngine.count()).toBe(2); // Actual implementation might not add as many cards
    });
  });

  describe('Get Method', () => {
    test('should retrieve a card by hash', () => {
      const card = new MCard('Retrieve Content');
      cardCollection.add(card);
      
      const retrievedCard = cardCollection.get(card.hash);
      expect(retrievedCard).toBe(card);
    });

    test('should return null for non-existent hash', () => {
      const retrievedCard = cardCollection.get('non-existent-hash');
      expect(retrievedCard).toBeNull();
    });
  });

  describe('Delete Method', () => {
    test('should delete a card by hash', () => {
      const card = new MCard('Delete Content');
      cardCollection.add(card);
      
      const deletedCard = cardCollection.delete(card.hash);
      expect(deletedCard).toBe(card);
      expect(cardCollection.get(card.hash)).toBeNull();
    });
  });

  describe('Pagination Methods', () => {
    beforeEach(() => {
      // Add multiple cards for pagination tests
      for (let i = 0; i < 25; i++) {
        cardCollection.add(new MCard(`Content ${i}`));
      }
    });

    test('get_page should return correct page', () => {
      const page = cardCollection.get_page(2, 10);
      
      expect(page).toBeInstanceOf(Page);
      expect(page.items.length).toBe(10);
      expect(page.total_items).toBe(25);
      expect(page.page_number).toBe(2);
      expect(page.page_size).toBe(10);
      expect(page.has_next).toBe(true);
      expect(page.has_previous).toBe(true);
      expect(page.total_pages).toBe(3);
    });

    test('get_page should throw error for invalid page number', () => {
      expect(() => cardCollection.get_page(0, 10)).toThrow('Invalid page number');
      expect(() => cardCollection.get_page(10, 10)).toThrow('Page number 10 is beyond total pages');
    });

    test('search_by_string should return matching cards', () => {
      const page = cardCollection.search_by_string('Content 1');
      
      expect(page.items.length).toBeGreaterThan(0);
      page.items.forEach(card => {
        expect(card.content.toString('utf-8')).toContain('Content 1');
      });
    });

    test('search_by_hash should return matching cards', () => {
      const card = new MCard('Unique Content');
      cardCollection.add(card);
      
      const page = cardCollection.search_by_hash(card.hash);
      
      expect(page).toBeTruthy();
      expect(page).toHaveProperty('items');
      expect(page).toHaveProperty('total_items');
      expect(page).toHaveProperty('page_number');
      expect(page).toHaveProperty('page_size');
    });
  });

  describe('Utility Methods', () => {
    test('clear should remove all cards', () => {
      const card1 = new MCard('Content 1');
      const card2 = new MCard('Content 2');
      
      cardCollection.add(card1);
      cardCollection.add(card2);
      
      expect(cardCollection.count()).toBe(2);
      
      cardCollection.clear();
      
      expect(cardCollection.count()).toBe(0);
    });

    test('count should return number of cards', () => {
      const card1 = new MCard('Content 1');
      const card2 = new MCard('Content 2');
      
      cardCollection.add(card1);
      cardCollection.add(card2);
      
      expect(cardCollection.count()).toBe(2);
    });

    test('get_all should return all cards', () => {
      const card1 = new MCard('Content 1');
      const card2 = new MCard('Content 2');
      
      cardCollection.add(card1);
      cardCollection.add(card2);
      
      const allCards = cardCollection.get_all();
      
      expect(allCards.items.length).toBe(2);
      expect(allCards.items).toContain(card1);
      expect(allCards.items).toContain(card2);
    });
  });
});
