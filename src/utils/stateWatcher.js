import { MCard } from '../content/model/mcard.js';
import { CardCollection } from '../content/model/card-collection.js';
import { SQLiteEngine, SQLiteConnection } from '../engine/sqlite_engine.js';
import { HASH_ALGORITHM_SHA256 } from '../config/config_constants.js';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

// Cross-environment state persistence middleware
export function createStatePersistenceMiddleware() {
  let cardCollection = null;
  let sqliteConnection = null;

  // Initialize database connection
  function initializeDatabase() {
    try {
      // Determine database path based on environment
      const dbPath = path.resolve(
        typeof window !== 'undefined' 
          ? window.location.pathname 
          : __dirname, 
        '../../public/data/cards.db'
      );
      
      // Ensure directory exists
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Remove existing database to start fresh (optional)
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }

      sqliteConnection = new SQLiteConnection(dbPath);
      sqliteConnection.connect();

      const sqliteEngine = new SQLiteEngine(sqliteConnection);
      sqliteEngine.setup_database();

      cardCollection = new CardCollection(sqliteEngine);
      
      console.log('✅ State Persistence Database Initialized');
    } catch (error) {
      console.error('❌ Database Initialization Error:', error);
    }
  }

  // Middleware function
  return store => next => action => {
    // Lazy initialize database
    if (!cardCollection) {
      initializeDatabase();
    }

    // Capture state before and after action
    const prevState = store.getState();
    const result = next(action);
    const nextState = store.getState();

    try {
      // Only persist if state actually changed
      if (JSON.stringify(prevState) !== JSON.stringify(nextState)) {
        const serializedState = JSON.stringify({
          action: action.type,
          timestamp: new Date().toISOString(),
          prevState,
          nextState
        });

        // Create MCard for state snapshot
        const stateCard = new MCard(serializedState, HASH_ALGORITHM_SHA256);
        
        // Persist to database if possible
        if (cardCollection) {
          cardCollection.add(stateCard);
          console.log(`💾 State Persisted: ${stateCard.hash}`);
        }
      }
    } catch (error) {
      console.error('❌ State Persistence Error:', error);
    }

    return result;
  };
}

// Cleanup function for database connection
export function cleanupStatePersistence(sqliteConnection) {
  if (sqliteConnection) {
    try {
      sqliteConnection.disconnect();
    } catch (error) {
      console.error('❌ Database Cleanup Error:', error);
    }
  }
}

// Standalone state observer that can be attached to any store
export class StateObserver {
  constructor(store, options = {}) {
    this.store = store;
    this.options = {
      // Default options
      shouldCapture: () => true,
      transformState: (state) => state,
      endpoint: '/api/state-capture',
      debounceTime: 500,
      ...options
    };

    this.lastSentState = null;
    this.debounceTimer = null;
    this.unsubscribe = null;
  }

  // Start observing store changes
  start() {
    // Ensure we're in a browser environment
    if (typeof window === 'undefined') return;

    // Prevent multiple subscriptions
    this.stop();

    // Subscribe to store changes
    this.unsubscribe = this.store.subscribe(() => {
      this.captureState();
    });

    console.log('🔍 State Observer Started');
    return this;
  }

  // Stop observing
  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      console.log('🛑 State Observer Stopped');
    }
    return this;
  }

  // Capture and send state
  captureState() {
    // Clear previous debounce timer
    clearTimeout(this.debounceTimer);

    // Set new debounce timer
    this.debounceTimer = setTimeout(async () => {
      try {
        const currentState = this.store.getState();
        const currentAction = this.store.getState().lastAction;

        // Check if we should capture this state
        if (!this.options.shouldCapture(currentState, currentAction)) {
          return;
        }

        // Transform state
        const transformedState = this.options.transformState(currentState);

        // Prepare state to send
        const stateToSend = {
          timestamp: new Date().toISOString(),
          action: currentAction?.type || 'unknown',
          state: transformedState
        };

        // Avoid sending identical states
        const stateString = JSON.stringify(stateToSend);
        if (stateString === this.lastSentState) {
          return;
        }

        // Send to server
        await axios.post(this.options.endpoint, stateToSend, {
          headers: { 'Content-Type': 'application/json' }
        });

        // Update last sent state
        this.lastSentState = stateString;
      } catch (error) {
        console.error('State capture error:', error);
      }
    }, this.options.debounceTime);
  }
}

// Convenience function to create and start observer
export function initStateObserver(store, options = {}) {
  // Only run on client side
  if (typeof window === 'undefined') return null;

  const observer = new StateObserver(store, options);
  return observer.start();
}
