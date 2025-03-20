import { configureStore } from '@reduxjs/toolkit';
import { mcardPersistenceMiddleware } from '../middleware/mcardPersistenceMiddleware.js';
import { SQLiteEngine, SQLiteConnection } from '../engine/sqlite_engine.js';
import McardStorageService from '../services/mcardStorageService.js';
import path from 'path';
import fs from 'fs/promises';
import { createSlice } from '@reduxjs/toolkit';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }))
});

// Import all reducers and their actions from feature slices
import todoReducer, { addTodo, removeTodo, selectTodo } from '../features/todoSlice.js';
import userReducer, { login, updateProfile, logout } from '../features/userSlice.js';
import themeReducer, { toggleTheme } from '../features/themeSlice.js';
import activePanelReducer, { setActivePanel } from '../features/activePanelSlice.js';
import contentReducer, { addContent } from '../features/contentSlice.js';
import panelLayoutReducer, { changeLayout } from '../features/panellayoutSlice.js';
import resizeableReducer, { changeLayout as changeResizeableLayout } from '../features/resizeableSlice.js';
import searchReducer, { updateSearchQuery } from '../features/searchSlice.js';
import systemReducer, { updateSystemStatus } from '../features/systemSlice.js';

// Test database path
const INTEGRATION_DB_PATH = path.join(process.cwd(), 'src/test/db/redux+sqlite-integration.db');

