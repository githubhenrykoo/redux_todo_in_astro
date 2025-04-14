import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [{ 
    role: 'system', 
    content: `How can I help?

Command:
- "read the testing.txt", "show contents of testing.txt"
- "list files in downloads"
- "where am i"
- "make directory testing"
- "delete file testing.txt"` 
  }],
  input: '',
  isLoading: false,
  error: null,
  models: [],
  selectedModel: 'llama3'
};

const chatbotSlice = createSlice({
  name: 'chatbot',
  initialState,
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    setInput: (state, action) => {
      state.input = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setModels: (state, action) => {
      state.models = action.payload;
    },
    setSelectedModel: (state, action) => {
      state.selectedModel = action.payload;
    }
  }
});

export const {
  setMessages,
  setInput,
  setLoading,
  setError,
  setModels,
  setSelectedModel
} = chatbotSlice.actions;

export default chatbotSlice.reducer;