import { configureStore } from '@reduxjs/toolkit';
import filesReducer from './slices/filesSlice';

export const store = configureStore({
    reducer: {
        files: filesReducer
    }
});