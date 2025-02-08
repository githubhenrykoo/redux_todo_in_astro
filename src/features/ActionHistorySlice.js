import { createSlice, nanoid } from '@reduxjs/toolkit';

// Initial state for action history
const initialState = {
  actions: [],
  totalActionCount: 0
};

// Action History Slice
const actionHistorySlice = createSlice({
  name: 'actionHistory',
  initialState,
  reducers: {
    // Record a new action in the history
    recordAction: {
      reducer: (state, action) => {
        // Add the new action to the actions array
        state.actions.push(action.payload);
        state.totalActionCount++;

        // Optional: Limit the number of stored actions to prevent memory bloat
        if (state.actions.length > 1000) {
          state.actions.shift(); // Remove the oldest action
        }
      },
      prepare: (actionDetails) => ({
        payload: {
          hash: nanoid(), // Generate a unique hash
          timestamp: new Date().toISOString(),
          ...actionDetails
        }
      })
    }
  },
  
  // Selectors for retrieving action history
  selectors: {
    // Select all actions
    selectAllActions: (state) => state.actions,
    
    // Select recent actions (e.g., last 10)
    selectRecentActions: (state) => state.actions.slice(-10),
    
    // Select actions by type
    selectActionsByType: (state, type) => 
      state.actions.filter(action => action.type === type),
    
    // Get total number of actions
    selectTotalActionCount: (state) => state.totalActionCount
  }
});

// Export actions and reducer
export const { 
  recordAction 
} = actionHistorySlice.actions;

export const { 
  selectAllActions, 
  selectRecentActions, 
  selectActionsByType,
  selectTotalActionCount
} = actionHistorySlice.selectors;

export default actionHistorySlice.reducer;
