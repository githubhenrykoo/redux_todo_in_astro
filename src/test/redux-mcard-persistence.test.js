import { mcardPersistenceMiddleware } from '../middleware/mcardPersistenceMiddleware.js';
import McardStorageService from '../services/mcardStorageService.js';
import { SQLiteEngine, SQLiteConnection } from '../engine/sqlite_engine.js';
import path from 'path';
import fs from 'fs/promises';

// Mock Redux store
const createMockStore = () => {
  const actions = [];
  const state = {
    todo: {
      tasks: []
    },
    user: {
      profile: {}
    },
    content: {
      entries: []
    },
    theme: {
      current: 'light'
    }
  };

  const store = {
    getState: jest.fn(() => state),
    dispatch: jest.fn(action => actions.push(action))
  };
  
  return {
    store,
    state,
    actions
  };
};

// Setup test configuration
const TEST_DB_PATH = path.join(process.cwd(), 'src/test/db/redux-mcard-persistence.db');

// Mock console.log and console.error to avoid noise in tests
console.log = jest.fn();
console.error = jest.fn();

describe('Redux MCard Persistence Tests', () => {
  let sqliteConnection;
  let sqliteEngine;
  let mockStore;
  let next;
  let middleware;
  
  // Setup before all tests
  beforeAll(async () => {
    // Create a fresh test database
    try {
      await fs.unlink(TEST_DB_PATH).catch(() => {});
      
      // Initialize SQLite connection and setup
      sqliteConnection = new SQLiteConnection(TEST_DB_PATH);
      await sqliteConnection.setup_database();
      
      // Setup SQLiteEngine with our test connection
      sqliteEngine = new SQLiteEngine(sqliteConnection);
      
      // Configure McardStorageService to use our test engine
      McardStorageService.sqliteEngine = sqliteEngine;
      McardStorageService.initialized = true;
    } catch (error) {
      console.error('Failed to setup test database:', error);
      throw error;
    }
    
    // Spy on McardStorageService methods
    jest.spyOn(McardStorageService, 'createAndStoreMCard');
  });
  
  // Setup before each test
  beforeEach(() => {
    mockStore = createMockStore();
    next = jest.fn(action => action);
    middleware = mcardPersistenceMiddleware(mockStore.store)(next);
    
    // Reset mocks
    McardStorageService.createAndStoreMCard.mockClear();
  });
  
  // Cleanup after all tests
  afterAll(async () => {
    // Close database connection
    if (sqliteConnection.conn) {
      sqliteConnection.conn.close();
    }
    
    // Remove test database file
    await fs.unlink(TEST_DB_PATH).catch(() => {});
  });
  
  // Tests
  test('Middleware passes actions through', async () => {
    const action = { type: 'test/action' };
    await middleware(action);
    
    expect(next).toHaveBeenCalledWith(action);
  });
  
  test('Persistable todo actions are stored as MCards', async () => {
    const action = { 
      type: 'todo/addTask', 
      payload: { id: '123', title: 'Test Task', completed: false } 
    };
    
    await middleware(action);
    
    expect(McardStorageService.createAndStoreMCard).toHaveBeenCalled();
    
    // Verify the action was passed with state metadata
    const storedAction = McardStorageService.createAndStoreMCard.mock.calls[0][0];
    expect(storedAction.type).toBe(action.type);
    expect(storedAction.payload).toEqual(action.payload);
    expect(storedAction.meta).toBeDefined();
    expect(storedAction.meta.stateSnapshot).toBeDefined();
    expect(storedAction.meta.stateSnapshot.todo).toBeDefined();
  });
  
  test('Non-persistable actions are not stored', async () => {
    const action = { type: '@@redux/INIT' };
    await middleware(action);
    
    expect(McardStorageService.createAndStoreMCard).not.toHaveBeenCalled();
  });
  
  test('Sensitive information is sanitized from payloads', async () => {
    // Create McardStorageService manually to test sanitization
    const action = {
      type: 'user/login',
      payload: {
        username: 'testuser',
        password: 'secret123',
        token: 'jwt-token-123',
        profile: {
          apiKey: 'api-key-123',
          name: 'Test User'
        }
      }
    };
    
    const sanitizedPayload = McardStorageService.sanitizePayload(action.payload);
    
    expect(sanitizedPayload.username).toBe('testuser');
    expect(sanitizedPayload.password).toBe('[REDACTED]');
    expect(sanitizedPayload.token).toBe('[REDACTED]');
    expect(sanitizedPayload.profile.apiKey).toBe('[REDACTED]');
    expect(sanitizedPayload.profile.name).toBe('Test User');
  });
  
  test('Full persistence flow from action to MCard to retrieval', async () => {
    // 1. Create and dispatch a todo action
    const action = {
      type: 'todo/addTask',
      payload: { id: '12345', title: 'Integration Test Task', completed: false }
    };
    
    await middleware(action);
    
    // 2. Verify the action was passed to McardStorageService
    expect(McardStorageService.createAndStoreMCard).toHaveBeenCalled();
    
    // 3. Directly retrieve MCards from SQLite by searching for the action content
    const searchResults = await sqliteEngine.search_by_content('Integration Test Task', 1, 10);
    
    // 4. Verify we found at least one matching MCard
    expect(searchResults.items.length).toBeGreaterThan(0);
    
    // 5. Parse the content of the first MCard
    const mcardContent = JSON.parse(searchResults.items[0].content.toString());
    
    // 6. Verify the content matches our action
    expect(mcardContent.type).toBe(action.type);
    expect(mcardContent.payload.id).toBe(action.payload.id);
    expect(mcardContent.payload.title).toBe(action.payload.title);
  });
});
