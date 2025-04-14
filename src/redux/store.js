import { configureStore } from '@reduxjs/toolkit';
import logsReducer from './features/logsSlice';
import testLogsReducer from './features/testLogsSlice';
import { actionLoggerMiddleware } from '../middleware/actionLoggerMiddleware';

// Define log directory
const LOG_DIR = '/Users/alessandrorumampuk/Documents/GitHub/redux_todo_in_astro/logs';

export const store = configureStore({
    reducer: {
        logs: logsReducer,
        testLogs: testLogsReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(actionLoggerMiddleware)
});

// Export log directory for use in other parts of the application
export { LOG_DIR };