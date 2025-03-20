import { configureStore, createSlice } from '@reduxjs/toolkit';
import { mcardPersistenceMiddleware } from '../middleware/mcardPersistenceMiddleware.js';
import { SQLiteEngine, SQLiteConnection } from '../engine/sqlite_engine.js';
import McardStorageService from '../services/mcardStorageService.js';
import path from 'path';
import fs from 'fs/promises';

// Create a simple test slice for todos
const todoSlice = createSlice({
  name: 'todo',
  initialState: {
    tasks: []
  },
  reducers: {
    addTask: (state, action) => {
      state.tasks.push(action.payload);
    },
    toggleTask: (state, action) => {
      const task = state.tasks.find(t => t.id === action.payload);
      if (task) {
        task.completed = !task.completed;
      }
    },
    removeTask: (state, action) => {
      state.tasks = state.tasks.filter(t => t.id !== action.payload);
    }
  }
});

// Create actions
const { addTask, toggleTask, removeTask } = todoSlice.actions;

// Test database path in the test/db directory
const TEST_DB_PATH = path.join(process.cwd(), 'src/test/db/redux-mcard-test.db');

describe('Redux MCard Persistence Middleware', () => {
  let sqliteConnection;
  let sqliteEngine;
  let store;
  
  // Setup before all tests
  beforeAll(async () => {
    // Verify that all databases use the correct location
    expect(TEST_DB_PATH).toContain('src/test/db/');
    
    // Create a fresh test database
    try {
      await fs.unlink(TEST_DB_PATH).catch(() => {});
      
      // Ensure the directory exists
      await fs.mkdir(path.dirname(TEST_DB_PATH), { recursive: true }).catch(() => {});
      
      // Initialize SQLite connection
      sqliteConnection = new SQLiteConnection(TEST_DB_PATH);
      await sqliteConnection.setup_database();
      
      // Initialize the storage service with our test connection
      sqliteEngine = new SQLiteEngine(sqliteConnection);
      McardStorageService.sqliteEngine = sqliteEngine;
      McardStorageService.initialized = true;
      
      // Create Redux store with middleware
      store = configureStore({
        reducer: {
          todo: todoSlice.reducer
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware({
            serializableCheck: false
          }).concat(mcardPersistenceMiddleware)
      });
      
      // Clear console logs for cleaner test output
      jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.spyOn(console, 'error').mockImplementation(() => {});
    } catch (error) {
      console.error('Test setup failed:', error);
      throw error;
    }
  });
  
  // Test with a fresh store for each test
  beforeEach(() => {
    // Create a fresh database for each test
    store = configureStore({
      reducer: {
        todo: todoSlice.reducer
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false
        }).concat(mcardPersistenceMiddleware)
    });
  });
  
  // Cleanup after all tests
  afterAll(async () => {
    // Close database connection
    if (sqliteConnection && sqliteConnection.conn) {
      sqliteConnection.conn.close();
    }
    
    // Restore console functions
    console.log.mockRestore();
    console.error.mockRestore();
    
    // Remove test database file
    await fs.unlink(TEST_DB_PATH).catch(() => {});
  });
  
  // Test middleware persists todo actions
  test('should persist todo actions as MCards', async () => {
    // Add some todo actions
    store.dispatch(addTask({ id: '1', title: 'Test Task 1', completed: false }));
    store.dispatch(addTask({ id: '2', title: 'Test Task 2', completed: false }));
    store.dispatch(toggleTask('1'));
    store.dispatch(addTask({ id: '3', title: 'Test Task 3', completed: false }));
    store.dispatch(removeTask('2'));
    
    // Give time for persistence to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify the database file exists
    try {
      const stats = await fs.stat(TEST_DB_PATH);
      console.log(`Database file exists: ${stats.size} bytes`);
    } catch (error) {
      console.error(`Database file check error: ${error.message}`);
    }
    
    // Search for todo actions
    const searchResults = await sqliteEngine.search_by_content('Test Task', 1, 10);
    
    // Verify that actions were persisted
    expect(searchResults.items.length).toBeGreaterThanOrEqual(1);
    
    // Verify the content of the MCards
    const actionTypes = searchResults.items.map(item => {
      const content = JSON.parse(item.content.toString());
      return content.type;
    });
    
    // Verify all action types were persisted
    expect(actionTypes).toContain('todo/addTask');
    expect(actionTypes).toContain('todo/toggleTask');
    expect(actionTypes).toContain('todo/removeTask');
  });
  
  // Test state snapshots
  test('should include state snapshots in persisted actions', async () => {
    // Reset store and database between tests
    if (sqliteConnection && sqliteConnection.conn) {
      sqliteConnection.conn.prepare('DELETE FROM card').run();
    }
    
    // Dispatch an action with a unique title to search for
    const taskTitle = 'State Snapshot Test ' + Date.now();
    store.dispatch(addTask({ id: '3', title: taskTitle, completed: false }));
    
    // Print the current store state to debug
    console.log('Current store state:', JSON.stringify(store.getState()));
    
    // Give time for persistence to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify the database file exists
    try {
      const stats = await fs.stat(TEST_DB_PATH);
      console.log(`Database file exists: ${stats.size} bytes`);
    } catch (error) {
      console.error(`Database file check error: ${error.message}`);
    }
    
    // Search for the specific task
    const searchResults = await sqliteEngine.search_by_content(taskTitle, 1, 10);
    
    // Verify we found the action
    expect(searchResults.items.length).toBeGreaterThanOrEqual(1);
    
    // Parse the content
    const mcard = searchResults.items[0];
    const content = JSON.parse(mcard.content.toString());
    
    // Verify this is the action we're looking for
    expect(content.type).toBe('todo/addTask');
    expect(content.payload.id).toBe('3');
    
    // Verify state snapshot is present
    expect(content.meta).toBeDefined();
    expect(content.meta.stateSnapshot).toBeDefined();
    expect(content.meta.stateSnapshot.todo).toBeDefined();
    
    // Verify state snapshot content
    const tasks = content.meta.stateSnapshot.todo.tasks;
    expect(Array.isArray(tasks)).toBe(true);
    
    // Find our task in the snapshot
    const matchingTask = tasks.find(task => task.id === '3');
    expect(matchingTask).toBeDefined();
    expect(matchingTask.title).toBe(taskTitle);
  });
  
  // Test payload sanitization
  test('should sanitize sensitive information in payloads', async () => {
    // Create sensitive data action
    const sensitiveAction = {
      type: 'user/login',
      payload: {
        username: 'testuser',
        password: 'secret123',
        token: 'abc123',
        profile: {
          name: 'Test User',
          apiKey: 'private-key'
        }
      }
    };
    
    // Test the sanitization method directly
    const sanitizedPayload = McardStorageService.sanitizePayload(sensitiveAction.payload);
    
    // Verify sensitive fields are redacted
    expect(sanitizedPayload.username).toBe('testuser');
    expect(sanitizedPayload.password).toBe('[REDACTED]');
    expect(sanitizedPayload.token).toBe('[REDACTED]');
    expect(sanitizedPayload.profile.name).toBe('Test User');
    expect(sanitizedPayload.profile.apiKey).toBe('[REDACTED]');
  });
  
  // Test persistable action filtering
  test('should only persist specific action types', async () => {
    // Create non-persistable action
    const nonPersistableAction = { type: '@@redux/INIT' };
    
    // Mock the storage service
    const originalCreateAndStoreMCard = McardStorageService.createAndStoreMCard;
    McardStorageService.createAndStoreMCard = jest.fn();
    
    // Dispatch the non-persistable action
    store.dispatch(nonPersistableAction);
    
    // Give time for middleware to process
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify storage was not called
    expect(McardStorageService.createAndStoreMCard).not.toHaveBeenCalled();
    
    // Restore the original method
    McardStorageService.createAndStoreMCard = originalCreateAndStoreMCard;
  });
});
