import { configureStore } from '@reduxjs/toolkit';
import todoReducer from './features/todo/todoSlice';

const store = configureStore({
  reducer: {
    // Add your reducers here
    todo: todoReducer
  },
});

export default store;