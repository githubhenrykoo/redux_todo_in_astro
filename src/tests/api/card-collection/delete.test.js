/**
 * Tests for CardCollection Delete API endpoint
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
import { DELETE } from '../../../pages/api/card-collection/delete.ts';

describe('CardCollection Delete API Endpoint', () => {
  let testCard;
  let testCardHash;
  
  beforeEach(() => {
    // Create a test card
    testCard = new MCard({ test: 'Sample content' });
    testCardHash = 'test-hash-123';
    testCard.hash = testCardHash;
    
    // Mock card collection methods
    vi.spyOn(CardCollection.prototype, 'get').mockImplementation((hash) => 
      hash === testCardHash ? testCard : null
    );
    
    vi.spyOn(CardCollection.prototype, 'delete').mockImplementation((hash) => 
      hash === testCardHash ? true : false
    );
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should delete a card by hash', async () => {
    // Mock URL with parameters
    const request = {
      url: 'http://localhost/api/card-collection/delete',
    };
    request.url = new URL(request.url);
    request.url.searchParams = new Map([
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
    // Mock URL with parameters for non-existent hash
    const request = {
      url: 'http://localhost/api/card-collection/delete',
    };
    request.url = new URL(request.url);
    request.url.searchParams = new Map([
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
      url: 'http://localhost/api/card-collection/delete',
    };
    request.url = new URL(request.url);
    request.url.searchParams = new Map();
    
    // Call API handler
    const response = await DELETE({ request });
    
    // Parse response body
    const responseBody = JSON.parse(response.body);
    
    // Assertions
    expect(response.status).toBe(400);
    expect(responseBody.success).toBe(false);
    expect(responseBody.error).toBe('Hash parameter is required');
  });
  
  it('should handle failure to delete', async () => {
    // Mock delete failure
    vi.spyOn(CardCollection.prototype, 'delete').mockReturnValue(false);
    
    // Mock URL with parameters
    const request = {
      url: 'http://localhost/api/card-collection/delete',
    };
    request.url = new URL(request.url);
    request.url.searchParams = new Map([
      ['hash', testCardHash]
    ]);
    
    // Call API handler
    const response = await DELETE({ request });
    
    // Parse response body
    const responseBody = JSON.parse(response.body);
    
    // Assertions
    expect(response.status).toBe(500);
    expect(responseBody.success).toBe(false);
    expect(responseBody.error).toBe('Failed to delete card');
  });
  
  it('should handle server errors gracefully', async () => {
    // Mock an error in the delete method
    vi.spyOn(CardCollection.prototype, 'delete').mockImplementation(() => {
      throw new Error('Test server error');
    });
    
    // Mock URL with parameters
    const request = {
      url: 'http://localhost/api/card-collection/delete',
    };
    request.url = new URL(request.url);
    request.url.searchParams = new Map([
      ['hash', testCardHash]
    ]);
    
    // Call API handler
    const response = await DELETE({ request });
    
    // Parse response body
    const responseBody = JSON.parse(response.body);
    
    // Assertions
    expect(response.status).toBe(500);
    expect(responseBody.success).toBe(false);
    expect(responseBody.error).toBe('Server error');
    expect(responseBody.details).toBeDefined();
  });
});
