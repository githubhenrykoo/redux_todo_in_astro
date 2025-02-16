import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentLayout: 'default'
};

const resizeableSlice = createSlice({
  name: "resizeable",
  initialState,
  reducers: {
    changeLayout: (state, action) => {
      const layoutName = action.payload;
      
      // Always set to the provided layout or default
      state.currentLayout = layoutName || 'default';
    }
  },
});

export const { changeLayout } = resizeableSlice.actions;
export default resizeableSlice.reducer;