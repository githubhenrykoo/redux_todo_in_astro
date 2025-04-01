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
    
    // Action to update the content type of the selected item
    updateContentType: (state, action) => {
      const { contentType } = action.payload;
      
      // Only update if there's currently a selected item
      if (state.selectedItem !== null) {
        console.log("Redux - Updating content type to:", contentType);
        state.metadata.contentType = contentType;
        
        // If it's a Buffer JSON that we've identified as text, decode it
        if (state.selectedItem && 
            typeof state.selectedItem === 'object' && 
            state.selectedItem.type === 'Buffer' && 
            Array.isArray(state.selectedItem.data) &&
            contentType === 'text/plain') {
          
          try {
            // Convert Buffer to text
            const array = new Uint8Array(state.selectedItem.data);
            const text = new TextDecoder().decode(array);
            console.log("Redux - Converted Buffer to text:", text.substring(0, 30) + "...");
            
            // Update the content
            state.content = text;
          } catch (e) {
            console.error("Redux - Error decoding Buffer content:", e);
          }
        }
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

export const { selectItem, updateContentType, clearSelectedItem } = selectedItemSlice.actions;
export default selectedItemSlice.reducer;
