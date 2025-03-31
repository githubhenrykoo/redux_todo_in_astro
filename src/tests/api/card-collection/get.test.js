/**
 * Tests for CardCollection Get API endpoint
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { MCard } from '../../../content/model/mcard.js';
import { CardCollection } from '../../../content/model/card-collection.js';

// Mock dependencies
vi.mock('../../../utils/storeAdapter.js', () => {
  return {
    getStoreEngine: vi.fn().mockImplementation(() => {
      return {
        add: vi.fn().mockReturnValue(true),
        get: vi.fn(),
        delete: vi.fn().mockReturnValue(true),
      };
    })
  };
});

vi.mock('../../../services/logger.js', () => {
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

// Import the API handler after mocks are set up
import { GET } from '../../../pages/api/card-collection/get.ts';

describe('CardCollection Get API Endpoint', () => {
  let mockCardCollection;
  let testCard;
  let testCardHash;
  
  beforeEach(() => {
    // Create a test card
    testCard = new MCard({ test: 'Sample content' });
    testCardHash = 'test-hash-123';
    testCard.hash = testCardHash;
    testCard.g_time = new Date().toISOString();
    testCard.hash_algorithm = 'sha256';
    testCard.get_content_type = vi.fn().mockReturnValue('application/json');
    
    // Mock card collection get method
    vi.spyOn(CardCollection.prototype, 'get').mockImplementation((hash) => 
      hash === testCardHash ? testCard : null
    );
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should get a card by hash', async () => {
    // Mock URL with parameters
    const request = {
      url: 'http://localhost/api/card-collection/get',
    };
    request.url = new URL(request.url);
    request.url.searchParams = new Map([
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
      url: 'http://localhost/api/card-collection/get',
    };
    request.url = new URL(request.url);
    request.url.searchParams = new Map([
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
  
  it('should require hash parameter', async () => {
    // Mock URL with missing hash
    const request = {
      url: 'http://localhost/api/card-collection/get',
    };
    request.url = new URL(request.url);
    request.url.searchParams = new Map();
    
    // Call API handler
    const response = await GET({ request });
    
    // Parse response body
    const responseBody = JSON.parse(response.body);
    
    // Assertions
    expect(response.status).toBe(400);
    expect(responseBody.success).toBe(false);
    expect(responseBody.error).toBe('Hash parameter is required');
  });
  
  it('should handle server errors gracefully', async () => {
    // Mock an error in the get method
    vi.spyOn(CardCollection.prototype, 'get').mockImplementation(() => {
      throw new Error('Test server error');
    });
    
    // Mock URL with parameters
    const request = {
      url: 'http://localhost/api/card-collection/get',
    };
    request.url = new URL(request.url);
    request.url.searchParams = new Map([
      ['hash', testCardHash]
    ]);
    
    // Call API handler
    const response = await GET({ request });
    
    // Parse response body
    const responseBody = JSON.parse(response.body);
    
    // Assertions
    expect(response.status).toBe(500);
    expect(responseBody.success).toBe(false);
    expect(responseBody.error).toBe('Server error');
    expect(responseBody.details).toBeDefined();
  });
});
