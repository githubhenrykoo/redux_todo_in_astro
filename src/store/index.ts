import { configureStore } from '@reduxjs/toolkit';

// Core Reducers
import themeReducer from '../features/themeSlice';
import layoutConfigReducer from '../features/layoutConfigSlice';
import userReducer from '../features/userSlice';

// Feature Reducers
import contentReducer from '../features/contentSlice';
import llmReducer from '../features/llmSlice';
import actionHistoryReducer from '../features/ActionHistorySlice';

// UI Reducers
import activePanelReducer from '../features/activePanelSlice';
import panelLayoutReducer from '../features/panellayoutSlice';

// System Reducers
import networkReducer from '../features/networkSlice';
import storageReducer from '../features/storageSlice';

export const store = configureStore({
  reducer: {
    // Core State
    core: {
      theme: themeReducer,
      layout: layoutConfigReducer,
      user: userReducer
    },
    
    // Feature States
    features: {
      content: contentReducer,
      llm: llmReducer,
      history: actionHistoryReducer
    },
    
    // UI States
    ui: {
      activePanel: activePanelReducer,
      panelLayout: panelLayoutReducer
    },
    
    // System States
    network: networkReducer,
    storage: storageReducer,
  },
  
  // Optional: Add middleware or enhancers
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false // Disable for complex states
    })
});

// Type definitions for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
