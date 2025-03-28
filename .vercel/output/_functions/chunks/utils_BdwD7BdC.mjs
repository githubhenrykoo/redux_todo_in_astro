import { createSlice, createSelector as createSelector$1, nanoid, configureStore } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';
import { z } from 'zod';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const __variableDynamicImportRuntimeHelper = (glob, path, segs) => {
  const v = glob[path];
  if (v) {
    return typeof v === "function" ? v() : Promise.resolve(v);
  }
  return new Promise((_, reject) => {
    (typeof queueMicrotask === "function" ? queueMicrotask : setTimeout)(
      reject.bind(
        null,
        new Error(
          "Unknown variable dynamic import: " + path + (path.split("/").length !== segs ? ". Note that variables only represent file names one level deep." : "")
        )
      )
    );
  });
};

/**
 * @typedef {'light'|'dark'} ThemeMode
 * @typedef {Object} ThemeColors
 * @property {string} primary
 * @property {string} background
 * @property {string} text
 * @property {string} border
 * @property {string} hover
 */

// Safe localStorage wrapper for cross-environment compatibility
const safeLocalStorage = {
  getItem: (key) => {
    // Check if localStorage is available in the current environment
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key, value) => {
    // Check if localStorage is available in the current environment
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  }
};

// Initialize with system preference or fallback
const getInitialTheme = () => {
  // First, check for saved theme in localStorage
  const saved = safeLocalStorage.getItem('theme');
  if (saved) return saved;
  
  // Check if window and matchMedia exist before calling
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  // Fallback to light theme if no window or matchMedia
  return 'light';
};

/** @type {{ mode: ThemeMode }} */
const initialState$8 = {
  mode: getInitialTheme()
};

const themeSlice = createSlice({
  name: 'theme',
  initialState: initialState$8,
  reducers: {
    /**
     * Toggles between light/dark themes and updates CSS variables
     */
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(state.mode);
        safeLocalStorage.setItem('theme', state.mode);
      }
    }
  }
});

// Memoized selectors
const selectThemeMode = createSelector(
  [(state) => state.theme],
  (theme) => theme.mode
);

const { toggleTheme } = themeSlice.actions;
const themeReducer = themeSlice.reducer;

// Initial user state matching Authentik user info
const initialState$7 = {
  isAuthenticated: false,
  profile: {
    sub: null,
    email: null,
    email_verified: false,
    name: null,
    given_name: null,
    family_name: null,
    nickname: null,
    preferred_username: null,
    groups: [],
    picture: null,
  },
  session: {
    access_token: null,
    id_token: null,
    token_type: null,
    expires_at: null,
    lastLogin: null,
  },
  preferences: {
    theme: 'system', // system, light, dark
    language: 'en',
  }
};

const userSlice = createSlice({
  name: 'user',
  initialState: initialState$7,
  reducers: {
    // Login action using full Authentik user info
    login: (state, action) => {
      const { 
        profile,  // Authentik user profile
        tokens    // Authentication tokens
      } = action.payload;

      console.log('Login Action Payload:', { profile, tokens });

      // Explicitly set authentication state to true
      state.isAuthenticated = true;

      // Spread Authentik profile information
      state.profile = { 
        ...initialState$7.profile,
        ...profile 
      };

      // Update session tokens and login time
      state.session = {
        access_token: tokens?.access_token || null,
        id_token: tokens?.id_token || null,
        token_type: tokens?.token_type || null,
        expires_at: tokens?.expires_at || 
          (tokens?.expires_in 
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() 
            : null),
        lastLogin: new Date().toISOString()
      };

      console.log('Updated User State:', state);
    },

    // Logout action
    logout: (state) => {
      state.isAuthenticated = false;
      state.profile = initialState$7.profile;
      state.session = initialState$7.session;
      state.preferences = initialState$7.preferences;
    },

    // Update user profile
    updateProfile: (state, action) => {
      state.profile = { 
        ...state.profile, 
        ...action.payload 
      };
    },

    // Update user preferences
    updatePreferences: (state, action) => {
      state.preferences = { 
        ...state.preferences, 
        ...action.payload 
      };
    },

    // Increment login attempts
    incrementLoginAttempts: (state) => {
      state.session.loginAttempts += 1;
    }
  }
});

