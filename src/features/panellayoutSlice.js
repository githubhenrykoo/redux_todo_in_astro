import { createSlice } from "@reduxjs/toolkit";
import layoutConfig from "./panellayoutSlice.json";

const initialState = {
  panels: layoutConfig["todo_layout"],
};

// Create a function to trigger auto-save
// This will be called after layout changes
const triggerAutoSave = () => {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // Dispatch a custom event that TopBar can listen for
    window.dispatchEvent(new CustomEvent('redux-state-change', {
      detail: { source: 'panellayout' }
    }));
    console.log('Triggered custom auto-save event after layout change');
  }
};

const panellayoutSlice = createSlice({
  name: "panellayout",
  initialState,
  reducers: {
    changeLayout: (state, action) => {
      const layoutName = action.payload;
      console.log('Changing layout:', layoutName);
      console.log('Current state:', state);
      console.log('Available layouts:', Object.keys(layoutConfig));
      
      const newLayout = layoutConfig[layoutName];
      if (newLayout) {
        console.log('New layout:', newLayout);
        state.panels = newLayout;
        // Schedule the trigger function to run after this reducer completes
        setTimeout(() => triggerAutoSave(), 0);
      } else {
        console.error(`Layout ${layoutName} not found`);
      }
    }
  },
});

export const { changeLayout } = panellayoutSlice.actions;
export default panellayoutSlice.reducer;
