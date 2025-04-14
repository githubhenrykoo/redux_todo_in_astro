import { createSlice } from '@reduxjs/toolkit';

const testLogsSlice = createSlice({
    name: 'testLogs',
    initialState: {
        status: 'idle',
        logs: [],
        screenshots: []
    },
    reducers: {
        addLog: (state, action) => {
            state.logs.push(action.payload);
        },
        addScreenshot: (state, action) => {
            state.screenshots.push(action.payload);
        },
        setStatus: (state, action) => {
            state.status = action.payload;
        },
        clearLogs: (state) => {
            state.logs = [];
            state.screenshots = [];
            state.status = 'idle';
        }
    }
});

export const { addLog, addScreenshot, setStatus, clearLogs } = testLogsSlice.actions;
export default testLogsSlice.reducer;