// Selectors
createSelector$1(
  [(state) => state.user],
  (user) => user.isAuthenticated
);

createSelector$1(
  [(state) => state.user],
  (user) => user.profile
);

createSelector$1(
  [(state) => state.user],
  (user) => user.profile.email
);

createSelector$1(
  [(state) => state.user],
  (user) => user.profile.email_verified
);

createSelector$1(
  [(state) => state.user],
  (user) => user.profile.groups
);

createSelector$1(
  [(state) => state.user],
  (user) => user.session
);

createSelector$1(
  [(state) => state.user],
  (user) => user.preferences
);

const { 
  login, 
  logout, 
  updateProfile, 
  updatePreferences,
  incrementLoginAttempts 
} = userSlice.actions;

const userReducer = userSlice.reducer;

// Simple hash generation function
const generateHash = () => `content_${Math.random().toString(36).substr(2, 9)}`;

// Utility function to create content with relationships
const createContentCard = (content, relationships = {}) => ({
  hash: generateHash(),
  content,
  createdAt: new Date().toISOString(),
  metadata: {},
  relationships: {
    parentHash: null,
    childHashes: [],
    relatedHashes: [],
    ...relationships
  }
});

const initialState$6 = {
  cards: {},
  selectedHash: null,
  search: {
    query: '',
    results: [],
    filters: {}
  }
};

const contentSlice = createSlice({
  name: 'content',
  initialState: initialState$6,
  reducers: {
    // Add new content with flexible relationships
    addContent: {
      reducer: (state, action) => {
        const { hash, content, relationships } = action.payload;
        state.cards[hash] = createContentCard(content, relationships);
        
        // Update parent and related content relationships
        if (relationships?.parentHash) {
          const parentContent = state.cards[relationships.parentHash];
          if (parentContent) {
            parentContent.relationships.childHashes.push(hash);
          }
        }
      },
      prepare: (content, relationships = {}) => ({
        payload: {
          hash: generateHash(),
          content,
          relationships
        }
      })
    },

    // Delete content and clean up relationships
    deleteContent: (state, action) => {
      const contentHash = action.payload;
      const contentToDelete = state.cards[contentHash];

      if (contentToDelete) {
        // Remove child references
        contentToDelete.relationships.childHashes.forEach(childHash => {
          delete state.cards[childHash];
        });

        // Clean up parent relationships
        if (contentToDelete.relationships.parentHash) {
          const parentContent = state.cards[contentToDelete.relationships.parentHash];
          if (parentContent) {
            parentContent.relationships.childHashes = 
              parentContent.relationships.childHashes.filter(hash => hash !== contentHash);
          }
        }

        // Remove the content itself
        delete state.cards[contentHash];
      }

      // Reset selection if deleted content was selected
      if (state.selectedHash === contentHash) {
        state.selectedHash = null;
      }
    },

    // Select a specific content item
    selectContent: (state, action) => {
      state.selectedHash = action.payload;
    },

    // Update search functionality
    setSearchQuery: (state, action) => {
      const query = action.payload.toLowerCase();
      state.search.query = query;

      // Advanced search across content
      state.search.results = Object.values(state.cards)
        .filter(card => 
          card.content.toLowerCase().includes(query) || 
          JSON.stringify(card.metadata).toLowerCase().includes(query)
        )
        .map(card => card.hash);
    },

    // Update content metadata
    updateContentMetadata: (state, action) => {
      const { hash, metadata } = action.payload;
      if (state.cards[hash]) {
        state.cards[hash].metadata = {
          ...state.cards[hash].metadata,
          ...metadata
        };
      }
    },

    // Update content relationships
    updateContentRelationships: (state, action) => {
      const { hash, relationships } = action.payload;
      if (state.cards[hash]) {
        state.cards[hash].relationships = {
          ...state.cards[hash].relationships,
          ...relationships
        };
      }
    },

    // Update card content
    updateContent: (state, action) => {
      const { hash, content } = action.payload;
      if (state.cards[hash]) {
        state.cards[hash].content = content;
        state.cards[hash].updatedAt = new Date().toISOString();
      }
    },
    importCardFromDatabase: (state, action) => {
      const { hash, content, relationships = {}, metadata = {} } = action.payload;
      state.cards[hash] = {
        hash,
        content,
        createdAt: new Date().toISOString(),
        metadata,
        relationships: {
          parentHash: relationships?.parentHash || null,
          childHashes: relationships?.childHashes || [],
          relatedHashes: relationships?.relatedHashes || []
        }
      };
    }
  }
});

