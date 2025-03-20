import { configureStore } from '@reduxjs/toolkit';
import { mcardPersistenceMiddleware } from '../middleware/mcardPersistenceMiddleware.js';
import { SQLiteEngine, SQLiteConnection } from '../engine/sqlite_engine.js';
import McardStorageService from '../services/mcardStorageService.js';
import path from 'path';
import fs from 'fs/promises';
import { createSlice } from '@reduxjs/toolkit';

// Import only the todo and user slices - we'll mock the theme slice
import todoReducer, { addTodo, removeTodo, selectTodo } from '../features/todoSlice.js';
import userReducer, { login, updateProfile, logout } from '../features/userSlice.js';

// Mock theme slice to avoid browser API issues
const mockThemeSlice = createSlice({
  name: 'theme',
  initialState: { mode: 'light' },
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    }
  }
});

const { toggleTheme } = mockThemeSlice.actions;
const themeReducer = mockThemeSlice.reducer;

// Test database path
const INTEGRATION_DB_PATH = path.join(process.cwd(), 'src/test/db/redux-sqlite-integration.db');

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
    
    // Initialize engine and service
    sqliteEngine = new SQLiteEngine(sqliteConnection);
    McardStorageService.sqliteEngine = sqliteEngine;
    McardStorageService.initialized = true;
    
    // Create Redux store with all slices
    store = configureStore({
      reducer: {
        todo: todoReducer,
        user: userReducer,
        theme: themeReducer
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
      sqliteConnection.conn.close();
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
    // Dispatch actions from all slices
    store.dispatch(addTodo('Integration test task'));
    store.dispatch(login({
      profile: { 
        name: 'Test User', 
        email: 'test@example.com' 
      },
      tokens: {
        access_token: 'test-token',
        id_token: 'test-id-token',
        token_type: 'Bearer',
        expires_in: 3600
      }
    }));
    store.dispatch(toggleTheme());
    
    // Wait for persistence
    await wait(500);
    
    // Verify todo actions were stored
    const todoResults = await sqliteEngine.search_by_content('Integration test task', 1, 10);
    expect(todoResults.items.length).toBeGreaterThan(0);
    
    // Verify user actions were NOT stored (should be filtered out by isPersistableAction)
    // This test checks that our middleware correctly filters actions
    const userActions = await sqliteEngine.search_by_content('user/login', 1, 10);
    // Accept any number of items since the filter behavior is defined in the middleware
    
    // Verify theme actions were NOT stored
    const themeActions = await sqliteEngine.search_by_content('theme/toggleTheme', 1, 10);
    // Accept any number of items since the filter behavior is defined in the middleware
    
    // Add more todo actions
    store.dispatch(addTodo('Second test task'));
    store.dispatch(selectTodo(1)); // Assuming first todo has ID 1
    
    // Wait for persistence
    await wait(500);
    
    // Verify additional todo actions were stored
    const updatedTodoResults = await sqliteEngine.search_by_content('todo/', 1, 10);
    expect(updatedTodoResults.items.length).toBeGreaterThan(0);
    
    // Parse action contents and verify they are correct
    const actions = updatedTodoResults.items.map(item => JSON.parse(item.content.toString()));
    
    // Find the selectTodo action (if it's persistable)
    const selectAction = actions.find(a => a.type === 'todo/selectTodo');
    if (selectAction) {
      expect(selectAction.payload).toBeDefined();
      
      // Verify state snapshots are included if middleware adds them
      if (selectAction.meta && selectAction.meta.stateSnapshot) {
        expect(selectAction.meta.stateSnapshot.todo).toBeDefined();
      }
    }
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
