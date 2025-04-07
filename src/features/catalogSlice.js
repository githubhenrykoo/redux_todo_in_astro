import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for fetching catalog items (cards)
export const fetchCatalogItems = createAsyncThunk(
  'catalog/fetchItems',
  async (pageParams = { pageNumber: 1, pageSize: 20 }, { rejectWithValue }) => {
    try {
      // Get page of cards from API
      const url = `/api/card-collection?action=getPage&pageNumber=${pageParams.pageNumber}&pageSize=${pageParams.pageSize}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to fetch cards');
      }
      
      // Transform cards into catalog items
      return {
        items: data.cards.map(card => ({
          id: card.hash,
          name: card.hash.substring(0, 8), // Use first 8 chars of hash as name
          category: card.contentType?.mimeType || 'Unknown',
          description: 'Card content hash: ' + card.hash,
          timestamp: card.timestamp || new Date().toISOString(),
          hash: card.hash,
          contentType: card.contentType,
          metaData: card.metaData || {}
        })),
        totalItems: data.totalCards,
        totalPages: data.totalPages,
        currentPage: data.currentPage
      };
    } catch (error) {
      console.error('Error fetching catalog items:', error);
      return rejectWithValue('Failed to fetch catalog items. Please try again.');
    }
  }
);

// Async thunk for fetching a single card
export const fetchCardById = createAsyncThunk(
  'catalog/fetchById',
  async (hash, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/card-collection?action=get&hash=${hash}`);
      const data = await response.json();
      
      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to fetch card');
      }
      
      // Process the content based on its type
      let description = 'Binary content';
      const content = data.card.content;
      
      if (typeof content === 'string') {
        description = content.substring(0, 200) + (content.length > 200 ? '...' : '');
      } else if (content && typeof content === 'object') {
        if (content.type === 'string') {
          description = content.data.substring(0, 200) + (content.data.length > 200 ? '...' : '');
        } else if (content.type === 'base64') {
          description = `Binary content (${content.originalType || 'unknown type'})`;
        }
      }
      
      return {
        id: data.card.hash,
        name: data.card.hash.substring(0, 8),
        category: data.card.contentType?.mimeType || 'Unknown',
        description,
        hash: data.card.hash,
        content: data.card.content,
        timestamp: data.card.timestamp || new Date().toISOString(),
        contentType: data.card.contentType
      };
    } catch (error) {
      console.error('Error fetching card by ID:', error);
      return rejectWithValue('Failed to fetch card. Please try again.');
    }
  }
);

// Async thunk for searching cards by content
export const searchCatalogItems = createAsyncThunk(
  'catalog/searchItems',
  async ({ searchTerm, pageNumber = 1, pageSize = 20 }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `/api/card-collection?action=searchByContent&searchTerm=${encodeURIComponent(searchTerm)}&pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
      const data = await response.json();
      
      if (!data.success) {
        return rejectWithValue(data.error || 'Search failed');
      }
      
      return {
        items: data.cards.map(card => ({
          id: card.hash,
          name: card.hash.substring(0, 8),
          category: card.contentType?.mimeType || 'Unknown',
          description: 'Matching content: ' + (card.matchContext || ''),
          hash: card.hash,
          timestamp: card.timestamp || new Date().toISOString(),
          contentType: card.contentType
        })),
        totalItems: data.totalResults,
        totalPages: data.totalPages,
        currentPage: data.currentPage,
        searchTerm
      };
    } catch (error) {
      console.error('Error searching catalog items:', error);
      return rejectWithValue('Search failed. Please try again.');
    }
  }
);

// Async thunk for adding a card
export const addCatalogItem = createAsyncThunk(
  'catalog/addItem',
  async (item, { rejectWithValue }) => {
    try {
      // If item is a file, use FormData
      if (item.file) {
        const formData = new FormData();
        formData.append('action', 'add');
        formData.append('file', item.file);
        formData.append('metadata', JSON.stringify({
          fileName: item.name,
          mimeType: item.contentType || 'text/plain',
          size: item.file.size
        }));
        
        const response = await fetch('/api/card-collection', {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        
        if (!data.success) {
          return rejectWithValue(data.error || 'Failed to add item');
        }
        
        return {
          ...item,
          id: data.hash,
          hash: data.hash
        };
      } else {
        // Plain text content
        const response = await fetch('/api/card-collection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'add',
            card: {
              content: item.content || item.description,
              hash_algorithm: 'sha256'
            }
          })
        });
        
        const data = await response.json();
        
        if (!data.success) {
          return rejectWithValue(data.error || 'Failed to add item');
        }
        
        return {
          ...item,
          id: data.hash,
          hash: data.hash
        };
      }
    } catch (error) {
      console.error('Error adding catalog item:', error);
      return rejectWithValue('Failed to add item. Please try again.');
    }
  }
);

// Async thunk for removing a card
export const removeCatalogItem = createAsyncThunk(
  'catalog/removeItem',
  async (hash, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/card-collection', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete',
          hash
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to delete item');
      }
      
      return hash;
    } catch (error) {
      console.error('Error removing catalog item:', error);
      return rejectWithValue('Failed to delete item. Please try again.');
    }
  }
);

// Slice definition
const catalogSlice = createSlice({
  name: 'catalog',
  initialState: {
    items: [],
    selectedItem: null,
    loading: false,
    searchLoading: false,
    itemLoading: false,
    error: null,
    searchError: null,
    itemError: null,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      pageSize: 20
    },
    searchResults: {
      items: [],
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      searchTerm: ''
    }
  },
  reducers: {
    updateCatalogItem: (state, action) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      if (state.selectedItem && state.selectedItem.id === action.payload.id) {
        state.selectedItem = action.payload;
      }
    },
    clearSearchResults: (state) => {
      state.searchResults = {
        items: [],
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        searchTerm: ''
      };
    },
    setCurrentPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchCatalogItems cases
      .addCase(fetchCatalogItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCatalogItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalItems: action.payload.totalItems,
          pageSize: state.pagination.pageSize
        };
      })
      .addCase(fetchCatalogItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // fetchCardById cases
      .addCase(fetchCardById.pending, (state) => {
        state.itemLoading = true;
        state.itemError = null;
      })
      .addCase(fetchCardById.fulfilled, (state, action) => {
        state.itemLoading = false;
        state.selectedItem = action.payload;
        // Update the item in the list if it exists
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      })
      .addCase(fetchCardById.rejected, (state, action) => {
        state.itemLoading = false;
        state.itemError = action.payload;
      })
      
      // searchCatalogItems cases
      .addCase(searchCatalogItems.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchCatalogItems.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = {
          items: action.payload.items,
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalItems: action.payload.totalItems,
          searchTerm: action.payload.searchTerm
        };
      })
      .addCase(searchCatalogItems.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload;
      })
      
      // addCatalogItem cases
      .addCase(addCatalogItem.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.pagination.totalItems += 1;
        if (state.pagination.totalItems % state.pagination.pageSize === 1) {
          state.pagination.totalPages += 1;
        }
      })
      
      // removeCatalogItem cases
      .addCase(removeCatalogItem.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
        state.pagination.totalItems -= 1;
        if (state.pagination.totalItems % state.pagination.pageSize === 0 && state.pagination.totalPages > 0) {
          state.pagination.totalPages -= 1;
        }
        if (state.selectedItem && state.selectedItem.id === action.payload) {
          state.selectedItem = null;
        }
      });
  }
});

export const { updateCatalogItem, clearSearchResults, setCurrentPage } = catalogSlice.actions;
export default catalogSlice.reducer;