// Memoized selectors for efficient state retrieval
createSelector$1(
  state => state.content,
  content => ({
    cards: content.cards,
    selectedCard: content.selectedHash ? content.cards[content.selectedHash] : null,
    searchResults: content.search.results.map(hash => content.cards[hash])
  })
);

const { 
  addContent, 
  deleteContent, 
  selectContent, 
  setSearchQuery: setSearchQuery$1,
  updateContentMetadata,
  updateContentRelationships,
  updateContent,
  importCardFromDatabase
} = contentSlice.actions;

const contentReducer = contentSlice.reducer;

const generate_layout = {"left":{"type":"SearchAndContent","size":30,"minSize":20,"visible":true},"middle":{"type":"ContentDetailPanel","size":40,"minSize":20,"visible":true},"right":{"type":"DatabaseRetrievePanel","size":30,"minSize":20,"visible":true}};
const todo_layout = {"left":{"type":"SearchAndTodos","size":30,"minSize":20,"visible":true},"middle":{"type":"chatbot","size":40,"minSize":20,"visible":true},"right":{"type":"xterm","size":30,"minSize":20,"visible":true}};
const layoutConfig = {
  generate_layout,
  todo_layout,
};

const initialState$5 = {
  panels: layoutConfig["todo_layout"],
};

// Simplified function to trigger save
const triggerSave = () => {
  // Check if we're in the browser
  if (typeof window !== 'undefined' && window.forceSaveReduxState) {
    console.log('Directly calling forceSaveReduxState after layout change');
    window.forceSaveReduxState(true);
  } else {
    console.log('forceSaveReduxState not available');
  }
};

const panellayoutSlice = createSlice({
  name: "panellayout",
  initialState: initialState$5,
  reducers: {
    changeLayout: (state, action) => {
      const layoutName = action.payload;
      console.log('Changing layout:', layoutName);
      console.log('Current state:', state);
      console.log('Available layouts:', Object.keys(layoutConfig));
      
      const newLayout = layoutConfig[layoutName];
      if (newLayout) {
        console.log('New layout:', newLayout);
        state.panels = newLayout;
        // Schedule the trigger function to run after this reducer completes
        setTimeout(() => triggerSave(), 200);
      } else {
        console.error(`Layout ${layoutName} not found`);
      }
    }
  },
});

const { changeLayout: changeLayout$1 } = panellayoutSlice.actions;
const panellayoutReducer = panellayoutSlice.reducer;

const initialState$4 = {
  currentPanel: null,
  panelHistory: [],
  focusedPanels: {
    primary: null,
    secondary: null,
    tertiary: null
  },
  panelFocusPriority: ['primary', 'secondary', 'tertiary']
};

const activePanelSlice = createSlice({
  name: 'activePanel',
  initialState: initialState$4,
  reducers: {
    // Set the currently active panel
    setActivePanel: (state, action) => {
      const { panelId, priority = 'primary' } = action.payload;
      
      // Update panel history
      if (state.currentPanel && state.currentPanel !== panelId) {
        state.panelHistory.push(state.currentPanel);
        
        // Limit history to last 10 panels
        if (state.panelHistory.length > 10) {
          state.panelHistory.shift();
        }
      }

      // Update current panel and focused panels
      state.currentPanel = panelId;
      state.focusedPanels[priority] = panelId;
    },

    // Go back to previous panel
    goToPreviousPanel: (state) => {
      if (state.panelHistory.length > 0) {
        const previousPanel = state.panelHistory.pop();
        state.currentPanel = previousPanel;
      }
    },

    // Clear panel focus
    clearPanelFocus: (state, action) => {
      const { priority = 'primary' } = action.payload;
      state.focusedPanels[priority] = null;
    },

    // Reset panel tracking
    resetPanelTracking: () => initialState$4
  }
});

