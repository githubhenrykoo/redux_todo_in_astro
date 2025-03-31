/**
 * CardCollection API Endpoint Tests
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { MCard, MCardFromData } from '../../content/model/mcard.js';
import { CardCollection } from '../../content/model/card-collection.js';
import { SafeBuffer } from '../../utils/bufferPolyfill.js';

// Mock dependencies
vi.mock('../../engine/sqlite_engine.js', () => {
  return {
    SQLiteEngine: vi.fn().mockImplementation(() => {
      return {
        add: vi.fn().mockReturnValue(true),
        get: vi.fn(),
        delete: vi.fn().mockReturnValue(true),
        get_page: vi.fn(),
        search_by_content: vi.fn(),
      };
    })
  };
});

vi.mock('../../utils/storeAdapter.js', () => {
  return {
    getStoreEngine: vi.fn().mockImplementation(() => {
      return {
        add: vi.fn().mockReturnValue(true),
        get: vi.fn(),
        delete: vi.fn().mockReturnValue(true),
        get_page: vi.fn(),
        search_by_content: vi.fn(),
      };
    })
  };
});

vi.mock('../../services/logger.js', () => {
  return {
    default: {
      debug: vi.fn(),
      error: vi.fn()
    }
  };
});

// Helper function to create a mock Response constructor
global.Response = class Response {
  constructor(body, options) {
    this.body = body;
    this.status = options?.status || 200;
    this.headers = options?.headers || {};
  }
};

// Helper function to create a mock URL constructor
global.URL = class URL {
  constructor(url) {
    this.url = url;
    this.searchParams = new Map();
  }
  
  static createMockURL(params) {
    const url = new URL('http://localhost');
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return url;
  }
};

// Import the API handlers after mocks are set up
import { GET, POST, DELETE } from '../../pages/api/card-collection.ts';

describe('CardCollection API Endpoint', () => {
  let mockCardCollection;
  let testCard;
  let testCardHash;
  
  beforeEach(() => {
    // Create a test card
    testCard = new MCard({ test: 'Sample content' });
    testCardHash = 'test-hash-123';
    testCard.hash = testCardHash;
    testCard.g_time = new Date().toISOString();
    
    // Mock card collection methods
    mockCardCollection = new CardCollection({});
    mockCardCollection.add = vi.fn().mockReturnValue(testCardHash);
    mockCardCollection.get = vi.fn().mockImplementation((hash) => 
      hash === testCardHash ? testCard : null
    );
    mockCardCollection.delete = vi.fn().mockReturnValue(true);
    mockCardCollection.get_page = vi.fn().mockReturnValue({
      items: [testCard],
      total_items: 1,
      page_number: 1,
      page_size: 10,
      has_next: false,
      has_previous: false,
      total_pages: 1,
      next_page: null,
      previous_page: null
    });
    mockCardCollection.search_by_content = vi.fn().mockReturnValue({
      items: [testCard],
      total_items: 1,
      page_number: 1,
      page_size: 10,
      has_next: false,
      has_previous: false,
      total_pages: 1,
      next_page: null,
      previous_page: null
    });
    
    // Simulate cross-environment functionality
    vi.mock('../../utils/textEncoderPolyfill.js', () => {
      return {
        encodeText: vi.fn(text => SafeBuffer.from(text, 'utf-8'))
      };
    });
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  // #########################
  // POST Tests (Add)
  // #########################
  describe('POST - Add Card', () => {
    it('should add a card successfully', async () => {
      // Create request
      const request = {
        json: vi.fn().mockResolvedValue({
          action: 'add',
          card: {
            content: { test: 'Sample content' }
          }
        })
      };
      
      // Call API handler
      const response = await POST({ request });
      
      // Parse response body
      const responseBody = JSON.parse(response.body);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.hash).toBe(testCardHash);
      expect(responseBody.timestamp).toBeDefined();
    });
    
    it('should return error if card data is missing', async () => {
      // Create request without card data
      const request = {
        json: vi.fn().mockResolvedValue({
          action: 'add'
        })
      };
      
      // Call API handler
      const response = await POST({ request });
      
      // Parse response body
      const responseBody = JSON.parse(response.body);
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBe('Card data is required');
    });
    
    it('should return error if content is missing', async () => {
      // Create request with empty content
      const request = {
        json: vi.fn().mockResolvedValue({
          action: 'add',
          card: {}
        })
      };
      
      // Call API handler
      const response = await POST({ request });
      
      // Parse response body
      const responseBody = JSON.parse(response.body);
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBe('Card content is required');
    });
    
    it('should handle unknown action', async () => {
      // Create request with invalid action
      const request = {
        json: vi.fn().mockResolvedValue({
          action: 'invalidAction',
          card: { content: 'test' }
        })
      };
      
      // Call API handler
      const response = await POST({ request });
      
      // Parse response body
      const responseBody = JSON.parse(response.body);
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBe('Unknown action: invalidAction');
    });
  });
  
  // #########################
  // GET Tests (Get, GetPage, Search)
  // #########################
  describe('GET - Retrieve operations', () => {
    it('should get a card by hash', async () => {
      // Mock URL with parameters
      const request = {
        url: 'http://localhost/api/card-collection',
      };
      request.url = new URL(request.url);
      request.url.searchParams = new Map([
        ['action', 'get'],
        ['hash', testCardHash]
      ]);
      
      // Call API handler
      const response = await GET({ request });
      
      // Parse response body
      const responseBody = JSON.parse(response.body);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.card.hash).toBe(testCardHash);
      expect(responseBody.card.content).toEqual(testCard.content);
      expect(responseBody.serverTimestamp).toBeDefined();
    });
    
    it('should return 404 if card not found', async () => {
      // Mock URL with parameters for non-existent hash
      const request = {
        url: 'http://localhost/api/card-collection',
      };
      request.url = new URL(request.url);
      request.url.searchParams = new Map([
        ['action', 'get'],
        ['hash', 'non-existent-hash']
      ]);
      
      // Call API handler
      const response = await GET({ request });
      
      // Parse response body
      const responseBody = JSON.parse(response.body);
      
      // Assertions
      expect(response.status).toBe(404);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBe('Card not found');
    });
    
    it('should get a page of cards', async () => {
      // Mock URL with parameters
      const request = {
        url: 'http://localhost/api/card-collection',
      };
      request.url = new URL(request.url);
      request.url.searchParams = new Map([
        ['action', 'getPage'],
        ['pageNumber', '1'],
        ['pageSize', '10']
      ]);
      
      // Call API handler
      const response = await GET({ request });
      
      // Parse response body
      const responseBody = JSON.parse(response.body);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.items).toBeDefined();
      expect(responseBody.total_items).toBe(1);
      expect(responseBody.page_number).toBe(1);
      expect(responseBody.serverTimestamp).toBeDefined();
    });
    
    it('should search cards by content', async () => {
      // Mock URL with parameters
      const request = {
        url: 'http://localhost/api/card-collection',
      };
      request.url = new URL(request.url);
      request.url.searchParams = new Map([
        ['action', 'searchByContent'],
        ['searchTerm', 'Sample'],
        ['pageNumber', '1'],
        ['pageSize', '10']
      ]);
      
      // Call API handler
      const response = await GET({ request });
      
      // Parse response body
      const responseBody = JSON.parse(response.body);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.items).toBeDefined();
      expect(responseBody.total_items).toBe(1);
      expect(responseBody.serverTimestamp).toBeDefined();
    });
    
    it('should error if search term is empty', async () => {
      // Mock URL with parameters
      const request = {
        url: 'http://localhost/api/card-collection',
      };
      request.url = new URL(request.url);
      request.url.searchParams = new Map([
        ['action', 'searchByContent'],
        ['searchTerm', ''],
        ['pageNumber', '1'],
        ['pageSize', '10']
      ]);
      
      // Call API handler
      const response = await GET({ request });
      
      // Parse response body
      const responseBody = JSON.parse(response.body);
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBe('Search string cannot be empty');
    });
  });
  
  // #########################
  // DELETE Tests
  // #########################
  describe('DELETE - Delete card', () => {
    it('should delete a card by hash', async () => {
      // Mock URL with parameters
      const request = {
        url: 'http://localhost/api/card-collection',
      };
      request.url = new URL(request.url);
      request.url.searchParams = new Map([
        ['action', 'delete'],
        ['hash', testCardHash]
      ]);
      
      // Call API handler
      const response = await DELETE({ request });
      
      // Parse response body
      const responseBody = JSON.parse(response.body);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.timestamp).toBeDefined();
    });
    
    it('should return 404 if card to delete does not exist', async () => {
      // Mock URL with parameters
      const request = {
        url: 'http://localhost/api/card-collection',
      };
      request.url = new URL(request.url);
      request.url.searchParams = new Map([
        ['action', 'delete'],
        ['hash', 'non-existent-hash']
      ]);
      
      // Call API handler
      const response = await DELETE({ request });
      
      // Parse response body
      const responseBody = JSON.parse(response.body);
      
      // Assertions
      expect(response.status).toBe(404);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBe('Card not found');
    });
    
    it('should validate hash parameter is provided', async () => {
      // Mock URL with missing hash
      const request = {
        url: 'http://localhost/api/card-collection',
      };
      request.url = new URL(request.url);
      request.url.searchParams = new Map([
        ['action', 'delete']
      ]);
      
      // Call API handler
      const response = await DELETE({ request });
      
      // Parse response body
      const responseBody = JSON.parse(response.body);
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBe('Hash is required');
    });
  });
  
  // #########################
  // Cross-Environment Tests
  // #########################
  describe('Cross-Environment Compatibility', () => {
    it('should use SafeBuffer for content encoding', async () => {
      const contentText = 'Test content';
      const encodedContent = SafeBuffer.from(contentText);
      
      // Create a test with text content
      const textCard = new MCard(contentText);
      
      // Ensure SafeBuffer is used in encoding
      expect(SafeBuffer.isBuffer(encodedContent)).toBe(true);
    });
    
    it('should use MCardFromData for retrieving existing cards', async () => {
      // Create a card from existing data
      const existingContent = { test: 'Existing content' };
      const hash = 'existing-hash-123';
      const timestamp = new Date().toISOString();
      
      const fromDataCard = new MCardFromData(existingContent, hash, timestamp);
      
      // Ensure properties are set correctly
      expect(fromDataCard.hash).toBe(hash);
      expect(fromDataCard.content).toEqual(existingContent);
      expect(fromDataCard.g_time).toBe(timestamp);
    });
  });
});
