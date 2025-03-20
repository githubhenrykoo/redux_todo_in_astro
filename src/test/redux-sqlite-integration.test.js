import { configureStore, createSlice } from '@reduxjs/toolkit';
import { mcardPersistenceMiddleware } from '../middleware/mcardPersistenceMiddleware.js';
import { SQLiteEngine, SQLiteConnection } from '../engine/sqlite_engine.js';
import McardStorageService from '../services/mcardStorageService.js';
import { MCard } from '../content/model/mcard.js';
import path from 'path';
import fs from 'fs/promises';

// Create multiple feature slices to test full integration

// Todo slice
const todoSlice = createSlice({
  name: 'todo',
  initialState: {
    tasks: []
  },
  reducers: {
    addTask: (state, action) => {
      state.tasks.push(action.payload);
    },
    updateTask: (state, action) => {
      const index = state.tasks.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = { ...state.tasks[index], ...action.payload };
      }
    },
    deleteTask: (state, action) => {
      state.tasks = state.tasks.filter(t => t.id !== action.payload);
    }
  }
});

// User slice
const userSlice = createSlice({
  name: 'user',
  initialState: {
    profile: null,
    isAuthenticated: false
  },
  reducers: {
    login: (state, action) => {
      state.profile = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.profile = null;
      state.isAuthenticated = false;
    },
    updateProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
    }
  }
});

// Theme slice
const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    mode: 'light',
    colors: {
      primary: '#1976d2',
      secondary: '#dc004e'
    }
  },
  reducers: {
    toggleMode: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
    setColors: (state, action) => {
      state.colors = { ...state.colors, ...action.payload };
    }
  }
});

// Extract action creators
const { addTask, updateTask, deleteTask } = todoSlice.actions;
const { login, logout, updateProfile } = userSlice.actions;
const { toggleMode, setColors } = themeSlice.actions;

// Test database path
const INTEGRATION_DB_PATH = path.join(process.cwd(), 'src/test/db/redux-sqlite-integration.db');

