import { createSlice } from '@reduxjs/toolkit';
import { createHash } from 'crypto';

// Utility function to generate hash
function generateContentHash(content) {
  // Use SHA-256 for hash generation
  return createHash('sha256')
    .update(JSON.stringify(content))
    .digest('hex');
}

// Initial state
const initialState = {
  items: {
    'sample1': {
      hash: 'sample1',
      content: 'This is a sample content item 1',
      metadata: {},
      relationships: {
        parentHash: null,
        childHashes: [],
        relatedHashes: []
      }
    },
    'sample2': {
      hash: 'sample2',
      content: 'This is a sample content item 2',
      metadata: {},
      relationships: {
        parentHash: null,
        childHashes: [],
        relatedHashes: []
      }
    }
  },
  selected: null,
  search: {
    query: '',
    results: ['sample1', 'sample2'],
    filters: {},
    totalItems: 2
  }
};

// Content Slice
export const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    // Add new content
    addContent: (state, action) => {
      const hash = generateContentHash(action.payload.content);
      state.items[hash] = {
        hash,
        content: action.payload.content,
        metadata: {},
        relationships: {
          parentHash: action.payload.relationships?.parentHash,
          childHashes: action.payload.relationships?.childHashes || [],
          relatedHashes: action.payload.relationships?.relatedHashes || []
        }
      };
    },

    // Delete content by hash
    deleteContent: (state, action) => {
      delete state.items[action.payload];
      
      // Remove references to deleted content in other items
      Object.values(state.items).forEach(item => {
        item.relationships.childHashes = 
          item.relationships.childHashes.filter(h => h !== action.payload);
        item.relationships.relatedHashes = 
          item.relationships.relatedHashes.filter(h => h !== action.payload);
      });
    },

    // Select content
    selectContent: (state, action) => {
      state.selected = action.payload;
    },

    // Update search query
    setSearchQuery: (state, action) => {
      state.search.query = action.payload;
      
      // Perform simple search 
      state.search.results = Object.entries(state.items)
        .filter(([_, item]) => item.content.includes(action.payload))
        .map(([hash]) => hash);
      
      state.search.totalItems = state.search.results.length;
    },

    // Update content metadata
    updateContentMetadata: (state, action) => {
      if (state.items[action.payload.hash]) {
        state.items[action.payload.hash].metadata = {
          ...state.items[action.payload.hash].metadata,
          ...action.payload.metadata
        };
      }
    },

    // Update content relationships
    updateContentRelationships: (state, action) => {
      if (state.items[action.payload.hash]) {
        state.items[action.payload.hash].relationships = {
          ...state.items[action.payload.hash].relationships,
          ...action.payload.relationships
        };
      }
    }
  }
});

// Export actions
export const { 
  addContent, 
  deleteContent, 
  selectContent, 
  setSearchQuery, 
  updateContentMetadata,
  updateContentRelationships
} = contentSlice.actions;

export default contentSlice.reducer;
