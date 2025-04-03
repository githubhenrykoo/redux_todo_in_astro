import { createSlice } from "@reduxjs/toolkit";
import layoutConfig from "./panellayoutSlice.json";

const initialState = {
  panels: layoutConfig["mqtt_dashboard_layout"],
};

// Simplified function to trigger save
const triggerSave = () => {
  // Check if we're in the browser
  if (typeof window !== 'undefined' && window.forceSaveReduxState) {
    console.log('Directly calling forceSaveReduxState after layout change');
    window.forceSaveReduxState(true);
  } else {
    console.log('forceSaveReduxState not available');
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
        setTimeout(() => triggerSave(), 200);
      } else {
        console.error(`Layout ${layoutName} not found`);
      }
    }
  },
});

export const { changeLayout } = panellayoutSlice.actions;
export default panellayoutSlice.reducer;
