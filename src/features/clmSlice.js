import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  abstractSpecification: {
    context: '',
    goal: '',
    successCriteria: ''
  }
};

const clmSlice = createSlice({
  name: 'clm',
  initialState,
  reducers: {
    updateAbstractSpecification: (state, action) => {
      const { field, value } = action.payload;
      state.abstractSpecification[field] = value;
    },
    updateConcreteImplementation: (state, action) => {
      const { field, value } = action.payload;
      state.concreteImplementation[field] = value;
    }
  }
});

export const { updateAbstractSpecification, updateConcreteImplementation } = clmSlice.actions;
export default clmSlice.reducer;