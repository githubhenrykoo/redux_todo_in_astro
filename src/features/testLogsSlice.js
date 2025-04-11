import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    status: 'idle',
    logs: [],
    screenshots: [],
    testHistory: [],
    currentTest: null,
    startTime: null,
    endTime: null
};

const testLogsSlice = createSlice({
    name: 'testLogs',
    initialState,
    reducers: {
        setStatus: (state, action) => {
            state.status = action.payload;
            if (action.payload === 'running') {
                state.startTime = new Date().toISOString();
            } else if (['completed', 'error'].includes(action.payload)) {
                state.endTime = new Date().toISOString();
                state.testHistory.push({
                    test: state.currentTest,
                    status: action.payload,
                    startTime: state.startTime,
                    endTime: state.endTime,
                    logs: [...state.logs]
                });
            }
        },
        addLog: (state, action) => {
            const timestamp = new Date().toLocaleTimeString();
            state.logs.push({
                timestamp,
                message: action.payload,
                type: action.payload.includes('❌') ? 'error' : 
                      action.payload.includes('✓') ? 'success' : 
                      action.payload.includes('📸') ? 'screenshot' : 'info'
            });
        },
        addScreenshot: (state, action) => {
            state.screenshots.push({
                path: action.payload,
                timestamp: new Date().toISOString()
            });
        },
        clearLogs: (state) => {
            state.logs = [];
            state.screenshots = [];
            state.startTime = null;
            state.endTime = null;
        },
        setCurrentTest: (state, action) => {
            state.currentTest = action.payload;
        }
    }
});

export const { 
    setStatus, 
    addLog, 
    addScreenshot, 
    clearLogs,
    setCurrentTest 
} = testLogsSlice.actions;

export default testLogsSlice.reducer;