import { configureStore } from '@reduxjs/toolkit';
import todoReducer from './features/todoSlice';

export const store = configureStore({
  reducer: {
    todo: todoReducer
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