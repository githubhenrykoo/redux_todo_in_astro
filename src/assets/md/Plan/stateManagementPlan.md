# State Management Plan

## Overview

This state management system implements a data-driven, functionally pure approach based on the Flux architectural pattern and Single Source of Truth (SSoT) principle. The system uses Redux as its core state container, with a focus on version-controlled data structures and predictable state mutations.

## 1. Core State Architecture

### 1.1 Root State Structure
```typescript
interface RootState {
  core: {
    theme: ThemeState;
    layout: LayoutState;
    user: UserState;
  };
  features: {
    content: ContentState;
    llm: LLMState;
    history: ActionHistoryState;
  };
  ui: {
    panels: PanelState[];
    activePanel: string;
    savedLayouts: Record<string, PanelState[]>;
  };
  pwa: PWAState;
  network: {
    trpc: TRPCState;
    libp2p: LibP2PState; // Optional additional protocols
  };
  storage: StorageState; // New storage section
}
```

### 1.2 Domain-Specific States

#### Theme Management

The theme system is implemented in `src/features/themeSlice.js` with the following key aspects:

1. **Core State**:
```typescript
interface ThemeState {
  mode: 'light' | 'dark';  // Current theme mode
}
```

2. **Key Features**:
- Automatic system preference detection
- Local storage persistence
- SSR compatibility with default light theme
- CSS class-based theme switching

3. **Implementation Notes**:
- Uses Redux Toolkit's `createSlice` for reducer and action creation
- Memoized theme selector using `createSelector`
- Direct DOM manipulation for theme class toggling
- Theme persistence in localStorage

4. **Usage Example**:
```typescript
// Access theme
const mode = useSelector(selectThemeMode);

// Toggle theme
dispatch(toggleTheme());
```

For the complete implementation, refer to `src/features/themeSlice.js`.

#### Action History
```typescript
interface ActionHistoryState {
  actions: Array<{
    hash: string;
    type: string;
    content: string;
    metadata: {
      source: string;
      category: string;
    };
    timestamp: string;
  }>;
  undoStack: string[];   // Action hashes for undo
  redoStack: string[];   // Action hashes for redo
}

type ActionHistoryActions = 
  | { type: 'RECORD_ACTION'; payload: {
      type: string;
      content: string;
      metadata: {
        source: string;
        category: string;
      }
    }}                                           // Log a new action
```

#### Content Management
```typescript
interface ContentState {
  items: Record<string, {
    hash: string;
    content: string;
    metadata: Record<string, unknown>;
    relationships: {
      parentHash?: string;
      childHashes: string[];
      relatedHashes: string[];
    };
  }>;
  selected: string | null;
  search: {
    query: string;
    results: string[];
    filters: Record<string, unknown>;
    totalItems: number;
  };
}

type ContentActions = 
  | { type: 'ADD_CONTENT'; payload: {
      content: string;
      relationships?: {
        parentHash?: string;
        childHashes?: string[];
        relatedHashes?: string[];
      }
    }}                                           // Create new content
  | { type: 'DELETE_CONTENT'; payload: string }  // Remove content by hash
  | { type: 'SELECT_CONTENT'; payload: string }  // Set selected content
  | { type: 'SET_SEARCH_QUERY'; payload: string }// Update search query
  | { type: 'content/updateMetadata'; payload: { hash: string; metadata: Record<string, unknown> } }
  | { type: 'content/updateRelationships'; payload: { hash: string; relationships: Partial<ContentState['items'][string]['relationships']> } };
```

