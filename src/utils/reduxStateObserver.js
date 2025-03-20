import { MCard } from '../models/MCard';
import { SQLiteEngine } from '../engine/sqlite_engine';

export class ReduxStateObserver {
  constructor(store, options = {}) {
    this.store = store;
    this.options = {
      enabled: true,
      excludedActionTypes: ['@@INIT', 'persist/REHYDRATE'],
      sensitiveKeys: ['password', 'token', 'credentials', 'secret', 'key'],
      ...options
    };
    this.previousState = store.getState();
    this.initialized = false;
  }

  // Begin observing state changes
  observe() {
    if (!this.options.enabled) return;
    
    if (this.initialized) {
      console.warn('Redux State Observer already initialized');
      return;
    }
    
    this.unsubscribe = this.store.subscribe(() => {
      this.handleStateChange();
    });
    
    this.initialized = true;
    console.log('Redux State Observer initialized');
  }
  
  // Stop observing state changes
  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.initialized = false;
      console.log('Redux State Observer stopped');
    }
  }
  
  // Handle state changes and persist actions
  handleStateChange() {
    const currentState = this.store.getState();
    const previousState = this.previousState;
    this.previousState = currentState;
    
    // Get the latest action from Redux DevTools
    // This is a non-invasive way to capture actions without middleware
    try {
      // Check if we're in a browser environment with DevTools
      if (typeof window !== 'undefined' && 
          window.__REDUX_DEVTOOLS_EXTENSION__) {
        
        const devTools = window.__REDUX_DEVTOOLS_EXTENSION__;
        const latestState = devTools.getLatestState();
        
        if (latestState && latestState.actionsById) {
          // Get the most recent action
          const actionIds = Object.keys(latestState.actionsById)
            .map(Number)
            .sort((a, b) => b - a);
          
          if (actionIds.length > 0) {
            const latestActionId = actionIds[0];
            const latestAction = latestState.actionsById[latestActionId].action;
            
            this.persistAction(latestAction, currentState, previousState);
          }
        }
      }
    } catch (error) {
      console.error('Error accessing Redux DevTools:', error);
    }
  }
  
  // Persist the action to MCard storage
  async persistAction(action, currentState, previousState) {
    if (!action || !action.type) return;
    
    // Check if this action should be persisted
    if (this.options.excludedActionTypes.includes(action.type)) {
      return;
    }
    
    try {
      // Get sanitized copy of the action payload
      const sanitizedPayload = this.sanitizePayload(action.payload);
      
      // Create action data with relevant state changes
      const actionData = {
        type: action.type,
        payload: sanitizedPayload,
        timestamp: new Date().toISOString(),
        stateDiff: this.computeStateDifference(previousState, currentState)
      };
      
      // Create and store MCard directly
      const mcard = new MCard(
        JSON.stringify(actionData),
        'application/json',
        {
          actionType: action.type,
          source: 'redux-action'
        }
      );
      
      await SQLiteEngine.getInstance().storeMCard(mcard);
    } catch (error) {
      console.error('Error persisting action:', error);
    }
  }
  
  // Sanitize action payload to remove sensitive data
  sanitizePayload(payload) {
    if (!payload || typeof payload !== 'object') return payload;
    
    return Object.entries(payload).reduce((sanitized, [key, value]) => {
      // Skip sensitive keys
      if (this.options.sensitiveKeys.some(
        sensitive => key.toLowerCase().includes(sensitive)
      )) {
        sanitized[key] = '[REDACTED]';
        return sanitized;
      }
      
      // Recursively sanitize nested objects
      if (value && typeof value === 'object') {
        sanitized[key] = this.sanitizePayload(value);
      } else {
        sanitized[key] = value;
      }
      
      return sanitized;
    }, {});
  }
  
  // Compute the difference between previous and current state
  computeStateDifference(prevState, currentState) {
    const changes = {};
    
    Object.keys(currentState).forEach(key => {
      if (prevState[key] !== currentState[key]) {
        changes[key] = {
          changed: true,
          preview: this.createStatePreview(currentState[key])
        };
      }
    });
    
    return changes;
  }
  
  // Create a preview of state objects (limits size for large objects)
  createStatePreview(stateSlice) {
    if (typeof stateSlice !== 'object' || stateSlice === null) {
      return stateSlice;
    }
    
    if (Array.isArray(stateSlice)) {
      return {
        length: stateSlice.length,
        sample: stateSlice.slice(0, 3)
      };
    }
    
    const keys = Object.keys(stateSlice);
    const preview = {};
    
    keys.slice(0, 5).forEach(key => {
      preview[key] = stateSlice[key];
    });
    
    if (keys.length > 5) {
      preview._more = `${keys.length - 5} more keys`;
    }
    
    return preview;
  }
}

// Create singleton instance for use throughout the app
let observerInstance = null;

export const initStateObserver = (store) => {
  if (!observerInstance) {
    observerInstance = new ReduxStateObserver(store);
    observerInstance.observe();
  }
  return observerInstance;
};

export const getStateObserver = () => observerInstance;
