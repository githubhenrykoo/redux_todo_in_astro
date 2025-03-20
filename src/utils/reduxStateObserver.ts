import type { Action } from '@reduxjs/toolkit';
import MCard from '../content/model/mcard.js';
import { SQLiteConnection } from '../engine/sqlite_engine';

// Extend Action type to include payload
interface PayloadAction<T = any> extends Action {
  payload?: T;
}

// Define a more generic store interface
interface StoreInterface {
  getState: () => any;
  dispatch: (action: PayloadAction) => any;
  subscribe: (callback: () => void) => () => void;
}

export class ReduxStateObserver {
  private store: StoreInterface;
  private previousState: any;
  private lastDispatchedAction: PayloadAction | null;
  private unsubscribe: (() => void) | null;
  private originalDispatch: (action: PayloadAction) => any;

  constructor(store: StoreInterface) {
    this.store = store;
    this.previousState = store.getState();
    this.lastDispatchedAction = null;
    this.unsubscribe = null;
    this.originalDispatch = store.dispatch;
  }

  observe(): void {
    console.log('Initializing Redux State Observer');
    this.unsubscribe = this.store.subscribe(() => {
      const currentState = this.store.getState();
      
      try {
        const action = this.lastDispatchedAction;
        
        console.log('State change detected:', action?.type);
        
        // Always capture state changes
        this.persistState(action, currentState);
      } catch (error) {
        console.error('State observation error:', error);
      }

      this.previousState = currentState;
    });

    // Wrap the original dispatch to capture the last action
    this.store.dispatch = (action: PayloadAction) => {
      this.lastDispatchedAction = action;
      return this.originalDispatch(action);
    };
  }

  persistState(action: PayloadAction | null, state: any): void {
    // Serialize state snapshot
    const serializedState = JSON.stringify({
      type: action?.type || 'unknown',
      payload: action?.payload,
      timestamp: new Date().toISOString(),
      state: state
    });

    // Create MCard with serialized state
    const mcard = new MCard(serializedState);

    try {
      const engine = SQLiteConnection.getInstance();
      const stmt = engine.conn.prepare(
        'INSERT OR REPLACE INTO card (hash, content, g_time, metadata) VALUES (?, ?, ?, ?)'
      );
      
      stmt.run(
        mcard.hash, 
        serializedState, 
        mcard.g_time,
        JSON.stringify({ source: 'redux-state' })
      );
      
      console.log('State persisted to database:', mcard.hash);
    } catch (error) {
      console.error('Error persisting state:', error);
    }
  }

  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      // Restore original dispatch
      this.store.dispatch = this.originalDispatch;
    }
  }
}

// Singleton initialization
let observerInstance: ReduxStateObserver | null = null;

export const initStateObserver = (
  store: StoreInterface
): ReduxStateObserver => {
  if (!observerInstance) {
    observerInstance = new ReduxStateObserver(store);
    observerInstance.observe();
  }
  return observerInstance;
};

export const getStateObserver = (): ReduxStateObserver | null => observerInstance;
