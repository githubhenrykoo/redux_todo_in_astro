import { MCard } from '../models/MCard';
import { SQLiteEngine } from '../engine/sqlite_engine';

export class ReduxStateObserver {
  constructor(store, options = {}) {
    this.store = store;
    this.options = {
      // Optional configuration to filter or modify state capture
      shouldCapture: options.shouldCapture || (() => true),
      transformState: options.transformState || (state => state)
    };
    this.previousState = store.getState();
    this.lastDispatchedAction = null;
  }

  observe() {
    this.unsubscribe = this.store.subscribe(() => {
      const currentState = this.store.getState();
      
      try {
        // Use the last dispatched action from the store
        const action = this.lastDispatchedAction;
        
        // Optional filtering of state capture
        if (this.options.shouldCapture(currentState, action)) {
          this.persistState(action, currentState);
        }
      } catch (error) {
        console.error('State observation error:', error);
      }

      this.previousState = currentState;
    });

    // Wrap the original dispatch to capture the last action
    const originalDispatch = this.store.dispatch;
    this.store.dispatch = (action) => {
      this.lastDispatchedAction = action;
      return originalDispatch(action);
    };
  }

  persistState(action, state) {
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

  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      // Restore original dispatch if needed
      this.store.dispatch = this.originalDispatch;
    }
  }
}

// Singleton initialization
let observerInstance = null;

export const initStateObserver = (store, options = {}) => {
  if (!observerInstance) {
    observerInstance = new ReduxStateObserver(store, options);
    observerInstance.observe();
  }
  return observerInstance;
};

export const getStateObserver = () => observerInstance;
