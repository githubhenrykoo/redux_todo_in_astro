import { configureStore } from '@reduxjs/toolkit';
import { RootState } from './types';

export function createStore(initialState?: Partial<RootState>) {
  return configureStore({
    reducer: {
      // Add your reducers here
    },
    preloadedState: initialState
  });
}