#### LLM Integration
```typescript
interface LLMState {
  conversation: {
    messages: Array<{
      role: 'user' | 'system' | 'assistant';
      content: string;
      timestamp: number;
    }>;
    context: {
      activeTopics: string[];
      systemPrompt?: string;
    };
  };
  generation: {
    status: 'idle' | 'generating' | 'error';
    currentTask?: string;
    error?: string;
  };
  modelConfig: {
    selectedModel: string;
    availableModels: string[];
    defaultParameters: {
      temperature: number;
      maxTokens: number;
      topP: number;
    };
  };
}

type LLMActions = 
  | { 
      type: 'llm/sendMessage'; 
      payload: { 
        content: string; 
        role: 'user' | 'system';
      }
    }
  | { 
      type: 'llm/receiveMessage'; 
      payload: { 
        content: string; 
        role: 'assistant';
      }
    }
  | { 
      type: 'llm/startGeneration'; 
      payload: { 
        task: string; 
        model?: string;
      }
    }
  | { 
      type: 'llm/generationComplete'; 
      payload: { 
        result: any; 
        tokens?: number;
      }
    }
  | { 
      type: 'llm/setModel'; 
      payload: string 
    }
  | { 
      type: 'llm/updateModelParameters'; 
      payload: Partial<LLMState['modelConfig']['defaultParameters']> 
    }
  | { 
      type: 'llm/resetConversation' 
    }
  | { 
      type: 'llm/handleError'; 
      payload: string 
    };
```

#### User Management
```typescript
interface UserState {
  profile: {
    id: string | null;
    username: string | null;
    email: string | null;
    preferences: Record<string, unknown>;
  };
  auth: {
    status: 'authenticated' | 'unauthenticated' | 'loading';
    token: string | null;
    error: string | null;
  };
}

type UserActions = 
  | { type: 'LOGIN'; payload: {
      username: string;
      token: string;
    }}                                           // User login
  | { type: 'LOGOUT' }                           // User logout
  | { type: 'UPDATE_PROFILE'; payload: {
      username?: string;
      email?: string;
      preferences?: Record<string, unknown>
    }}                                           // Update user profile
  | { type: 'SET_AUTH_STATUS'; payload: 'authenticated' | 'unauthenticated' }  // Auth status
  | { type: 'user/refreshToken' }
  | { type: 'user/setError'; payload: string };
```

## 2. State Management Principles

### 2.1 Functional Purity
- All state mutations through pure reducer functions
- Immutable state updates using immer or spread operators
- Side effects isolated in middleware
- State transitions are atomic and predictable

### 2.2 Type Safety
```typescript
// Type-safe action creators
interface ActionCreator<T extends string, P> {
  type: T;
  payload: P;
  meta?: Record<string, unknown>;
}

// Type-safe reducer
type Reducer<S, A> = (state: S, action: A) => S;

// Type-safe selector
type Selector<S, R> = (state: S) => R;
```

### 2.3 External Storage Integration
```typescript
interface StorageAdapter<T> {
  save: (key: string, value: T) => Promise<void>;
  load: (key: string) => Promise<T | null>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

// Implementation for different storage types
const storageAdapters = {
  indexedDB: createIndexedDBAdapter(),
  sqlite: createSQLiteAdapter(),
  localStorage: createLocalStorageAdapter(),
};
```

## 3. State Management Patterns

### 3.1 REPL Pattern Implementation
```typescript
interface REPLCycle<S, A> {
  read: () => A;                     // Action creators
  eval: (state: S, action: A) => S;  // Reducers
  print: (state: S) => void;         // UI updates
  loop: () => void;                  // Next cycle
}
```

### 3.2 Event Sourcing
```typescript
interface Event<T> {
  id: string;
  type: string;
  payload: T;
  timestamp: string;
  metadata: Record<string, unknown>;
}

interface EventStore {
  append: (event: Event<unknown>) => void;
  replay: (fromId?: string) => Iterator<Event<unknown>>;
  snapshot: () => Promise<void>;
}
```

## 4. Middleware Configuration

### 4.1 Redux Thunk
- Handles async operations
- Manages API calls
- Coordinates complex state transitions

### 4.2 Redux Saga
- Manages side effects
- Handles complex workflows
- Implements event-driven patterns

### 4.3 Custom Middleware
```typescript
interface CustomMiddleware {
  logger: Middleware;
  persistence: Middleware;
  eventSourcing: Middleware;
  errorHandling: Middleware;
}
```

