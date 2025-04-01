import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedItem: null,
  metadata: {
    hash: "null",
    contentType: "null",
    gtime: "null"
  },
  content: null
};

const selectedItemSlice = createSlice({
  name: 'selectedItem',
  initialState,
  reducers: {
    // Action to select an item and update its metadata
    selectItem: (state, action) => {
      const { 
        item, 
        hash = "null", 
        contentType = "null", 
        gtime = new Date().toISOString() 
      } = action.payload;

      state.selectedItem = item;
      state.metadata.hash = hash;
      state.metadata.contentType = contentType;
      state.metadata.gtime = gtime;
      
      // Handle different content types
      if (typeof item === 'string') {
        // Text content
        state.content = item;
      } else if (item instanceof ArrayBuffer || item instanceof Uint8Array) {
        // Binary content
        state.content = item;
      } else {
        // JSON or other object content
        state.content = JSON.stringify(item);
      }
    },
    
    // Action to clear the selected item
    clearSelectedItem: (state) => {
      state.selectedItem = null;
      state.metadata = {
        hash: "null",
        contentType: "null",
        gtime: "null"
      };
      state.content = null;
    }
  }
});

export const { selectItem, clearSelectedItem } = selectedItemSlice.actions;
export default selectedItemSlice.reducer;
