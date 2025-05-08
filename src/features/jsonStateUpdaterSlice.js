import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  lastUploadedJson: null,
  changeHistory: [],
  isUpdateInProgress: false,
  lastError: null
};

export const jsonStateUpdaterSlice = createSlice({
  name: 'jsonStateUpdater',
  initialState,
  reducers: {
    // Track the last uploaded JSON
    setLastUploadedJson: (state, action) => {
      state.lastUploadedJson = action.payload;
    },
    
    // Add an entry to the change history
    addToChangeHistory: (state, action) => {
      state.changeHistory.push({
        timestamp: new Date().toISOString(),
        description: action.payload.description,
        targetSlice: action.payload.targetSlice,
        changeType: action.payload.changeType
      });
    },
    
    // Set update status
    setUpdateInProgress: (state, action) => {
      state.isUpdateInProgress = action.payload;
    },
    
    // Set last error
    setLastError: (state, action) => {
      state.lastError = action.payload;
    },

    // Clear history
    clearHistory: (state) => {
      state.changeHistory = [];
    }
  }
});

export const { 
  setLastUploadedJson, 
  addToChangeHistory, 
  setUpdateInProgress,
  setLastError,
  clearHistory 
} = jsonStateUpdaterSlice.actions;

export default jsonStateUpdaterSlice.reducer;