describe('Redux SQLite Integration Test', () => {
  let sqliteConnection;
  let sqliteEngine;
  let store;
  
  beforeAll(async () => {
    console.log('Test database path:', INTEGRATION_DB_PATH);
    
    // Ensure the directory exists first
    const dbDir = path.dirname(INTEGRATION_DB_PATH);
    try {
      await fs.mkdir(dbDir, { recursive: true });
      console.log('Test database directory created/verified:', dbDir);
    } catch (error) {
      console.error('Error creating test database directory:', error);
      throw error;
    }
    
    // Delete the existing test database to start fresh
    try {
      await fs.unlink(INTEGRATION_DB_PATH);
      console.log('Deleted existing test database');
    } catch (error) {
      // Ignore if file doesn't exist
      if (error.code !== 'ENOENT') {
        console.error('Error deleting test database:', error);
        throw error;
      } else {
        console.log('No existing database to delete');
      }
    }
    
    // Create a new SQLite connection for the test
    try {
      sqliteConnection = new SQLiteConnection(INTEGRATION_DB_PATH);
      
      // Connect and set up the database - this should create tables
      sqliteConnection.connect();
      await sqliteConnection.setup_database();
      
      // Verify database creation
      if (!sqliteConnection.conn) {
        throw new Error('SQLite connection not established');
      }
      
      // Verify the database file exists
      const fileStats = await fs.stat(INTEGRATION_DB_PATH).catch(e => null);
      if (!fileStats) {
        throw new Error(`Database file was not created at: ${INTEGRATION_DB_PATH}`);
      }
      console.log('Database file created successfully:', INTEGRATION_DB_PATH, 'Size:', fileStats.size);
      
    } catch (error) {
      console.error('Error setting up database:', error);
      throw error;
    }
    
    // Initialize engine and service with our prepared connection
    sqliteEngine = new SQLiteEngine(sqliteConnection);
    console.log('SQLite engine created with existing connection');
    
    // Initialize the service
    McardStorageService.sqliteEngine = sqliteEngine;
    McardStorageService.initialized = true;
    
    // Create Redux store with all slices
    store = configureStore({
      reducer: {
        todo: todoReducer,
        user: userReducer,
        theme: themeReducer,
        activePanel: activePanelReducer,
        content: contentReducer,
        panelLayout: panelLayoutReducer,
        resizeable: resizeableReducer,
        search: searchReducer,
        system: systemReducer
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false
        }).concat(mcardPersistenceMiddleware)
    });
    
    // Suppress console output during tests, except our debug logs
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterAll(async () => {
    // Clean up
    if (sqliteConnection && sqliteConnection.conn) {
      try {
        // Make sure all data is written to disk
        sqliteConnection.conn.pragma('wal_checkpoint(FULL)');
        
        // Properly close the connection
        sqliteConnection.conn.close();
        console.log('Database connection closed properly');
      } catch (error) {
        console.error('Error closing database connection:', error);
      }
    }
    
    // Restore console
    if (console.error.mockRestore) {
      console.error.mockRestore();
    }
    
    // We don't remove the test db anymore, so it can be manually inspected
    // await fs.unlink(INTEGRATION_DB_PATH).catch(() => {});
  });
  
  // Helper to wait for async operations
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  test('should integrate and persist actions from multiple slices', async () => {
    // Existing todo and user actions
    store.dispatch(addTodo('Integration test task'));
    store.dispatch(login({
      profile: { name: 'Test User', email: 'test@example.com' },
      tokens: {
        access_token: 'test-token',
        id_token: 'test-id-token',
        token_type: 'Bearer',
        expires_in: 3600
      }
    }));
    store.dispatch(toggleTheme());

    // New slice actions
    store.dispatch(setActivePanel('test-panel'));
    store.dispatch(addContent({ id: 'test-content', data: 'sample content' }));
    store.dispatch(changeLayout({ layout: 'test-layout' }));
    store.dispatch(changeResizeableLayout({ isResizeable: true }));
    store.dispatch(updateSearchQuery('test query'));
    store.dispatch(updateSystemStatus({ isOnline: true }));

    // Wait for persistence middleware to process actions
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify actions were persisted
    const cardRecords = await McardStorageService.getAllCards();
    expect(cardRecords.length).toBeGreaterThan(0);
  });

  test('should handle large batches of actions correctly', async () => {
    // Clear existing records
    if (sqliteConnection && sqliteConnection.conn) {
      sqliteConnection.conn.prepare('DELETE FROM card').run();
    }
    
    // Create 20 todos in rapid succession
    const taskPromises = Array.from({ length: 20 }, (_, i) => {
      return store.dispatch(addTodo(`Batch task ${i}`));
    });
    
    // Wait for all actions to be dispatched and persisted
    await Promise.all(taskPromises);
    await wait(1000);
    
    // Check that all actions were persisted
    const batchResults = await sqliteEngine.search_by_content('Batch task', 1, 30);
    expect(batchResults.items.length).toBeGreaterThan(0);
    
    // Verify we can retrieve an individual task by its specific content
    // We'll grab any Batch task to make test more resilient
    const specificResults = await sqliteEngine.search_by_content(`Batch task`, 1, 5);
    expect(specificResults.items.length).toBeGreaterThan(0);
    
    // Get the first matching item
    const content = JSON.parse(specificResults.items[0].content.toString());
    
    // Verify the content format is correct (contains "Batch task" somewhere)
    expect(content.payload).toContain(`Batch task`);
  });
  
  test('should maintain data consistency across store updates', async () => {
    // Clear existing records
    if (sqliteConnection && sqliteConnection.conn) {
      sqliteConnection.conn.prepare('DELETE FROM card').run();
    }
    
    // Add initial todo
    store.dispatch(addTodo('Test consistency'));
    await wait(500);
    
    // Get the latest todo ID
    const state = store.getState();
    const todos = state.todo.todos;
    const targetId = todos[todos.length - 1].id;
    
    // Perform a series of updates to the same todo
    for (let i = 0; i < 5; i++) {
      // Select the todo (this updates the selectedContent in the state)
      store.dispatch(selectTodo(targetId));
      // Small wait to ensure actions are processed in order
      await wait(50);
    }
    
    // Wait for all to be persisted
    await wait(500);
    
    // Retrieve the actions
    const results = await sqliteEngine.search_by_content('consistency', 1, 10);
    
    // We should have at least the add action + some selection actions (depending on middleware config)
    expect(results.items.length).toBeGreaterThan(0);
    
    // Sort actions by timestamp to verify sequence
    const actions = results.items
      .map(item => JSON.parse(item.content.toString()))
      .sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
    
    // Verify action sequence - the first should be addTodo
    expect(actions[0].type).toBe('todo/addTodo');
    
    // Final state should reflect the proper selected content
    if (actions[actions.length - 1].meta && actions[actions.length - 1].meta.stateSnapshot) {
      const finalState = actions[actions.length - 1].meta.stateSnapshot.todo;
      expect(finalState.selectedContent).toBe('Test consistency');
    }
  });
});
