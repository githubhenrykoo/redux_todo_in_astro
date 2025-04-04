import type { Store, Action, UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from '../types/store';

interface StateObserverOptions {
  shouldCapture?: (state: RootState, action: Action | null) => boolean;
  transformState?: (state: RootState) => any;
  endpoint?: string;
  debounceTime?: number;
}

/**
 * Initializes a state observer that watches Redux store changes
 * and optionally sends them to an API endpoint
 */
export function initStateObserver(
  store: Store,
  options: StateObserverOptions = {}
) {
  const {
    shouldCapture = () => true,
    transformState = (state) => state,
    endpoint = '/api/state-capture',
    debounceTime = 1000,
  } = options;

  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastAction: Action | null = null;

  const observer = {
    start() {
      store.subscribe(() => {
        const state = store.getState();
        
        if (shouldCapture(state, lastAction)) {
          if (timer) clearTimeout(timer);
          
          timer = setTimeout(() => {
            const transformedState = transformState(state);
            
            // Only in browser environment
            if (typeof window !== 'undefined') {
              fetch(endpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  state: transformedState,
                  action: lastAction,
                  timestamp: Date.now()
                }),
              }).catch(err => console.error('Failed to capture state:', err));
            }
            
            timer = null;
          }, debounceTime);
        }
      });
      
      // Wrap dispatch to capture actions
      const originalDispatch = store.dispatch;
      store.dispatch = ((action: UnknownAction) => {
        lastAction = action as Action;
        return originalDispatch(action);
      }) as typeof store.dispatch;
    },
    
    stop() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }
  };
  
  observer.start();
  return observer;
}
