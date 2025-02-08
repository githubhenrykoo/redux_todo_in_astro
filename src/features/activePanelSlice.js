import { createSlice, createSelector } from '@reduxjs/toolkit';

const initialState = {
  currentPanel: null,
  panelHistory: [],
  focusedPanels: {
    primary: null,
    secondary: null,
    tertiary: null
  },
  panelFocusPriority: ['primary', 'secondary', 'tertiary']
};

export const activePanelSlice = createSlice({
  name: 'activePanel',
  initialState,
  reducers: {
    // Set the currently active panel
    setActivePanel: (state, action) => {
      const { panelId, priority = 'primary' } = action.payload;
      
      // Update panel history
      if (state.currentPanel && state.currentPanel !== panelId) {
        state.panelHistory.push(state.currentPanel);
        
        // Limit history to last 10 panels
        if (state.panelHistory.length > 10) {
          state.panelHistory.shift();
        }
      }

      // Update current panel and focused panels
      state.currentPanel = panelId;
      state.focusedPanels[priority] = panelId;
    },

    // Go back to previous panel
    goToPreviousPanel: (state) => {
      if (state.panelHistory.length > 0) {
        const previousPanel = state.panelHistory.pop();
        state.currentPanel = previousPanel;
      }
    },

    // Clear panel focus
    clearPanelFocus: (state, action) => {
      const { priority = 'primary' } = action.payload;
      state.focusedPanels[priority] = null;
    },

    // Reset panel tracking
    resetPanelTracking: () => initialState
  }
});

// Selectors
export const selectCurrentPanel = createSelector(
  [(state) => state.activePanel],
  (activePanel) => activePanel.currentPanel
);

export const selectFocusedPanels = createSelector(
  [(state) => state.activePanel],
  (activePanel) => activePanel.focusedPanels
);

export const selectPanelHistory = createSelector(
  [(state) => state.activePanel],
  (activePanel) => activePanel.panelHistory
);

export const { 
  setActivePanel, 
  goToPreviousPanel, 
  clearPanelFocus, 
  resetPanelTracking 
} = activePanelSlice.actions;

export default activePanelSlice.reducer;
