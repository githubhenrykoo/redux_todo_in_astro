import { createSlice } from '@reduxjs/toolkit';
import { z } from 'zod';

// Search Query Validation Schema
const SearchQuerySchema = z.object({
  query: z.string().min(1, "Search query must not be empty"),
  filters: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
  sort: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']).default('asc')
  }).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10)
});

// Initial state for search slice
const initialState = {
  query: '',
  results: [],
  filters: {},
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  history: [],
  suggestions: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0
  }
};

// Search slice with advanced search management
const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    // Update search query
    updateSearchQuery: (state, action) => {
      state.query = action.payload;
    },

    // Set search results
    setSearchResults: (state, action) => {
      state.results = action.payload.results || [];
      state.pagination = {
        page: action.payload.page || 1,
        limit: action.payload.limit || 10,
        total: action.payload.total || state.results.length
      };
      state.status = 'succeeded';
    },

    // Add search to history
    addSearchToHistory: (state, action) => {
      const newQuery = action.payload;
      
      // Prevent duplicate entries
      if (!state.history.includes(newQuery)) {
        state.history.unshift(newQuery);
        
        // Limit history to last 10 searches
        if (state.history.length > 10) {
          state.history.pop();
        }
      }
    },

    // Clear search history
    clearSearchHistory: (state) => {
      state.history = [];
    },

    // Update search filters
    updateSearchFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload
      };
    },

    // Clear all search filters
    clearSearchFilters: (state) => {
      state.filters = {};
    },

    // Set search status
    setSearchStatus: (state, action) => {
      state.status = action.payload;
    },

    // Set search error
    setSearchError: (state, action) => {
      state.status = 'failed';
      state.error = action.payload;
    },

    // Add search suggestions
    addSearchSuggestions: (state, action) => {
      state.suggestions = action.payload;
    }
  }
});

export const { 
  updateSearchQuery, 
  setSearchResults,
  addSearchToHistory, 
  clearSearchHistory,
  updateSearchFilters,
  clearSearchFilters,
  setSearchStatus,
  setSearchError,
  addSearchSuggestions
} = searchSlice.actions;

export default searchSlice.reducer;
