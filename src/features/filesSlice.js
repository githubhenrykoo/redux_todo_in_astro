import { createSlice } from '@reduxjs/toolkit';

const filesSlice = createSlice({
    name: 'files',
    initialState: {
        uploadedFiles: [],
        isUploading: false,
        uploadError: null
    },
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