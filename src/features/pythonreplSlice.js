import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  output: [],
  status: 'idle', // idle, running, waiting-for-input, error
  currentScript: null,
  history: []
};

const pythonreplSlice = createSlice({
  name: 'pythonrepl',
  initialState,
  reducers: {
    executeScript(state, action) {
      state.status = 'running';
      state.currentScript = {
        content: action.payload.content,
        hash: action.payload.hash,
        filename: action.payload.filename
      };
      // Clear previous output when executing a new script
      state.output = [];
    },
    executeLine(state, action) {
      state.status = 'running';
      // We don't modify output here because the actual execution
      // happens in the pythonrepl component
    },
    resetREPL(state) {
      state.status = 'idle';
      state.output = [];
      // We leave history intact
    },
    clearREPL(state) {
      state.output = [];
      // We don't change status or history
    },
    submitInput(state, action) {
      // Add the input to the output log for visibility
      state.output.push(`> ${action.payload.input}`);
      state.status = 'running';
      // The actual input submission happens in the pythonrepl component
    },
    addOutput(state, action) {
      // Add a line of output from the REPL
      state.output.push(action.payload.output);
      
      // Log for debugging
      console.log('Redux: Added output', action.payload.output);
      console.log('Redux: Output length', state.output.length);
    },
    setStatus(state, action) {
      state.status = action.payload.status;
      console.log('Redux: Status set to', action.payload.status);
    },
    addToHistory(state, action) {
      state.history.unshift({
        timestamp: new Date().toISOString(),
        script: state.currentScript,
        status: action.payload.status || 'executed',
        details: action.payload.details
      });
      
      // Keep history to a reasonable size
      if (state.history.length > 50) {
        state.history = state.history.slice(0, 50);
      }
    }
  },
});

export const { 
  executeScript, 
  executeLine, 
  resetREPL, 
  clearREPL, 
  submitInput, 
  addOutput, 
  setStatus, 
  addToHistory 
} = pythonreplSlice.actions;

export default pythonreplSlice.reducer;
