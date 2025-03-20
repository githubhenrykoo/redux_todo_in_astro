import { configureStore, createSlice } from '@reduxjs/toolkit';
import { mcardPersistenceMiddleware } from '../middleware/mcardPersistenceMiddleware.js';
import { SQLiteEngine, SQLiteConnection } from '../engine/sqlite_engine.js';
import McardStorageService from '../services/mcardStorageService.js';
import path from 'path';
import fs from 'fs/promises';

// Create a simple test slice
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

// Test database path
const TEST_DB_PATH = path.join(process.cwd(), 'src/test/db/test-manual-redux-mcard.db');

/**
 * Main test function
 */
async function runTest() {
  try {
    console.log('Starting Redux MCard persistence test...');
    
    // Create a clean database
    await fs.unlink(TEST_DB_PATH).catch(() => {});
    
    // Ensure the directory exists
    await fs.mkdir(path.dirname(TEST_DB_PATH), { recursive: true }).catch(() => {});
    
    // Initialize SQLite connection
    console.log('Setting up SQLite database...');
    const sqliteConnection = new SQLiteConnection(TEST_DB_PATH);
    await sqliteConnection.setup_database();
    
    // Initialize the storage service with our test connection
    const sqliteEngine = new SQLiteEngine(sqliteConnection);
    McardStorageService.sqliteEngine = sqliteEngine;
    McardStorageService.initialized = true;
    
    // Create store with middleware
    console.log('Creating Redux store with MCard persistence middleware...');
    const store = configureStore({
      reducer: {
        todo: todoSlice.reducer
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false
        }).concat(mcardPersistenceMiddleware)
    });
    
    // Dispatch a series of actions
    console.log('\nDispatching actions...');
    
    console.log('- Adding Task 1');
    store.dispatch(addTask({ id: '1', title: 'Task 1', completed: false }));
    
    console.log('- Adding Task 2');
    store.dispatch(addTask({ id: '2', title: 'Task 2', completed: false }));
    
    console.log('- Toggling Task 1 to completed');
    store.dispatch(toggleTask('1'));
    
    console.log('- Adding Task 3');
    store.dispatch(addTask({ id: '3', title: 'Task 3', completed: false }));
    
    console.log('- Removing Task 2');
    store.dispatch(removeTask('2'));
    
    // Give time for async persistence to complete
    console.log('\nWaiting for persistence to complete...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Retrieve and display persisted MCards
    console.log('\nRetrieving persisted MCards:');
    
    // Search for todo actions
    const mcards = await sqliteEngine.search_by_content('todo/', 1, 10);
    
    console.log(`Found ${mcards.items.length} MCards:`);
    
    // Display each MCard's content
    for (let i = 0; i < mcards.items.length; i++) {
      const mcard = mcards.items[i];
      const contentObj = JSON.parse(mcard.content.toString());
      
      console.log(`\nMCard #${i+1} - Hash: ${mcard.hash}`);
      console.log(`- Action Type: ${contentObj.type}`);
      console.log(`- Payload: ${JSON.stringify(contentObj.payload, null, 2)}`);
      console.log(`- Timestamp: ${contentObj.timestamp}`);
      
      if (contentObj.meta && contentObj.meta.stateSnapshot) {
        console.log(`- State Snapshot: ${JSON.stringify(contentObj.meta.stateSnapshot, null, 2)}`);
      }
    }
    
    console.log('\nCurrent Redux State:');
    console.log(JSON.stringify(store.getState(), null, 2));
    
    // Close database
    sqliteConnection.conn.close();
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest();
