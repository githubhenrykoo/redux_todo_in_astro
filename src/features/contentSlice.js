import { createSlice, createSelector } from '@reduxjs/toolkit';

// Simple ID generation function
const generateId = () => `content_${Math.random().toString(36).substr(2, 9)}`;

// Utility function to create content with relationships
const createContentItem = (content, relationships = {}) => ({
  id: generateId(),
  content,
  createdAt: new Date().toISOString(),
  metadata: {},
  relationships: {
    parentId: null,
    childIds: [],
    relatedIds: [],
    ...relationships
  }
});

const initialState = {
  items: {},
  selectedId: null,
  search: {
    query: '',
    results: [],
    filters: {}
  }
};

export const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    // Add new content with flexible relationships
    addContent: {
      reducer: (state, action) => {
        const { id, content, relationships } = action.payload;
        state.items[id] = createContentItem(content, relationships);
        
        // Update parent and related content relationships
        if (relationships?.parentId) {
          const parentContent = state.items[relationships.parentId];
          if (parentContent) {
            parentContent.relationships.childIds.push(id);
          }
        }
      },
      prepare: (content, relationships = {}) => ({
        payload: {
          id: generateId(),
          content,
          relationships
        }
      })
    },

    // Delete content and clean up relationships
    deleteContent: (state, action) => {
      const contentId = action.payload;
      const contentToDelete = state.items[contentId];

      if (contentToDelete) {
        // Remove child references
        contentToDelete.relationships.childIds.forEach(childId => {
          delete state.items[childId];
        });

        // Clean up parent relationships
        if (contentToDelete.relationships.parentId) {
          const parentContent = state.items[contentToDelete.relationships.parentId];
          if (parentContent) {
            parentContent.relationships.childIds = 
              parentContent.relationships.childIds.filter(id => id !== contentId);
          }
        }

        // Remove the content itself
        delete state.items[contentId];
      }

      // Reset selection if deleted content was selected
      if (state.selectedId === contentId) {
        state.selectedId = null;
      }
    },

    // Select a specific content item
    selectContent: (state, action) => {
      state.selectedId = action.payload;
    },

    // Update search functionality
    setSearchQuery: (state, action) => {
      const query = action.payload.toLowerCase();
      state.search.query = query;

      // Advanced search across content
      state.search.results = Object.values(state.items)
        .filter(item => 
          item.content.toLowerCase().includes(query) || 
          JSON.stringify(item.metadata).toLowerCase().includes(query)
        )
        .map(item => item.id);
    },

    // Update content metadata
    updateContentMetadata: (state, action) => {
      const { id, metadata } = action.payload;
      if (state.items[id]) {
        state.items[id].metadata = {
          ...state.items[id].metadata,
          ...metadata
        };
      }
    },

    // Update content relationships
    updateContentRelationships: (state, action) => {
      const { id, relationships } = action.payload;
      if (state.items[id]) {
        state.items[id].relationships = {
          ...state.items[id].relationships,
          ...relationships
        };
      }
    }
  }
});

// Memoized selectors for efficient state retrieval
export const selectContentState = createSelector(
  state => state.content,
  content => ({
    items: content.items,
    selectedItem: content.selectedId ? content.items[content.selectedId] : null,
    searchResults: content.search.results.map(id => content.items[id])
  })
);

export const { 
  addContent, 
  deleteContent, 
  selectContent, 
  setSearchQuery,
  updateContentMetadata,
  updateContentRelationships
} = contentSlice.actions;

export default contentSlice.reducer;
