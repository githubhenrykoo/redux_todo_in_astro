import { createSlice } from "@reduxjs/toolkit";
import resizeableConfig from "./resizeable.json";

const initialState = {
  currentLayout: 'default',
  layouts: resizeableConfig.layouts,
};

const resizeableSlice = createSlice({
  name: "resizeable",
  initialState,
  reducers: {
    changeLayout: (state, action) => {
      const layoutName = action.payload;
      
      // Validate layout exists
      state.currentLayout = state.layouts[layoutName] ? layoutName : 'default';
    }
  },
});

export const { changeLayout } = resizeableSlice.actions;
export default resizeableSlice.reducer;