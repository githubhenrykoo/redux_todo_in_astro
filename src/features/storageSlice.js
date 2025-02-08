import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';

// Async thunk for checking storage availability
export const checkStorageAvailability = createAsyncThunk(
  'storage/checkAvailability',
  async (_, { rejectWithValue }) => {
    try {
      // Check different storage mechanisms
      const checks = [
        { 
          type: 'localStorage', 
          available: typeof localStorage !== 'undefined' 
        },
        { 
          type: 'indexedDB', 
          available: typeof indexedDB !== 'undefined' 
        },
        // Add more storage type checks as needed
      ];

      return checks;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for calculating storage usage
export const calculateStorageUsage = createAsyncThunk(
  'storage/calculateUsage',
  async (_, { rejectWithValue }) => {
    try {
      // Estimate storage usage
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage,
          quota: estimate.quota,
          percentageUsed: (estimate.usage / estimate.quota) * 100
        };
      }
      
      // Fallback for browsers without storage estimation
      return {
        usage: 0,
        quota: 0,
        percentageUsed: 0
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  adapters: {
    primary: 'indexedDB', // Default primary storage
    fallback: ['localStorage', 'memory'],
    available: []
  },
  usage: {
    status: 'idle', // 'idle' | 'calculating' | 'complete'
    usage: 0,
    quota: 0,
    percentageUsed: 0,
    error: null
  },
  persistence: {
    enabled: true,
    strategy: 'default', // 'default' | 'aggressive' | 'conservative'
    autoSync: true
  },
  sync: {
    lastSync: null,
    status: 'idle', // 'idle' | 'syncing' | 'error'
    error: null
  }
};

export const storageSlice = createSlice({
  name: 'storage',
  initialState,
  reducers: {
    // Update storage persistence strategy
    updatePersistenceStrategy: (state, action) => {
      state.persistence.strategy = action.payload;
    },

    // Toggle auto sync
    toggleAutoSync: (state, action) => {
      state.persistence.autoSync = action.payload;
    },

    // Reset storage state
    resetStorageState: () => initialState
  },
  extraReducers: (builder) => {
    // Storage Availability Check
    builder
      .addCase(checkStorageAvailability.fulfilled, (state, action) => {
        state.adapters.available = action.payload
          .filter(adapter => adapter.available)
          .map(adapter => adapter.type);
      })

    // Storage Usage Calculation  
    builder
      .addCase(calculateStorageUsage.pending, (state) => {
        state.usage.status = 'calculating';
      })
      .addCase(calculateStorageUsage.fulfilled, (state, action) => {
        state.usage = {
          status: 'complete',
          usage: action.payload.usage,
          quota: action.payload.quota,
          percentageUsed: action.payload.percentageUsed,
          error: null
        };
      })
      .addCase(calculateStorageUsage.rejected, (state, action) => {
        state.usage = {
          ...state.usage,
          status: 'error',
          error: action.payload
        };
      });
  }
});

// Selectors
export const selectStorageAdapters = createSelector(
  [(state) => state.storage],
  (storage) => storage.adapters
);

export const selectStorageUsage = createSelector(
  [(state) => state.storage],
  (storage) => storage.usage
);

export const selectStoragePersistence = createSelector(
  [(state) => state.storage],
  (storage) => storage.persistence
);

export const { 
  updatePersistenceStrategy, 
  toggleAutoSync, 
  resetStorageState 
} = storageSlice.actions;

export default storageSlice.reducer;