## 5. Performance Optimizations

### 5.1 State Normalization
- Normalized data structures
- Reference-based relationships
- Efficient updates and queries

### 5.2 Memoization
```typescript
const memoizedSelector = createSelector(
  [selectItems, selectFilter],
  (items, filter) => items.filter(filter)
);
```

### 5.3 Batch Updates
```typescript
interface BatchAction {
  type: 'BATCH_ACTIONS';
  actions: Action[];
  meta: {
    batch: true;
  };
}
```

## 6. Testing Strategy

### 6.1 Unit Tests
- Pure reducer tests
- Action creator tests
- Selector tests

### 6.2 Integration Tests
- Middleware integration
- State flow tests
- Side effect tests

### 6.3 E2E State Tests
- Full state cycle tests
- Persistence tests
- Event sourcing tests

## 7. Core Redux Slices

### 7.1 Theme Slice (themeSlice)
The theme system is implemented in `src/features/themeSlice.js` with the following key aspects:

1. **Core State**:
```typescript
interface ThemeState {
  mode: 'light' | 'dark';  // Current theme mode
}
```

2. **Key Features**:
- Automatic system preference detection
- Local storage persistence
- SSR compatibility with default light theme
- CSS class-based theme switching

3. **Implementation Notes**:
- Uses Redux Toolkit's `createSlice` for reducer and action creation
- Memoized theme selector using `createSelector`
- Direct DOM manipulation for theme class toggling
- Theme persistence in localStorage

4. **Usage Example**:
```typescript
// Access theme
const mode = useSelector(selectThemeMode);

// Toggle theme
dispatch(toggleTheme());
```

For the complete implementation, refer to `src/features/themeSlice.js`.

### 7.2 Action History Slice (historySlice)
```typescript
interface ActionHistoryState {
  actions: Array<{
    hash: string;
    type: string;
    content: string;
    metadata: {
      source: string;
      category: string;
    };
    timestamp: string;
  }>;
  undoStack: string[];   // Action hashes for undo
  redoStack: string[];   // Action hashes for redo
}

type ActionHistoryActions = 
  | { type: 'RECORD_ACTION'; payload: {
      type: string;
      content: string;
      metadata: {
        source: string;
        category: string;
      }
    }}                                           // Log a new action
  | { type: 'history/undo' }
  | { type: 'history/redo' };
```

### 7.3 Content Management Slice (contentSlice)
```typescript
interface ContentState {
  items: Record<string, {
    hash: string;
    content: string;
    metadata: Record<string, unknown>;
    relationships: {
      parentHash?: string;
      childHashes: string[];
      relatedHashes: string[];
    };
  }>;
  selected: string | null;
  search: {
    query: string;
    results: string[];
    filters: Record<string, unknown>;
    totalItems: number;
  };
}

type ContentActions = 
  | { type: 'ADD_CONTENT'; payload: {
      content: string;
      relationships?: {
        parentHash?: string;
        childHashes?: string[];
        relatedHashes?: string[];
      }
    }}                                           // Create new content
  | { type: 'DELETE_CONTENT'; payload: string }  // Remove content by hash
  | { type: 'SELECT_CONTENT'; payload: string }  // Set selected content
  | { type: 'SET_SEARCH_QUERY'; payload: string }// Update search query
  | { type: 'content/updateMetadata'; payload: { hash: string; metadata: Record<string, unknown> } }
  | { type: 'content/updateRelationships'; payload: { hash: string; relationships: Partial<ContentState['items'][string]['relationships']> } };
```

