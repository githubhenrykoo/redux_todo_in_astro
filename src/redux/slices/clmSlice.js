import { createSlice } from '@reduxjs/toolkit';
import fs from 'fs';
import path from 'path';

const initialState = {
    title: '',
    abstractSpecification: {
        context: '',
        goal: '',
        successCriteria: ''
    },
    concreteImplementation: {
        inputs: '',
        activities: '',
        outputs: '',
        uploadedFiles: []
    },
    lastUpdated: null,
    currentHash: null,
    isLoading: false,
    error: null
};

const saveToJsonFile = (data) => {
    const jsonData = JSON.stringify(data, null, 2);
    const filePath = path.join(process.cwd(), 'clm-redux.json');
    fs.writeFileSync(filePath, jsonData, 'utf8');
};

const clmSlice = createSlice({
    name: 'clm',
    initialState,
    reducers: {
        setTitle: (state, action) => {
            state.title = action.payload;
            state.lastUpdated = new Date().toISOString();
            saveToJsonFile(state);
        },
        updateAbstractSpecification: (state, action) => {
            const { field, value } = action.payload;
            state.abstractSpecification[field] = value;
            state.lastUpdated = new Date().toISOString();
            saveToJsonFile(state);
        },
        updateConcreteImplementation: (state, action) => {
            const { field, value } = action.payload;
            state.concreteImplementation[field] = value;
            state.lastUpdated = new Date().toISOString();
            saveToJsonFile(state);
        },
        addUploadedFile: (state, action) => {
            state.concreteImplementation.uploadedFiles.push(action.payload);
            state.lastUpdated = new Date().toISOString();
            saveToJsonFile(state);
        },
        setCurrentHash: (state, action) => {
            state.currentHash = action.payload;
            saveToJsonFile(state);
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        resetState: () => {
            const newState = initialState;
            saveToJsonFile(newState);
            return newState;
        }
    }
});

export const {
    setTitle,
    updateAbstractSpecification,
    updateConcreteImplementation,
    addUploadedFile,
    setCurrentHash,
    setLoading,
    setError,
    exportToJson,
    resetState
} = clmSlice.actions;

export default clmSlice.reducer;