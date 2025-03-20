import { MCard } from '../models/MCard';
import { SQLiteEngine } from '../engine/sqlite_engine';
import type { RootState } from '../types/store';
import type { Action } from '@reduxjs/toolkit';

interface StateObserverOptions {
  shouldCapture?: (state: RootState, action: Action | null) => boolean;
  transformState?: (state: RootState) => any;
}

interface StoreInterface {
  getState: () => RootState;
  dispatch: (action: Action) => any;
  subscribe: (callback: () => void) => () => void;
}

export class ReduxStateObserver {
  private store: StoreInterface;
  private options: Required<StateObserverOptions>;
  private previousState: RootState;
  private lastDispatchedAction: Action | null;
  private unsubscribe: (() => void) | null;
  private originalDispatch: (action: Action) => any;

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
    this.store.dispatch = (action: Action) => {
      this.lastDispatchedAction = action;
      return this.originalDispatch(action);
    };
  }

  persistState(action: Action | null, state: RootState): void {
    // Create MCard with full state snapshot
    const mcard = new MCard(
      JSON.stringify({
        type: action?.type || 'unknown',
        payload: action?.payload,
        timestamp: new Date().toISOString(),
        state: this.options.transformState(state)
      }),
      'application/json',
      { source: 'redux-state' }
    );

    SQLiteEngine.getInstance().storeMCard(mcard);
  }

  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
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
