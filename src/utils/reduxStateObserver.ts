import { SQLiteConnection } from '../engine/sqlite_engine';
import type { RootState } from '../types/store';
import type { Action } from '@reduxjs/toolkit';
import { MCardFromData } from '../content/model/mcard.js';

// Extend Action type to include payload
interface PayloadAction<T = any> extends Action {
  payload?: T;
}

interface StateObserverOptions {
  shouldCapture?: (state: RootState, action: PayloadAction | null) => boolean;
  transformState?: (state: RootState) => any;
}

interface StoreInterface {
  getState: () => RootState;
  dispatch: (action: PayloadAction) => any;
  subscribe: (callback: () => void) => () => void;
}

export class ReduxStateObserver {
  private store: StoreInterface;
  private options: Required<StateObserverOptions>;
  private previousState: RootState;
  private lastDispatchedAction: PayloadAction | null;
  private unsubscribe: (() => void) | null;
  private originalDispatch: (action: PayloadAction) => any;

  constructor(store: StoreInterface, options: StateObserverOptions = {}) {
    this.store = store;
    this.options = {
      shouldCapture: options.shouldCapture || (() => true),
      transformState: options.transformState || ((state) => state)
    };
    this.previousState = store.getState();
    this.lastDispatchedAction = null;
    this.unsubscribe = null;
    this.originalDispatch = store.dispatch;
  }

  observe(): void {
    this.unsubscribe = this.store.subscribe(() => {
      const currentState = this.store.getState();
      
      try {
        const action = this.lastDispatchedAction;
        
        if (this.options.shouldCapture(currentState, action)) {
          this.persistState(action, currentState);
        }
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

  persistState(action: PayloadAction | null, state: RootState): void {
    // Serialize state snapshot
    const serializedState = JSON.stringify({
      type: action?.type || 'unknown',
      payload: action?.payload,
      timestamp: new Date().toISOString(),
      state: this.options.transformState(state)
    });

    // Create MCard with serialized state
    const mcard = new MCardFromData(
      new TextEncoder().encode(serializedState),
      'redux-state-' + Date.now().toString(), // Generate unique hash
      Date.now().toString()
    );

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
  store: StoreInterface, 
  options: StateObserverOptions = {}
): ReduxStateObserver => {
  if (!observerInstance) {
    observerInstance = new ReduxStateObserver(store, options);
    observerInstance.observe();
  }
  return observerInstance;
};

export const getStateObserver = (): ReduxStateObserver | null => observerInstance;
