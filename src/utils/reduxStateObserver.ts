import type { Action } from '@reduxjs/toolkit';
import { MCard } from '../content/model/mcard.js';
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
  private isEnabled: boolean;

  constructor(store: StoreInterface) {
    this.store = store;
    this.previousState = store.getState();
    this.lastDispatchedAction = null;
    this.unsubscribe = null;
    this.originalDispatch = store.dispatch;
    this.isEnabled = true;
  }

  observe(): void {
    try {
      console.log('Attempting to initialize Redux State Observer');
      
      this.unsubscribe = this.store.subscribe(() => {
        if (!this.isEnabled) return;

        try {
          const currentState = this.store.getState();
          const action = this.lastDispatchedAction;
          
          console.log('State change detected:', action?.type);
          
          // Always capture state changes
          this.persistState(action, currentState);
        } catch (error) {
          console.error('State observation error (in subscriber):', error);
          this.disable();
        }

        this.previousState = this.store.getState();
      });

      // Wrap the original dispatch to capture the last action
      this.store.dispatch = (action: PayloadAction) => {
        if (!this.isEnabled) return this.originalDispatch(action);

        try {
          this.lastDispatchedAction = action;
          return this.originalDispatch(action);
        } catch (error) {
          console.error('Dispatch error:', error);
          this.disable();
          return this.originalDispatch(action);
        }
      };

      console.log('Redux State Observer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Redux State Observer:', error);
      this.disable();
    }
  }

  persistState(action: PayloadAction | null, state: any): void {
    if (!this.isEnabled) return;

    try {
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
      } catch (dbError) {
        console.error('Database persistence error:', dbError);
        this.disable();
      }
    } catch (error) {
      console.error('State serialization error:', error);
      this.disable();
    }
  }

  disable(): void {
    console.warn('Disabling Redux State Observer due to errors');
    this.isEnabled = false;
    this.stop();
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
  try {
    if (!observerInstance) {
      observerInstance = new ReduxStateObserver(store);
      observerInstance.observe();
    }
    return observerInstance;
  } catch (error) {
    console.error('Failed to create state observer:', error);
    return null as any;
  }
};

export const getStateObserver = (): ReduxStateObserver | null => observerInstance;