// Selectors
createSelector$1(
  [(state) => state.activePanel],
  (activePanel) => activePanel.currentPanel
);

createSelector$1(
  [(state) => state.activePanel],
  (activePanel) => activePanel.focusedPanels
);

createSelector$1(
  [(state) => state.activePanel],
  (activePanel) => activePanel.panelHistory
);

const { 
  setActivePanel, 
  goToPreviousPanel, 
  clearPanelFocus, 
  resetPanelTracking 
} = activePanelSlice.actions;

const activePanelReducer = activePanelSlice.reducer;

// Search Query Validation Schema
z.object({
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
const initialState$3 = {
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
  initialState: initialState$3,
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

const { 
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

const searchReducer = searchSlice.reducer;

// Action History Entry Schema
z.object({
  id: z.string(),
  type: z.string(),
  timestamp: z.number(),
  payload: z.any().optional(),
  meta: z.object({
    source: z.string().optional(),
    traceId: z.string().optional()
  }).optional()
});

// System Error Schema
const SystemErrorSchema = z.object({
  id: z.string(),
  message: z.string(),
  severity: z.enum(['info', 'warning', 'error', 'critical']),
  timestamp: z.number(),
  context: z.record(z.string(), z.any()).optional()
});

// Operation Status Schema
z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['idle', 'pending', 'success', 'failed']),
  progress: z.number().min(0).max(100).optional(),
  startTime: z.number(),
  endTime: z.number().optional(),
  error: SystemErrorSchema.optional()
});

// Initial State
const initialState$2 = {
  actionHistory: [],
  errors: [],
  operations: {},
  systemStatus: {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastChecked: Date.now()
  }
};

// System Slice
const systemSlice = createSlice({
  name: 'system',
  initialState: initialState$2,
  reducers: {
    // Record Action History
    recordAction: {
      reducer: (state, action) => {
        // Limit action history to last 100 entries
        if (state.actionHistory.length >= 100) {
          state.actionHistory.shift();
        }
        state.actionHistory.push(action.payload);
      },
      prepare: (type, payload, meta = {}) => ({
        payload: {
          id: nanoid(),
          type,
          payload,
          timestamp: Date.now(),
          meta: {
            source: meta.source || 'user',
            traceId: meta.traceId || nanoid()
          }
        }
      })
    },

    // Log System Error
    logError: {
      reducer: (state, action) => {
        // Limit error history to last 50 entries
        if (state.errors.length >= 50) {
          state.errors.shift();
        }
        state.errors.push(action.payload);
      },
      prepare: (message, severity = 'error', context = {}) => ({
        payload: {
          id: nanoid(),
          message,
          severity,
          timestamp: Date.now(),
          context
        }
      })
    },

    // Manage Operation Status
    startOperation: {
      reducer: (state, action) => {
        const { id, name } = action.payload;
        state.operations[id] = {
          id,
          name,
          status: 'pending',
          startTime: Date.now(),
          progress: 0
        };
      },
      prepare: (name) => ({
        payload: {
          id: nanoid(),
          name
        }
      })
    },

    // Update Operation Progress
    updateOperationProgress: (state, action) => {
      const { id, progress, status } = action.payload;
      if (state.operations[id]) {
        state.operations[id].progress = progress;
        if (status) state.operations[id].status = status;
      }
    },

    // Complete Operation
    completeOperation: (state, action) => {
      const { id, status = 'success', error } = action.payload;
      if (state.operations[id]) {
        state.operations[id].status = status;
        state.operations[id].endTime = Date.now();
        if (error) {
          state.operations[id].error = error;
          // Also log the error
          systemSlice.caseReducers.logError(state, {
            payload: {
              message: error.message,
              severity: 'error',
              context: { operationId: id }
            }
          });
        }
      }
    },

    // Update System Online Status
    updateSystemStatus: (state, action) => {
      state.systemStatus = {
        ...state.systemStatus,
        ...action.payload,
        lastChecked: Date.now()
      };
    },

    // Clear Action History
    clearActionHistory: (state) => {
      state.actionHistory = [];
    },

    // Clear Error History
    clearErrorHistory: (state) => {
      state.errors = [];
    }
  }
});

const {
  recordAction,
  logError,
  startOperation,
  updateOperationProgress,
  completeOperation,
  updateSystemStatus,
  clearActionHistory,
  clearErrorHistory
} = systemSlice.actions;

const systemReducer = systemSlice.reducer;

const initialState$1 = {
    todos: [],
    searchQuery: '',
    selectedContent: null,
    actionHistory: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null
};

const todoSlice = createSlice({
    name: 'todo',
    initialState: initialState$1,
    reducers: {
        addTodo: (state, action) => {
            const newTodo = {
                id: Date.now(),
                content: action.payload,
            };
            state.todos.push(newTodo);
            state.selectedContent = action.payload;
            state.actionHistory.push({
                id: Date.now(),
                type: 'ADD',
                content: action.payload,
                timestamp: new Date().toISOString()
            });
        },
        removeTodo: (state, action) => {
            const todoToRemove = state.todos.find(todo => todo.id === action.payload);
            if (todoToRemove) {
                state.actionHistory.push({
                    id: Date.now(),
                    type: 'REMOVE',
                    content: todoToRemove.content,
                    timestamp: new Date().toISOString()
                });
            }
            state.todos = state.todos.filter(todo => todo.id !== action.payload);
        },
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
        },
        selectTodo: (state, action) => {
            const todo = state.todos.find(t => t.id === action.payload);
            state.selectedContent = todo ? todo.content : null;
            if (todo) {
                state.actionHistory.push({
                    id: Date.now(),
                    type: 'SELECT',
                    content: todo.content,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
});

const { addTodo, removeTodo, setSearchQuery, selectTodo } = todoSlice.actions;

// Base selectors with null checks and memoization
const selectTodoState = state => state?.todo;

const selectTodos = createSelector$1(
    [selectTodoState],
    todoState => todoState?.todos ?? []
);

const selectSearchQuery = createSelector$1(
    [selectTodoState],
    todoState => todoState?.searchQuery ?? ''
);

createSelector$1(
    [selectTodoState],
    todoState => todoState?.selectedContent
);

const selectActionHistory = createSelector$1(
    [selectTodoState],
    todoState => todoState?.actionHistory ?? []
);

createSelector$1(
    [selectTodoState],
    todoState => todoState?.status ?? 'idle'
);

createSelector$1(
    [selectTodoState],
    todoState => todoState?.error
);

// Memoized selector for filtered todos
const selectFilteredTodos = createSelector$1(
    [selectTodos, selectSearchQuery],
    (todos, searchQuery) => {
        if (!searchQuery?.trim()) {
            return todos;
        }
        
        return todos.filter((todo) =>
            todo.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
);

const todoReducer = todoSlice.reducer;

const initialState = {
  currentLayout: 'default'
};

const resizeableSlice = createSlice({
  name: "resizeable",
  initialState,
  reducers: {
    changeLayout: (state, action) => {
      const layoutName = action.payload;
      
      // Always set to the provided layout or default
      state.currentLayout = layoutName || 'default';
    }
  },
});

const { changeLayout } = resizeableSlice.actions;
const resizeableReducer = resizeableSlice.reducer;

const store = configureStore({
  reducer: {
    // Core State
    theme: themeReducer,
    user: userReducer,
    
    // Feature States
    content: contentReducer,
    search: searchReducer,
    system: systemReducer,
    todo: todoReducer,
    
    // UI States
    panellayout: panellayoutReducer,
    activePanel: activePanelReducer,
    resizeable: resizeableReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false
    }),
  devTools: {
    name: 'Progressive Knowledge Container',
    trace: true,
    traceLimit: 25
  }
});

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export { __variableDynamicImportRuntimeHelper as _, addContent as a, store as b, logout as c, deleteContent as d, selectActionHistory as e, selectThemeMode as f, cn as g, setSearchQuery$1 as h, importCardFromDatabase as i, setSearchQuery as j, selectFilteredTodos as k, login as l, selectTodo as m, changeLayout as n, removeTodo as r, selectContent as s, toggleTheme as t };
