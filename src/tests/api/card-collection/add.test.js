/**
 * Tests for CardCollection Add API endpoint
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

// Import the API handler after mocks are set up
import { POST } from '../../../pages/api/card-collection/add.ts';

describe('CardCollection Add API Endpoint', () => {
  let mockCardCollection;
  let testCard;
  let testCardHash;
  
  beforeEach(() => {
    // Create a test card
    testCard = new MCard({ test: 'Sample content' });
    testCardHash = 'test-hash-123';
    testCard.hash = testCardHash;
    
    // Mock card collection methods
    mockCardCollection = {
      add: vi.fn().mockReturnValue(testCardHash)
    };
    
    // Mock CardCollection constructor
    vi.spyOn(CardCollection.prototype, 'add').mockImplementation(() => testCardHash);
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should add a card successfully', async () => {
    // Create request
    const request = {
      json: vi.fn().mockResolvedValue({
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
      json: vi.fn().mockResolvedValue({})
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
  
  it('should handle exceptions during card creation', async () => {
    // Mock error in card creation
    vi.spyOn(MCard.prototype, 'constructor').mockImplementation(() => {
      throw new Error('Test error in card creation');
    });
    
    // Create request
    const request = {
      json: vi.fn().mockResolvedValue({
        card: {
          content: { test: 'Sample content' }
        }
      })
    };
    
    // Call API handler (should catch the error)
    const response = await POST({ request });
    
    // Parse response body
    const responseBody = JSON.parse(response.body);
    
    // Assertions
    expect(responseBody.success).toBe(false);
    expect(responseBody.error).toBeDefined();
  });
});
