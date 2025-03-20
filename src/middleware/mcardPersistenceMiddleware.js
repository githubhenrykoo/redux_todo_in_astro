import McardStorageService from '../services/mcardStorageService.js';

/**
 * Determines if an action should be persisted based on its type
 * @param {Object} action - Redux action
 * @returns {boolean} - Whether the action should be persisted
 */
const isPersistableAction = (action) => {
  if (!action || !action.type) return false;
  
  // Skip actions that start with these prefixes (typically internal Redux actions)
  const excludedPrefixes = [
    '@@redux/', 
    '@@INIT', 
    'persist/', 
    '_BATCH'
  ];
  
  if (excludedPrefixes.some(prefix => action.type.startsWith(prefix))) {
    return false;
  }
  
  // For testing, always persist actions from the todo slice
  if (action.type.startsWith('todo/')) {
    return true;
  }
  
  // Include actions from specific features
  const includedFeatures = [
    'content/', 
    'system/', 
    'theme/', 
    'user/'
  ];
  
  return includedFeatures.some(feature => action.type.includes(feature));
};

/**
 * Extract relevant state slices based on action type
 * @param {Object} action - Redux action
 * @param {Object} state - Current Redux state
 * @returns {Object} - Relevant state slices
 */
const getRelevantState = (action, state) => {
  const relevantState = {};
  
  // Extract feature name from the action type (e.g. 'todo/addTodo' => 'todo')
  const featureMatch = action.type.match(/^([^/]+)\//);
  if (featureMatch && featureMatch[1] && state[featureMatch[1]]) {
    // Only include the state slice related to this feature
    relevantState[featureMatch[1]] = state[featureMatch[1]];
  }
  
  return relevantState;
};

/**
 * Redux middleware to persist actions as MCards
 */
export const mcardPersistenceMiddleware = store => next => async action => {
  // Always let the action pass through first to update state
  const result = next(action);
  
  // Then persist if it's a persistable action
  try {
    if (isPersistableAction(action)) {
      console.log(`Persisting action: ${action.type}`);
      
      // Get state after the action has been processed
      const stateAfter = store.getState();
      
      // Create a new action object with state snapshot
      const actionToStore = {
        ...action,
        meta: {
          ...(action.meta || {}),
          stateSnapshot: {
            // Only include relevant state slices related to the action
            ...getRelevantState(action, stateAfter)
          }
        }
      };
      
      // Store the action (wait for it to complete to ensure it's stored)
      try {
        await McardStorageService.createAndStoreMCard(actionToStore);
        console.log(`Successfully persisted action: ${action.type}`);
      } catch (error) {
        console.error('Failed to persist action:', error);
      }
    }
  } catch (error) {
    console.error('Error in mcardPersistenceMiddleware:', error);
  }
  
  return result;
};