### 7.4 LLM Integration Slice (llmSlice)
```typescript
interface LLMState {
  conversation: {
    messages: Array<{
      role: 'user' | 'system' | 'assistant';
      content: string;
      timestamp: number;
    }>;
    context: {
      activeTopics: string[];
      systemPrompt?: string;
    };
  };
  generation: {
    status: 'idle' | 'generating' | 'error';
    currentTask?: string;
    error?: string;
  };
  modelConfig: {
    selectedModel: string;
    availableModels: string[];
    defaultParameters: {
      temperature: number;
      maxTokens: number;
      topP: number;
    };
  };
}

type LLMActions = 
  | { 
      type: 'llm/sendMessage'; 
      payload: { 
        content: string; 
        role: 'user' | 'system';
      }
    }
  | { 
      type: 'llm/receiveMessage'; 
      payload: { 
        content: string; 
        role: 'assistant';
      }
    }
  | { 
      type: 'llm/startGeneration'; 
      payload: { 
        task: string; 
        model?: string;
      }
    }
  | { 
      type: 'llm/generationComplete'; 
      payload: { 
        result: any; 
        tokens?: number;
      }
    }
  | { 
      type: 'llm/setModel'; 
      payload: string 
    }
  | { 
      type: 'llm/updateModelParameters'; 
      payload: Partial<LLMState['modelConfig']['defaultParameters']> 
    }
  | { 
      type: 'llm/resetConversation' 
    }
  | { 
      type: 'llm/handleError'; 
      payload: string 
    };
```

### 7.5 User Management Slice (userSlice)
```typescript
interface UserState {
  profile: {
    id: string | null;
    username: string | null;
    email: string | null;
    preferences: Record<string, unknown>;
  };
  auth: {
    status: 'authenticated' | 'unauthenticated' | 'loading';
    token: string | null;
    error: string | null;
  };
}

type UserActions = 
  | { type: 'LOGIN'; payload: {
      username: string;
      token: string;
    }}                                           // User login
  | { type: 'LOGOUT' }                           // User logout
  | { type: 'UPDATE_PROFILE'; payload: {
      username?: string;
      email?: string;
      preferences?: Record<string, unknown>
    }}                                           // Update user profile
  | { type: 'SET_AUTH_STATUS'; payload: 'authenticated' | 'unauthenticated' }  // Auth status
  | { type: 'user/refreshToken' }
  | { type: 'user/setError'; payload: string };
```

### 7.6 Storage Slice Integration
```typescript
// Root State with All Slices
interface RootState {
  theme: ThemeState;
  history: ActionHistoryState;
  content: ContentState;
  llm: LLMState;
  user: UserState;
  storage: StorageState;
  network: {
    trpc: TRPCState;
    libp2p: LibP2PState; // Optional additional protocols
  };
}

// Combined Reducer
const rootReducer = combineReducers({
  theme: themeReducer,
  history: historyReducer,
  content: contentReducer,
  llm: llmReducer,
  user: userReducer,
  storage: storageReducer,
  network: networkReducer,
});

// Store Configuration
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(historyMiddleware)
      .concat(llmMiddleware)
      .concat(storageMiddleware)
      .concat(networkMiddleware),
});
```

## 10. Network State Management

