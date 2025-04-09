import { configureStore } from '@reduxjs/toolkit';
import logsReducer from './features/logsSlice';

export const store = configureStore({
    reducer: {
        logs: logsReducer
    }
});