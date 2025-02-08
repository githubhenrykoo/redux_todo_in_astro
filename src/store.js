import { configureStore } from '@reduxjs/toolkit';

// Core Reducers
import themeReducer from './features/themeSlice';
import layoutConfigReducer from './features/layoutConfigSlice';
import userReducer from './features/userSlice';

// Feature Reducers
import contentReducer from './features/contentSlice';
import llmReducer from './features/llmSlice';
import actionHistoryReducer from './features/ActionHistorySlice';
import panellayoutReducer from './features/panellayoutSlice';
import activePanelReducer from './features/activePanelSlice';

// System Reducers
import networkReducer from './features/networkSlice';
import storageReducer from './features/storageSlice';

const store = configureStore({
  reducer: {
    // Core State
    theme: themeReducer,
    layout: layoutConfigReducer,
    user: userReducer,
    
    // Feature States
    content: contentReducer,
    llm: llmReducer,
    history: actionHistoryReducer,
    
    // UI States
    panellayout: panellayoutReducer,
    activePanel: activePanelReducer,
    
    // System States
    network: networkReducer,
    storage: storageReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          // Content-related actions
          'content/addContent',
          'content/deleteContent',
          'content/selectContent',
          
          // New actions to ignore
          'llm/generateContent',
          'network/checkTRPCConnection',
          'storage/calculateStorageUsage'
        ],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export { store };