### 10.1 tRPC Integration
```typescript
// tRPC Router Types
interface RouterTypes {
  mutation: {
    createCard: {
      input: { content: string; metadata?: Record<string, unknown> };
      output: { hash: string; g_time: string };
    };
    updateCard: {
      input: { hash: string; content: string };
      output: { success: boolean };
    };
    deleteCard: {
      input: { hash: string };
      output: { success: boolean };
    };
  };
  query: {
    getCard: {
      input: { hash: string };
      output: MCardState;
    };
    searchCards: {
      input: { query: string; limit?: number };
      output: Array<{ hash: string; preview: string }>;
    };
    syncState: {
      input: { lastSync: string };
      output: Array<{ hash: string; operation: 'create' | 'update' | 'delete' }>;
    };
  };
  subscription: {
    cardUpdates: {
      input: void;
      output: { hash: string; type: 'create' | 'update' | 'delete' };
    };
  };
}

// Network State
interface NetworkState {
  connection: {
    status: 'connected' | 'disconnected' | 'connecting';
    lastSync: string;
    error?: string;
  };
  requests: {
    pending: Array<{
      id: string;
      type: keyof RouterTypes['mutation' | 'query'];
      payload: unknown;
      timestamp: number;
    }>;
    retryCount: Record<string, number>;
  };
  sync: {
    queue: Array<{
      hash: string;
      operation: 'create' | 'update' | 'delete';
      data: MCardState;
      timestamp: number;
    }>;
    lastSuccessful: string;
  };
}

// Network Actions
type NetworkActions = 
  | { 
      type: 'network/connect';
      payload?: { endpoint?: string };
    }
  | { 
      type: 'network/disconnect' 
    }
  | { 
      type: 'network/syncStart';
      payload: { lastSync: string };
    }
  | { 
      type: 'network/syncComplete';
      payload: { timestamp: string };
    }
  | { 
      type: 'network/queueOperation';
      payload: {
        operation: 'create' | 'update' | 'delete';
        data: MCardState;
      };
    };

// tRPC Client Configuration
interface TRPCConfig {
  endpoint: string;
  headers?: Record<string, string>;
  timeout: number;
  retryConfig: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
  };
}
```

### 10.2 PWA State
```typescript
interface PWAState {
  installation: {
    status: 'not_installed' | 'installing' | 'installed';
    deferredPrompt?: BeforeInstallPromptEvent;
  };
  connectivity: {
    status: 'online' | 'offline';
    lastChecked: number;
  };
  serviceWorker: {
    status: 'inactive' | 'active' | 'updating';
    registration?: ServiceWorkerRegistration;
    version?: string;
  };
  sync: {
    pending: Array<{
      id: string;
      operation: string;
      data: unknown;
      timestamp: number;
    }>;
    lastSync: number;
  };
}

type PWAActions = 
  | { type: 'pwa/checkInstallStatus' }
  | { type: 'pwa/triggerInstall' }
  | { type: 'pwa/updateConnectivity'; payload: 'online' | 'offline' }
  | { type: 'pwa/registerServiceWorker'; payload?: ServiceWorkerRegistration }
  | { type: 'pwa/queueSync'; payload: { operation: string; data: unknown } };
```

### 10.3 Optional P2P Support
```typescript
// Optional libP2P integration for direct peer communication
interface P2PState {
  enabled: boolean;
  peer?: {
    id: string;
    addresses: string[];
    protocols: string[];
  };
  peers: Array<{
    id: string;
    status: 'available' | 'connected';
    lastSeen: number;
  }>;
  discovery: {
    status: 'inactive' | 'searching' | 'found';
    foundPeers: number;
  };
}

type P2PActions = 
  | { type: 'p2p/enable' }
  | { type: 'p2p/disable' }
  | { type: 'p2p/connect'; payload: { peerId: string } }
  | { type: 'p2p/disconnect'; payload: { peerId: string } };
```

### 10.4 Network Middleware Integration
```typescript
// tRPC Client Middleware
const trpcMiddleware: Middleware = store => {
  const client = createTRPCClient<RouterTypes>({
    url: store.getState().config.trpc.endpoint,
  });

  return next => async action => {
    if (action.type === 'network/syncStart') {
      try {
        const updates = await client.query('syncState', {
          lastSync: action.payload.lastSync,
        });
        store.dispatch({ 
          type: 'network/syncComplete',
          payload: { timestamp: new Date().toISOString() }
        });
      } catch (error) {
        store.dispatch({ 
          type: 'network/error',
          payload: error.message
        });
      }
    }
    return next(action);
  };
};

// Background Sync Middleware
const syncMiddleware: Middleware = store => next => action => {
  if (action.type === 'network/online') {
    store.dispatch(syncPendingChanges());
  }
  return next(action);
};
```

