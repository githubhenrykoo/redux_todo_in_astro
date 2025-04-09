import { createSlice } from '@reduxjs/toolkit';

const logsSlice = createSlice({
    name: 'logs',
    initialState: {
        testLogs: []
    },
    reducers: {
        addLog: (state, action) => {
            state.testLogs.push(action.payload);
        },
        clearLogs: (state) => {
            state.testLogs = [];
        }
    }
});

export const { addLog, clearLogs } = logsSlice.actions;
export default logsSlice.reducer;