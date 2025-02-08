import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';

// Async thunk for generating content
export const generateContent = createAsyncThunk(
  'llm/generateContent',
  async (prompt, { rejectWithValue }) => {
    try {
      // Placeholder for actual LLM API call
      const response = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error('Content generation failed');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial state for LLM interactions
const initialState = {
  conversations: [],
  currentConversation: {
    id: null,
    messages: [],
    model: 'default',
  },
  generation: {
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    result: null,
    error: null,
  },
  settings: {
    defaultModel: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1024,
    enableStreaming: true,
  }
};

export const llmSlice = createSlice({
  name: 'llm',
  initialState,
  reducers: {
    // Start a new conversation
    startConversation: (state, action) => {
      const newConversation = {
        id: Date.now().toString(),
        messages: [],
        model: action.payload?.model || state.settings.defaultModel
      };
      state.conversations.push(newConversation);
      state.currentConversation = newConversation;
    },

    // Add a message to current conversation
    addMessage: (state, action) => {
      if (!state.currentConversation.id) {
        // Create a conversation if none exists
        state.currentConversation = {
          id: Date.now().toString(),
          messages: [],
          model: state.settings.defaultModel
        };
      }
      state.currentConversation.messages.push(action.payload);
    },

    // Update LLM settings
    updateSettings: (state, action) => {
      state.settings = {
        ...state.settings,
        ...action.payload
      };
    },

    // Clear current conversation
    clearConversation: (state) => {
      state.currentConversation = initialState.currentConversation;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateContent.pending, (state) => {
        state.generation.status = 'loading';
        state.generation.error = null;
      })
      .addCase(generateContent.fulfilled, (state, action) => {
        state.generation.status = 'succeeded';
        state.generation.result = action.payload;
        
        // Automatically add generated content to conversation
        if (state.currentConversation.id) {
          state.currentConversation.messages.push({
            role: 'assistant',
            content: action.payload.text,
            timestamp: new Date().toISOString()
          });
        }
      })
      .addCase(generateContent.rejected, (state, action) => {
        state.generation.status = 'failed';
        state.generation.error = action.payload;
      });
  }
});

// Selectors
export const selectCurrentConversation = createSelector(
  [(state) => state.llm],
  (llm) => llm.currentConversation
);

export const selectLLMGenerationStatus = createSelector(
  [(state) => state.llm],
  (llm) => llm.generation
);

export const selectLLMSettings = createSelector(
  [(state) => state.llm],
  (llm) => llm.settings
);

export const { 
  startConversation, 
  addMessage, 
  updateSettings, 
  clearConversation 
} = llmSlice.actions;

export default llmSlice.reducer;
