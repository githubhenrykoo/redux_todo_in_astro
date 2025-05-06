import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  inputs: '',
  activities: '',
  outputs: '',
};

const concreteImplementationSlice = createSlice({
  name: 'concreteImplementation',
  initialState,
  reducers: {
    updateInputs: (state, action) => {
      state.inputs = action.payload;
    },
    updateActivities: (state, action) => {
      state.activities = action.payload;
    },
    updateOutputs: (state, action) => {
      state.outputs = action.payload;
    },
  },
});

export const { updateInputs, updateActivities, updateOutputs } = concreteImplementationSlice.actions;
export default concreteImplementationSlice.reducer;