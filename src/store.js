import { configureStore } from '@reduxjs/toolkit';

// Core Reducers
import themeReducer from './features/themeSlice';
import userReducer from './features/userSlice';

// Feature Reducers
import contentReducer from './features/contentSlice';
import panellayoutReducer from './features/panellayoutSlice';
import activePanelReducer from './features/activePanelSlice';
import searchReducer from './features/searchSlice';
import systemReducer from './features/systemSlice';
import todoReducer from './features/todoSlice';
import resizeableReducer from './features/resizeableSlice';

// Middleware
import { mcardPersistenceMiddleware } from './middleware/mcardPersistenceMiddleware';

const store = configureStore({
  reducer: {
    // Core State
    theme: themeReducer,
    user: userReducer,
    
    // Feature States
    content: contentReducer,
    search: searchReducer,
    system: systemReducer,
    todo: todoReducer,
    
    // UI States
    panellayout: panellayoutReducer,
    activePanel: activePanelReducer,
    resizeable: resizeableReducer,
    
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    }).concat(mcardPersistenceMiddleware),
  devTools: {
    name: 'Progressive Knowledge Container',
    trace: true,
    traceLimit: 25
  }
});

export { store };