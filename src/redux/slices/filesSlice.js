import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    uploadedFiles: [],
    isUploading: false,
    uploadError: null
};

const filesSlice = createSlice({
    name: 'files',
    initialState,
    reducers: {
        setIsUploading: (state, action) => {
            state.isUploading = action.payload;
        },
        setUploadError: (state, action) => {
            state.uploadError = action.payload;
        },
        addUploadedFiles: (state, action) => {
            state.uploadedFiles = [...state.uploadedFiles, ...action.payload];
        }
    }
});

export const { setIsUploading, setUploadError, addUploadedFiles } = filesSlice.actions;
export default filesSlice.reducer;