import { createSlice } from "@reduxjs/toolkit";
import layoutConfig from "./panellayoutSlice.json";

const initialState = {
  panels: layoutConfig["todo_layout"],
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
      } else {
        console.error(`Layout ${layoutName} not found`);
      }
    }
  },
});

export const { changeLayout } = panellayoutSlice.actions;
export default panellayoutSlice.reducer;
