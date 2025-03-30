/**
 * Tests for CardCollection API Endpoint
 */
import { MCard, MCardFromData } from '../../../content/model/mcard.js';
import { CardCollection } from '../../../content/model/card-collection.js';
import { SafeBuffer } from '../../../utils/bufferPolyfill.js';

// Mock dependencies
jest.mock('../../../utils/storeAdapter.js', () => ({
  getStoreEngine: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockReturnValue(true),
    get: jest.fn(),
    delete: jest.fn().mockReturnValue(true),
    get_page: jest.fn(),
    search_by_content: jest.fn(),
  }))
}));

jest.mock('../../../services/logger.js', () => ({
  debug: jest.fn(),
  error: jest.fn(),
  default: {
    debug: jest.fn(),
    error: jest.fn()
  }
}));

// Mock global Response and URL for testing
global.Response = jest.fn().mockImplementation(function(body, options) {
  this.body = body;
  this.status = options?.status || 200;
  this.headers = options?.headers || {};
  this.json = jest.fn().mockResolvedValue(JSON.parse(body));
}) as any;

global.URL = jest.fn().mockImplementation(function(url) {
  this.url = url;
  this.searchParams = {
    get: jest.fn(),
    set: jest.fn(),
  };
}) as any;

// Import the API handlers after mocks are set up
import { GET, POST, DELETE } from '../card-collection';