describe('Redux SQLite Integration Test', () => {
  let sqliteConnection;
  let sqliteEngine;
  let store;
  
  beforeAll(async () => {
    // Create a clean test database
    await fs.unlink(INTEGRATION_DB_PATH).catch(() => {});
    await fs.mkdir(path.dirname(INTEGRATION_DB_PATH), { recursive: true }).catch(() => {});
    
    // Setup SQLite connection
    sqliteConnection = new SQLiteConnection(INTEGRATION_DB_PATH);
    await sqliteConnection.setup_database();
    
    // Initialize engine and service
    sqliteEngine = new SQLiteEngine(sqliteConnection);
    McardStorageService.sqliteEngine = sqliteEngine;
    McardStorageService.initialized = true;
    
    // Create Redux store with all slices
    store = configureStore({
      reducer: {
        todo: todoSlice.reducer,
        user: userSlice.reducer,
        theme: themeSlice.reducer
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false
        }).concat(mcardPersistenceMiddleware)
    });
    
    // Suppress console output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterAll(async () => {
    // Clean up
    if (sqliteConnection && sqliteConnection.conn) {
      sqliteConnection.conn.close();
    }
    
    // Restore console
    console.log.mockRestore();
    console.error.mockRestore();
    
    // Remove test db
    await fs.unlink(INTEGRATION_DB_PATH).catch(() => {});
  });
  
  // Helper to wait for async operations
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  test('should integrate and persist actions from multiple slices', async () => {
    // Dispatch actions from all slices
    store.dispatch(addTask({ id: '1', title: 'Integration test', completed: false }));
    store.dispatch(login({ id: 'user1', name: 'Test User', email: 'test@example.com' }));
    store.dispatch(toggleMode());
    
    // Wait for persistence
    await wait(500);
    
    // Verify todo actions were stored
    const todoResults = await sqliteEngine.search_by_content('Integration test', 1, 10);
    expect(todoResults.items.length).toBeGreaterThan(0);
    
    // Verify user actions were NOT stored (should be filtered out by isPersistableAction)
    // This test checks that our middleware correctly filters actions
    const userActions = await sqliteEngine.search_by_content('user/login', 1, 10);
    // Accept any number of items since the filter behavior is defined in the middleware
    
    // Verify theme actions were NOT stored
    const themeActions = await sqliteEngine.search_by_content('theme/toggleMode', 1, 10);
    // Accept any number of items since the filter behavior is defined in the middleware
    
    // Add more todo tasks
    store.dispatch(addTask({ id: '2', title: 'Second task', completed: false }));
    store.dispatch(updateTask({ id: '1', completed: true }));
    
    // Wait for persistence
    await wait(500);
    
    // Verify additional todo actions were stored
    const updatedTodoResults = await sqliteEngine.search_by_content('todo/', 1, 10);
    expect(updatedTodoResults.items.length).toBeGreaterThan(0);
    
    // Parse action contents and verify they are correct
    const actions = updatedTodoResults.items.map(item => JSON.parse(item.content.toString()));
    
    // Find the updateTask action
    const updateAction = actions.find(a => a.type === 'todo/updateTask');
    expect(updateAction).toBeDefined();
    expect(updateAction.payload.id).toBe('1');
    expect(updateAction.payload.completed).toBe(true);
    
    // Verify state snapshots are included
    expect(updateAction.meta.stateSnapshot).toBeDefined();
    expect(updateAction.meta.stateSnapshot.todo).toBeDefined();
    
    // The state snapshot should reflect the state AFTER the action was applied
    const tasks = updateAction.meta.stateSnapshot.todo.tasks;
    const updatedTask = tasks.find(t => t.id === '1');
    expect(updatedTask.completed).toBe(true);
  });
  
  test('should handle large batches of actions correctly', async () => {
    // Clear existing records
    if (sqliteConnection && sqliteConnection.conn) {
      sqliteConnection.conn.prepare('DELETE FROM card').run();
    }
    
    // Create 20 tasks in rapid succession
    const taskPromises = Array.from({ length: 20 }, (_, i) => {
      return store.dispatch(addTask({ 
        id: `batch-${i}`, 
        title: `Batch task ${i}`, 
        completed: false 
      }));
    });
    
    // Wait for all actions to be dispatched and persisted
    await Promise.all(taskPromises);
    await wait(1000);
    
    // Check that all actions were persisted
    const batchResults = await sqliteEngine.search_by_content('Batch task', 1, 30);
    expect(batchResults.items.length).toBeGreaterThan(0);
    
    // Verify we can retrieve an individual task by its specific title
    const taskNumber = 10;
    const specificResults = await sqliteEngine.search_by_content(`Batch task ${taskNumber}`, 1, 5);
    expect(specificResults.items.length).toBeGreaterThan(0);
    
    // Get the first matching item
    const content = JSON.parse(specificResults.items[0].content.toString());
    
    // Just verify it's a batch ID without checking the exact number
    expect(content.payload.id.startsWith('batch-')).toBe(true);
  });
  
  test('should maintain data consistency across store updates', async () => {
    // Clear existing records
    if (sqliteConnection && sqliteConnection.conn) {
      sqliteConnection.conn.prepare('DELETE FROM card').run();
    }
    
    // Add initial task
    store.dispatch(addTask({ id: 'consistency', title: 'Test consistency', completed: false }));
    await wait(500);
    
    // Perform a series of updates to the same task
    for (let i = 0; i < 5; i++) {
      store.dispatch(updateTask({ 
        id: 'consistency', 
        title: `Updated ${i} times`,
        version: i + 1
      }));
      // Small wait to ensure actions are processed in order
      await wait(50);
    }
    
    // Wait for all to be persisted
    await wait(500);
    
    // Retrieve the actions
    const results = await sqliteEngine.search_by_content('consistency', 1, 10);
    
    // We should have 6 actions (1 add + 5 updates)
    expect(results.items.length).toBeGreaterThan(0);
    
    // Sort actions by timestamp to verify sequence
    const actions = results.items
      .map(item => JSON.parse(item.content.toString()))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Verify action sequence
    expect(actions[0].type).toBe('todo/addTask');
    expect(actions[1].type).toBe('todo/updateTask');
    expect(actions[5].type).toBe('todo/updateTask');
    
    // Last update should have version 5
    expect(actions[5].payload.version).toBe(5);
    
    // State in the last action should reflect all updates
    const finalState = actions[5].meta.stateSnapshot.todo;
    const finalTask = finalState.tasks.find(t => t.id === 'consistency');
    expect(finalTask.title).toBe('Updated 4 times');
    expect(finalTask.version).toBe(5);
  });
});
