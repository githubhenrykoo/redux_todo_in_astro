import { store } from '../store';
import { initStateWatcher } from './stateWatcher';

// Immediately initialize state tracking
console.log(' Initializing State Tracking');
try {
  initStateWatcher(store);
} catch (error) {
  console.error(' Failed to initialize state tracking:', error);
}

// Export store for potential use in other modules
export { store };