describe('CardCollection API Endpoint', () => {
  let mockCardCollection: jest.Mocked<CardCollection>;
  let testCard: MCard;
  let testCardHash: string;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a test card
    testCard = new MCard({ test: 'Sample content' });
    testCardHash = 'test-hash-123';
    testCard.hash = testCardHash;
    testCard.g_time = new Date().toISOString();
    
    // Set up URL mock for testing GET and DELETE requests
    (global.URL as jest.Mock).mockImplementation((url) => {
      return {
        url,
        searchParams: {
          get: (param: string) => {
            if (param === 'hash') return testCardHash;
            if (param === 'action') return 'get'; // Default to 'get' action
            if (param === 'searchTerm') return 'sample';
            if (param === 'pageNumber') return '1';
            if (param === 'pageSize') return '10';
            return null;
          }
        }
      };
    });
    
    // Mock CardCollection methods
    mockCardCollection = {
      add: jest.fn().mockReturnValue(testCardHash),
      get: jest.fn().mockImplementation((hash) => (hash === testCardHash ? testCard : null)),
      delete: jest.fn().mockReturnValue(true),
      get_page: jest.fn().mockReturnValue({
        items: [testCard],
        total_items: 1,
        page_number: 1,
        page_size: 10,
        has_next: false,
        has_previous: false,
        next_page: null,
        previous_page: null,
        total_pages: 1
      }),
      search_by_content: jest.fn().mockReturnValue({
        items: [testCard],
        total_items: 1,
        page_number: 1,
        page_size: 10,
        has_next: false,
        has_previous: false,
        next_page: null,
        previous_page: null,
        total_pages: 1
      })
    } as unknown as jest.Mocked<CardCollection>;
    
    // Mock CardCollection constructor methods
    jest.spyOn(CardCollection.prototype, 'add').mockImplementation(mockCardCollection.add);
    jest.spyOn(CardCollection.prototype, 'get').mockImplementation(mockCardCollection.get);
    jest.spyOn(CardCollection.prototype, 'delete').mockImplementation(mockCardCollection.delete);
    jest.spyOn(CardCollection.prototype, 'get_page').mockImplementation(mockCardCollection.get_page);
    jest.spyOn(CardCollection.prototype, 'search_by_content').mockImplementation(mockCardCollection.search_by_content);
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });
  
  // #########################
  // POST Tests (Add operation)
  // #########################
  describe('POST - Add Card', () => {
    it('should add a card successfully', async () => {
      // Create request
      const request = {
        json: jest.fn().mockResolvedValue({
          action: 'add',
          card: {
            content: { test: 'Sample content' }
          }
        })
      };
      
      // Call API handler
      const response = await POST({ request } as any);
      
      // Parse response body
      const responseBody = JSON.parse(response.body as string);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.hash).toBe(testCardHash);
      expect(responseBody.timestamp).toBeDefined();
    });
    
    it('should return error if card data is missing', async () => {
      // Create request without card data
      const request = {
        json: jest.fn().mockResolvedValue({
          action: 'add'
        })
      };
      
      // Call API handler
      const response = await POST({ request } as any);
      
      // Parse response body
      const responseBody = JSON.parse(response.body as string);
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBe('Card data is required');
    });
    
    it('should handle unknown action', async () => {
      // Create request with invalid action
      const request = {
        json: jest.fn().mockResolvedValue({
          action: 'invalidAction'
        })
      };
      
      // Call API handler
      const response = await POST({ request } as any);
      
      // Parse response body
      const responseBody = JSON.parse(response.body as string);
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('Unknown action');
    });
  });
  
  // #########################
  // GET Tests
  // #########################
  describe('GET - Retrieve operations', () => {
    it('should get a card by hash', async () => {
      // Set up URL with 'get' action
      (global.URL as jest.Mock).mockImplementation(() => ({
        url: 'http://example.com',
        searchParams: {
          get: (param: string) => {
            if (param === 'action') return 'get';
            if (param === 'hash') return testCardHash;
            return null;
          }
        }
      }));
      
      // Create request
      const request = {
        url: 'http://example.com'
      };
      
      // Call API handler
      const response = await GET({ request } as any);
      
      // Parse response body
      const responseBody = JSON.parse(response.body as string);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.card).toBeDefined();
      expect(responseBody.card.hash).toBe(testCardHash);
    });
    
    it('should handle missing hash parameter', async () => {
      // Set up URL with missing hash
      (global.URL as jest.Mock).mockImplementation(() => ({
        url: 'http://example.com',
        searchParams: {
          get: (param: string) => {
            if (param === 'action') return 'get';
            return null; // No hash provided
          }
        }
      }));
      
      // Create request
      const request = {
        url: 'http://example.com'
      };
      
      // Call API handler
      const response = await GET({ request } as any);
      
      // Parse response body
      const responseBody = JSON.parse(response.body as string);
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBe('Invalid hash');
    });
    
    it('should handle non-existent card', async () => {
      // Set up URL with non-existent hash
      (global.URL as jest.Mock).mockImplementation(() => ({
        url: 'http://example.com',
        searchParams: {
          get: (param: string) => {
            if (param === 'action') return 'get';
            if (param === 'hash') return 'non-existent-hash';
            return null;
          }
        }
      }));
      
      // Create request
      const request = {
        url: 'http://example.com'
      };
      
      // Call API handler
      const response = await GET({ request } as any);
      
      // Parse response body
      const responseBody = JSON.parse(response.body as string);
      
      // Assertions
      expect(response.status).toBe(404);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBe('Card not found');
    });
    
    it('should handle getPage action', async () => {
      // Set up URL with 'getPage' action
      (global.URL as jest.Mock).mockImplementation(() => ({
        url: 'http://example.com',
        searchParams: {
          get: (param: string) => {
            if (param === 'action') return 'getPage';
            if (param === 'pageNumber') return '1';
            if (param === 'pageSize') return '10';
            return null;
          }
        }
      }));
      
      // Create request
      const request = {
        url: 'http://example.com'
      };
      
      // Call API handler
      const response = await GET({ request } as any);
      
      // Parse response body
      const responseBody = JSON.parse(response.body as string);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.items).toBeDefined();
      expect(responseBody.total_items).toBe(1);
    });
    
    it('should handle searchByContent action', async () => {
      // Set up URL with 'searchByContent' action
      (global.URL as jest.Mock).mockImplementation(() => ({
        url: 'http://example.com',
        searchParams: {
          get: (param: string) => {
            if (param === 'action') return 'searchByContent';
            if (param === 'searchTerm') return 'sample';
            if (param === 'pageNumber') return '1';
            if (param === 'pageSize') return '10';
            return null;
          }
        }
      }));
      
      // Create request
      const request = {
        url: 'http://example.com'
      };
      
      // Call API handler
      const response = await GET({ request } as any);
      
      // Parse response body
      const responseBody = JSON.parse(response.body as string);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.items).toBeDefined();
    });
  });
  
  // #########################
  // DELETE Tests
  // #########################
  describe('DELETE - Delete Card', () => {
    it('should delete a card successfully', async () => {
      // Set up URL with 'delete' action
      (global.URL as jest.Mock).mockImplementation(() => ({
        url: 'http://example.com',
        searchParams: {
          get: (param: string) => {
            if (param === 'action') return 'delete';
            if (param === 'hash') return testCardHash;
            return null;
          }
        }
      }));
      
      // Create request
      const request = {
        url: 'http://example.com'
      };
      
      // Call API handler
      const response = await DELETE({ request } as any);
      
      // Parse response body
      const responseBody = JSON.parse(response.body as string);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.timestamp).toBeDefined();
    });
    
    it('should handle missing hash parameter', async () => {
      // Set up URL with missing hash
      (global.URL as jest.Mock).mockImplementation(() => ({
        url: 'http://example.com',
        searchParams: {
          get: (param: string) => {
            if (param === 'action') return 'delete';
            return null; // No hash provided
          }
        }
      }));
      
      // Create request
      const request = {
        url: 'http://example.com'
      };
      
      // Call API handler
      const response = await DELETE({ request } as any);
      
      // Parse response body
      const responseBody = JSON.parse(response.body as string);
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBe('Hash is required');
    });
    
    it('should handle non-existent card', async () => {
      // Set up URL with non-existent hash
      (global.URL as jest.Mock).mockImplementation(() => ({
        url: 'http://example.com',
        searchParams: {
          get: (param: string) => {
            if (param === 'action') return 'delete';
            if (param === 'hash') return 'non-existent-hash';
            return null;
          }
        }
      }));
      
      // Create request
      const request = {
        url: 'http://example.com'
      };
      
      // Call API handler
      const response = await DELETE({ request } as any);
      
      // Parse response body
      const responseBody = JSON.parse(response.body as string);
      
      // Assertions
      expect(response.status).toBe(404);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBe('Card not found');
    });
  });
  
  // #########################
  // Cross-Environment Tests
  // #########################
  describe('Cross-Environment Compatibility', () => {
    it('should ensure SafeBuffer compatibility', () => {
      const testContent = 'Test content';
      const encoded = SafeBuffer.from(testContent, 'utf-8');
      
      expect(SafeBuffer.isBuffer(encoded)).toBe(true);
      expect(encoded.toString('utf-8')).toBe(testContent);
    });
    
    it('should support MCardFromData for data reconstruction', () => {
      const content = { test: 'Sample content' };
      const fromDataCard = new MCardFromData(content, testCardHash, new Date().toISOString());
      
      expect(fromDataCard.hash).toBe(testCardHash);
      expect(fromDataCard.content).toEqual(content);
    });
  });
});
