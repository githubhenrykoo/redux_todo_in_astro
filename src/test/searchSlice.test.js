import reducer, { 
  updateSearchQuery, 
  setSearchResults, 
  addSearchToHistory, 
  clearSearchHistory,
  updateSearchFilters,
  clearSearchFilters,
  setSearchStatus,
  setSearchError,
  addSearchSuggestions
} from '../features/searchSlice';

describe('searchSlice', () => {
  const initialState = {
    query: '',
    results: [],
    filters: {},
    status: 'idle',
    error: null,
    history: [],
    suggestions: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0
    }
  };

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should update search query', () => {
    const query = 'test search';
    const action = updateSearchQuery(query);
    const nextState = reducer(initialState, action);
    
    expect(nextState.query).toBe(query);
  });

  it('should set search results', () => {
    const results = [{ id: 1, title: 'Result 1' }];
    const action = setSearchResults({ 
      results, 
      page: 2, 
      limit: 20, 
      total: 100 
    });
    const nextState = reducer(initialState, action);
    
    expect(nextState.results).toEqual(results);
    expect(nextState.pagination).toEqual({
      page: 2,
      limit: 20,
      total: 100
    });
    expect(nextState.status).toBe('succeeded');
  });

  it('should add search to history', () => {
    const query = 'first search';
    const action = addSearchToHistory(query);
    const nextState = reducer(initialState, action);
    
    expect(nextState.history).toContain(query);
    expect(nextState.history.length).toBe(1);
  });

  it('should limit history to 10 entries', () => {
    let state = initialState;
    for (let i = 0; i < 15; i++) {
      state = reducer(state, addSearchToHistory(`search ${i}`));
    }
    
    expect(state.history.length).toBe(10);
    expect(state.history[0]).toBe('search 14');
  });

  it('should clear search history', () => {
    const stateWithHistory = {
      ...initialState,
      history: ['search 1', 'search 2']
    };
    
    const action = clearSearchHistory();
    const nextState = reducer(stateWithHistory, action);
    
    expect(nextState.history).toHaveLength(0);
  });

  it('should update search filters', () => {
    const filters = { category: 'books', price: 'under-20' };
    const action = updateSearchFilters(filters);
    const nextState = reducer(initialState, action);
    
    expect(nextState.filters).toEqual(filters);
  });

  it('should clear search filters', () => {
    const stateWithFilters = {
      ...initialState,
      filters: { category: 'books' }
    };
    
    const action = clearSearchFilters();
    const nextState = reducer(stateWithFilters, action);
    
    expect(nextState.filters).toEqual({});
  });

  it('should set search status', () => {
    const action = setSearchStatus('loading');
    const nextState = reducer(initialState, action);
    
    expect(nextState.status).toBe('loading');
  });

  it('should set search error', () => {
    const errorMessage = 'Search failed';
    const action = setSearchError(errorMessage);
    const nextState = reducer(initialState, action);
    
    expect(nextState.status).toBe('failed');
    expect(nextState.error).toBe(errorMessage);
  });

  it('should add search suggestions', () => {
    const suggestions = ['suggestion 1', 'suggestion 2'];
    const action = addSearchSuggestions(suggestions);
    const nextState = reducer(initialState, action);
    
    expect(nextState.suggestions).toEqual(suggestions);
  });
});
