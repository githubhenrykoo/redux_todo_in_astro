import { configureStore } from '@reduxjs/toolkit';
import todoReducer from './features/todoSlice';
import themeReducer from './features/themeSlice';
import interfaceReducer from './features/interfaceSlice';

export const store = configureStore({
  reducer: {
    todo: todoReducer,
    theme: themeReducer,
    interface: interfaceReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['todo/addTodo', 'todo/removeTodo', 'todo/selectTodo'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});