### 10.5 Network Integration Example
```typescript
// Store Configuration
const store = configureStore({
  reducer: {
    network: networkReducer,
    pwa: pwaReducer,
    p2p: p2pReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(trpcMiddleware)
      .concat(syncMiddleware)
      .concat(p2pMiddleware),
});

// Usage Example
async function syncWithServer() {
  const lastSync = store.getState().network.sync.lastSuccessful;
  
  await store.dispatch({
    type: 'network/syncStart',
    payload: { lastSync }
  });

  // Handle offline case
  if (!navigator.onLine) {
    store.dispatch({
      type: 'pwa/queueSync',
      payload: {
        operation: 'sync',
        data: { lastSync }
      }
    });
  }
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(registration => {
    store.dispatch({
      type: 'pwa/registerServiceWorker',
      payload: registration
    });
  });
}
```

## 11. Persistent Storage Integration

### 11.1 MCard Data Model
```typescript
interface MCardState {
  content: Buffer;
  hash: string;
  hash_algorithm: string;
  g_time: string;
  content_type: string;
}

// MCard Redux Actions
type MCardActions = 
  | { type: 'mcard/create'; payload: { content: Buffer | string | object } }
  | { type: 'mcard/update'; payload: { hash: string; content: Buffer } }
  | { type: 'mcard/delete'; payload: { hash: string } }
  | { type: 'mcard/search'; payload: { query: string } };
```

### 11.2 Database Schema Integration
```typescript
// Database Schema Types
interface DatabaseSchema {
  documents: string; // FTS5 virtual table
  card: string;     // Primary card storage
}

interface DatabaseTriggers {
  card_insert: string;
  card_update: string;
  card_delete: string;
}

// Storage Adapters
interface StorageAdapter<T> {
  save: (key: string, value: T) => Promise<void>;
  load: (key: string) => Promise<T | null>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  search: (query: string) => Promise<T[]>;
}

// Turso Integration
interface TursoAdapter extends StorageAdapter<MCardState> {
  schema: DatabaseSchema;
  triggers: DatabaseTriggers;
  sync: () => Promise<void>;
  migrate: (version: string) => Promise<void>;
}

// IndexedDB Integration for Offline Support
interface IndexedDBAdapter extends StorageAdapter<MCardState> {
  syncWithTurso: () => Promise<void>;
  getPendingChanges: () => Promise<MCardState[]>;
}

// Storage Configuration
interface StorageConfig {
  primary: 'turso' | 'indexedDB';
  fallback: ('turso' | 'indexedDB')[];
  turso: {
    url: string;
    authToken: string;
    syncInterval: number;
  };
  indexedDB: {
    dbName: string;
    version: number;
    stores: {
      cards: string;
      pendingChanges: string;
    };
  };
}
```

### 11.3 Storage State Management
```typescript
interface StorageState {
  status: {
    online: boolean;
    syncing: boolean;
    lastSync: string | null;
    error: string | null;
  };
  pendingChanges: Array<{
    type: 'create' | 'update' | 'delete';
    card: MCardState;
    timestamp: string;
  }>;
  cache: {
    recentCards: Record<string, MCardState>;
    searchResults: Array<{
      query: string;
      hashes: string[];
      timestamp: string;
    }>;
  };
}

// Storage Actions
type StorageActions =
  | { type: 'storage/sync' }
  | { type: 'storage/offline' }
  | { type: 'storage/online' }
  | { type: 'storage/error'; payload: string }
  | { type: 'storage/clearCache' };
```

### 11.4 Storage Middleware
```typescript
// Turso Storage Middleware
const tursoMiddleware: Middleware = store => next => async action => {
  if (action.type === 'mcard/create' || action.type === 'mcard/update') {
    const card = new MCard(action.payload.content);
    try {
      await tursoAdapter.save(card.hash, card.to_dict());
      if (!navigator.onLine) {
        store.dispatch({ 
          type: 'storage/addPendingChange',
          payload: {
            type: action.type === 'mcard/create' ? 'create' : 'update',
            card: card.to_dict(),
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      if (!navigator.onLine) {
        await indexedDBAdapter.save(card.hash, card.to_dict());
      }
      store.dispatch({ type: 'storage/error', payload: error.message });
    }
  }
  return next(action);
};

// Background Sync Middleware
const syncMiddleware: Middleware = store => next => action => {
  if (action.type === 'storage/online') {
    store.dispatch(syncPendingChanges());
  }
  return next(action);
};
```

