import { configureStore } from '@reduxjs/toolkit';
import chatbotReducer from './features/chatbotSlice';
import testLogsReducer from './features/testLogsSlice';
import pythonreplReducer from './features/pythonreplSlice';

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
import selectedItemReducer from './features/selectedItemSlice';
import mqttReducer from './store/mqttSlice';

export const store = configureStore({
  reducer: {
    // Core State
    theme: themeReducer,
    user: userReducer,
    
    // Feature States
    content: contentReducer,
    search: searchReducer,
    system: systemReducer,
    todo: todoReducer,
    mqtt: mqttReducer,
    testLogs: testLogsReducer,
    chatbot: chatbotReducer,
    pythonrepl: pythonreplReducer,
    
    // UI States
    panellayout: panellayoutReducer,
    activePanel: activePanelReducer,
    resizeable: resizeableReducer,
    selectedItem: selectedItemReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false
    }),
  devTools: {
    name: 'Progressive Knowledge Container',
    trace: true,
    traceLimit: 25
  }
});

// Make store globally accessible in browser environments
if (typeof window !== 'undefined') {
  window['store'] = store;
  
  if (import.meta.env.DEV) {
    window['dispatch'] = store.dispatch;
    window['getState'] = store.getState;
  }
}