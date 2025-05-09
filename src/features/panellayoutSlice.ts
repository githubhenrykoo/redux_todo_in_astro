import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PanelConfig {
  type: string;
  size: number;
  minSize: number;
  visible: boolean;
}

interface LayoutConfig {
  left: PanelConfig;
  middle: PanelConfig;
  right: PanelConfig;
}

interface PanelLayoutState {
  currentLayout: string;
  previousLayout: string;
  layouts: {
    [key: string]: LayoutConfig;
  };
  layoutHistory: {
    from: string;
    to: string;
    timestamp: number;
  }[];
}

// Initialize state with your existing layouts
const initialState: PanelLayoutState = {
  currentLayout: 'todo_layout',
  previousLayout: '',
  layouts: {
    // ... existing code ...
  },
  layoutHistory: []
};

const panelLayoutSlice = createSlice({
  name: 'panelLayout',
  initialState,
  reducers: {
    changeLayout: (state, action: PayloadAction<string>) => {
      const newLayout = action.payload;
      if (state.currentLayout !== newLayout) {
        // Record the layout change in history
        state.layoutHistory.push({
          from: state.currentLayout,
          to: newLayout,
          timestamp: Date.now()
        });
        // Update previous and current layout
        state.previousLayout = state.currentLayout;
        state.currentLayout = newLayout;
      }
    },
    clearLayoutHistory: (state) => {
      state.layoutHistory = [];
    }
  }
});

export const { changeLayout, clearLayoutHistory } = panelLayoutSlice.actions;
export default panelLayoutSlice.reducer;
