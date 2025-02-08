import { configureStore } from '@reduxjs/toolkit';
import todoReducer from './features/todoSlice';
import themeReducer from './features/themeSlice';
import panellayoutReducer from './features/panellayoutSlice';
import contentReducer from './features/contentSlice';

const store = configureStore({
  reducer: {
    todo: todoReducer,
    theme: themeReducer,
    panellayout: panellayoutReducer,
    content: contentReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
        ],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export { store };