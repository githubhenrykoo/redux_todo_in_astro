import { createSlice } from '@reduxjs/toolkit';

const initialState = {
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
  balancedExpectations: {
    practicalBoundaries: '',
    evaluationMetrics: '',
    feedbackLoops: ''
  },
  activeDimension: 'abstractSpecification'
};

const clmSlice = createSlice({
  name: 'clm',
  initialState,
  reducers: {
    updateAbstractSpecification: (state, action) => {
      state.abstractSpecification[action.payload.key] = action.payload.value;
    },
    updateConcreteImplementation: (state, action) => {
      state.concreteImplementation[action.payload.key] = action.payload.value;
    },
    updateBalancedExpectations: (state, action) => {
      state.balancedExpectations[action.payload.key] = action.payload.value;
    },
    setActiveDimension: (state, action) => {
      state.activeDimension = action.payload;
    },
    addUploadedFile: (state, action) => {
      state.concreteImplementation.uploadedFiles.push(action.payload);
    },
    clearUploadedFiles: (state) => {
      state.concreteImplementation.uploadedFiles = [];
    }
  }
});

export const {
  updateAbstractSpecification,
  updateConcreteImplementation,
  updateBalancedExpectations,
  setActiveDimension,
  addUploadedFile,
  clearUploadedFiles
} = clmSlice.actions;

export default clmSlice.reducer;