### 11.5 Integration Example
```typescript
// Store Configuration with Storage
const store = configureStore({
  reducer: {
    // ... other reducers
    storage: storageReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(tursoMiddleware)
      .concat(syncMiddleware),
});

// Usage Example
async function createCard(content: string) {
  try {
    const card = new MCard(content);
    await store.dispatch({ 
      type: 'mcard/create', 
      payload: { content }
    });
    
    // Search is handled through FTS5
    const results = await store.dispatch({
      type: 'mcard/search',
      payload: { query: 'some text' }
    });
    
  } catch (error) {
    console.error('Failed to create card:', error);
  }
}
```

### 11.6 Offline Support
```typescript
// Service Worker Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {
    // Cache essential MCards
    registration.active?.postMessage({
      type: 'CACHE_CARDS',
      payload: store.getState().storage.cache.recentCards
    });
  });
}

// IndexedDB Schema (based on MCard)
const DB_SCHEMA = {
  cards: 'hash,content,g_time,content_type',
  pendingChanges: 'hash,type,card,timestamp'
};

// Background Sync
async function syncPendingChanges() {
  const changes = await indexedDBAdapter.getPendingChanges();
  for (const change of changes) {
    try {
      await tursoAdapter.save(change.card.hash, change.card);
      await indexedDBAdapter.remove(change.card.hash);
    } catch (error) {
      console.error('Sync failed for card:', change.card.hash);
    }
  }
}
```

### 11.7 Decentralized Storage
```typescript
interface CRDTState {
  documents: Record<string, {
    type: 'counter' | 'register' | 'map';
    value: any;
    peers: string[];
    mergeStrategy: 'last-write-wins' | 'multi-value';
  }>;
  conflictResolution: {
    autoMerge: boolean;
    manualOverrides: Record<string, any>;
  };
}

// libP2P CRDT Middleware
const crdtMiddleware = store => next => async action => {
  if (action.type === 'network/crdtUpdate') {
    const { docId, update } = action.payload;
    const current = store.getState().crdt.documents[docId];
    const merged = mergeCRDT(current.value, update);
    store.dispatch({ type: 'crdt/update', payload: { docId, value: merged } });
  }
  return next(action);
};
```

## 12. Architectural Rationale

### 12.1 Progressive Knowledge Container Architecture

The state management architecture is designed to support Progressive Knowledge Container (PKC) development with the following key principles:

#### 12.1.1 Type-Safe Knowledge Representation
```typescript
// Core Knowledge Unit Type
interface KnowledgeUnit {
  hash: string;           // Unique identifier
  content: Buffer;        // Raw content
  metadata: {
    type: 'text' | 'code' | 'image' | 'reference';
    tags: string[];
    relations: Array<{
      type: 'references' | 'extends' | 'implements' | 'contradicts';
      targetHash: string;
    }>;
    version: string;
    timestamp: string;
  };
  verification: {
    signature?: string;
    proof?: string;
    trust: number;
  };
}

// Knowledge Graph Type
interface KnowledgeGraph {
  nodes: Record<string, KnowledgeUnit>;
  edges: Array<{
    source: string;
    target: string;
    type: string;
    weight: number;
  }>;
  clusters: Array<{
    id: string;
    nodes: string[];
    centroid: string;
  }>;
}
```

#### 12.1.2 Progressive Enhancement Strategy
1. **Base Layer**: Core MCard functionality
   - Hash-based content addressing
   - CRDT-based conflict resolution
   - Offline-first capabilities
   - Type-safe data structures

2. **Network Layer**: tRPC-based API
   - Type-safe remote procedure calls
   - Real-time subscriptions
   - Automatic code generation
   - Protocol-agnostic transport

