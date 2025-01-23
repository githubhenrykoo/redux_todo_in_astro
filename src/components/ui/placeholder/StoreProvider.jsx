import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import todoReducer from '../../../features/todoSlice';

const store = configureStore({
  reducer: {
    todo: todoReducer,
  },
});

export default function StoreProvider({ children }) {
  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
}

// Export the store instance for direct access if needed
export { store };