3. **Knowledge Layer**: Semantic operations
   - Content type inference
   - Relationship mapping
   - Verification mechanisms
   - Trust computation

4. **Extension Layer**: Plugin system
   - Custom content types
   - Protocol adapters (e.g., libP2P)
   - Storage backends
   - UI components

### 12.2 Reusability Benefits

#### 12.2.1 Modular State Design
```typescript
// Pluggable State Module Type
interface StateModule<T> {
  name: string;
  reducer: Reducer<T>;
  middleware: Middleware[];
  selectors: Record<string, Selector>;
  actions: Record<string, ActionCreator>;
}

// Module Registration
interface ModuleRegistry {
  register: <T>(module: StateModule<T>) => void;
  unregister: (name: string) => void;
  getModule: (name: string) => StateModule<any>;
}
```

#### 12.2.2 Protocol Independence
- tRPC provides type-safe API layer
- Transport agnostic (HTTP, WebSocket, etc.)
- Optional P2P support via libP2P
- Custom protocol adapters possible

#### 12.2.3 Storage Flexibility
```typescript
// Storage Adapter Interface
interface StorageAdapter<T> {
  save: (key: string, value: T) => Promise<void>;
  load: (key: string) => Promise<T | null>;
  query: (filter: QueryFilter) => Promise<T[]>;
  watch: (pattern: string) => Observable<StorageEvent<T>>;
}

// Query Interface
interface QueryFilter {
  type?: string[];
  tags?: string[];
  dateRange?: [Date, Date];
  fullText?: string;
  relations?: {
    type: string;
    target: string;
  }[];
}
```

### 12.3 Long-term Benefits

#### 12.3.1 Knowledge Evolution
1. **Progressive Refinement**
   - Start with simple content types
   - Add semantic relationships
   - Evolve to complex knowledge structures
   - Maintain backward compatibility

2. **Extensible Verification**
   - Content verification
   - Authorship proof
   - Trust networks
   - Reputation systems

#### 12.3.2 Scale Considerations
```typescript
// Scaling Strategy
interface ScalingConfig {
  sharding: {
    strategy: 'content' | 'geographic' | 'temporal';
    maxNodesPerShard: number;
  };
  caching: {
    strategy: 'lru' | 'frequency' | 'semantic';
    maxSize: number;
    ttl: number;
  };
  sync: {
    strategy: 'eager' | 'lazy' | 'selective';
    priority: 'speed' | 'consistency' | 'bandwidth';
  };
}
```

#### 12.3.3 Future Adaptability
1. **Protocol Evolution**
   - Start with tRPC for type safety
   - Add P2P capabilities as needed
   - Support for new protocols
   - Migration paths

2. **Knowledge Representation**
   - Basic content types
   - Rich semantic relationships
   - AI-ready structures
   - Interoperability standards

### 12.4 Implementation Strategy

#### 12.4.1 Phased Development
1. **Phase 1: Core Infrastructure**
   - MCard implementation
   - tRPC API layer
   - Basic storage
   - PWA capabilities

2. **Phase 2: Knowledge Enhancement**
   - Semantic relationships
   - Content type system
   - Search capabilities
   - Verification system

3. **Phase 3: Advanced Features**
   - P2P networking
   - AI integration
   - Plugin system
   - Federation support

#### 12.4.2 Migration Path
```typescript
// Version Migration
interface MigrationStep {
  version: string;
  up: (state: any) => Promise<any>;
  down: (state: any) => Promise<any>;
  validation: (state: any) => boolean;
}

// Migration Manager
interface MigrationManager {
  addMigration: (step: MigrationStep) => void;
  migrate: (targetVersion: string) => Promise<void>;
  validateState: () => Promise<boolean>;
}
```

This architecture provides a solid foundation for building a Progressive Knowledge Container system that can evolve over time while maintaining type safety, extensibility, and performance. The modular design allows for gradual enhancement of capabilities while the type-safe nature of tRPC ensures reliable API interactions.
