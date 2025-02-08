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
    libp2p: LibP2PState;
    web3: Web3State; // Optional additional protocols
  };
  storage: StorageState; // New storage section
}
```

### 1.2 Domain-Specific States

#### Theme Management
```typescript
interface ThemeState {
  mode: 'light' | 'dark' | 'system';
  customizations: Record<string, string>;
  systemPreference: boolean;
}

type ThemeActions = 
  | { type: 'TOGGLE_THEME' }                     // Switch between light and dark
  | { type: 'SET_THEME_MODE'; payload: 'light' | 'dark' }  // Explicitly set theme
  | { type: 'theme/updateCustomizations'; payload: Partial<ThemeState['customizations']> }
  | { type: 'theme/setAccessibility'; payload: { reducedMotion: boolean; highContrast: boolean } }
  | { type: 'theme/syncWithSystem' };
```

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
      priority: number;
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
        priority: number;
      }
    }}                                           // Log a new action
  | { type: 'history/undo' }
  | { type: 'history/redo' }
  | { type: 'history/clear' };
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
      metadata?: Record<string, unknown>;
    }>;
    context: string[];
  };
  generation: {
    status: 'idle' | 'generating' | 'error';
    currentTask: string | null;
    error: string | null;
  };
  models: {
    available: string[];
    selected: string;
    parameters: Record<string, unknown>;
    relevantDocs: string[];
  };
}

type LLMActions = 
  | { type: 'SEND_MESSAGE'; payload: {
      content: string;
      role: 'user' | 'system';
      metadata?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
      }
    }}                                           // Send a new message
  | { type: 'RECEIVE_ASSISTANT_MESSAGE'; payload: {
      content: string;
      metadata?: {
        model: string;
      }
    }}                                           // Receive AI response
  | { type: 'START_GENERATION'; payload: {
      currentTask: string;
      metadata?: Record<string, unknown>
    }}                                           // Initiate generation process
  | { type: 'GENERATION_SUCCESS'; payload: any } // Successful generation
  | { type: 'GENERATION_FAILURE'; payload: {
      error: string;
    }}                                           // Generation error
  | { type: 'RESET_CONVERSATION' }               // Clear current conversation
  | { type: 'UPDATE_CONTEXT_WINDOW'; payload: string[] }  // Update AI context
  | { type: 'llm/setModel'; payload: string }
  | { type: 'llm/updateParameters'; payload: Record<string, unknown> };
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
```typescript
interface ThemeState {
  mode: 'light' | 'dark' | 'system';
  customizations: Record<string, string>;
  systemPreference: boolean;
}

type ThemeActions = 
  | { type: 'TOGGLE_THEME' }                     // Switch between light and dark
  | { type: 'SET_THEME_MODE'; payload: 'light' | 'dark' }  // Explicitly set theme
  | { type: 'theme/updateCustomizations'; payload: Partial<ThemeState['customizations']> }
  | { type: 'theme/setAccessibility'; payload: { reducedMotion: boolean; highContrast: boolean } }
  | { type: 'theme/syncWithSystem' };
```

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
      priority: number;
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
        priority: number;
      }
    }}                                           // Log a new action
  | { type: 'history/undo' }
  | { type: 'history/redo' }
  | { type: 'history/clear' };
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
      metadata?: Record<string, unknown>;
    }>;
    context: string[];
  };
  generation: {
    status: 'idle' | 'generating' | 'error';
    currentTask: string | null;
    error: string | null;
  };
  models: {
    available: string[];
    selected: string;
    parameters: Record<string, unknown>;
    relevantDocs: string[];
  };
}

type LLMActions = 
  | { type: 'SEND_MESSAGE'; payload: {
      content: string;
      role: 'user' | 'system';
      metadata?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
      }
    }}                                           // Send a new message
  | { type: 'RECEIVE_ASSISTANT_MESSAGE'; payload: {
      content: string;
      metadata?: {
        model: string;
      }
    }}                                           // Receive AI response
  | { type: 'START_GENERATION'; payload: {
      currentTask: string;
      metadata?: Record<string, unknown>
    }}                                           // Initiate generation process
  | { type: 'GENERATION_SUCCESS'; payload: any } // Successful generation
  | { type: 'GENERATION_FAILURE'; payload: {
      error: string;
    }}                                           // Generation error
  | { type: 'RESET_CONVERSATION' }               // Clear current conversation
  | { type: 'UPDATE_CONTEXT_WINDOW'; payload: string[] }  // Update AI context
  | { type: 'llm/setModel'; payload: string }
  | { type: 'llm/updateParameters'; payload: Record<string, unknown> };
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
    pwa: PWAState;
    libp2p: LibP2PState;
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

### 10.1 PWA State (pwaSlice)
```typescript
interface PWAState {
  installation: {
    deferredPrompt: BeforeInstallPromptEvent | null;
    installed: boolean;
  };
  offline: {
    status: 'online' | 'offline';
    cachedResources: string[];
    cacheVersion: string;
  };
  backgroundSync: {
    queuedRequests: Array<{
      id: string;
      request: Request;
      timestamp: number;
    }>;
    lastSync: number | null;
  };
  serviceWorker: {
    registration: ServiceWorkerRegistration | null;
    updateAvailable: boolean;
    version: string;
  };
}
```

### 10.2 libP2P Network State (networkSlice)
```typescript
interface LibP2PState {
  peer: {
    id: string | null;
    addresses: Multiaddr[];
    protocols: string[];
    metadata: Record<string, any>;
  };
  connection: {
    status: 'disconnected' | 'connecting' | 'connected';
    lastSeen: number;
    quality: number; // 0-100 connection quality score
  };
  network: {
    peers: Record<string, {
      latency: number;
      protocols: string[];
      connectionType: 'webrtc' | 'websocket' | 'quic';
      encrypted: boolean;
    }>;
    bootstrapNodes: string[];
    dht: {
      routingTableSize: number;
      contentRoutingEnabled: boolean;
    };
  };
  pubsub: {
    topics: Record<string, {
      subscribers: number;
      messageRate: number; // messages/sec
      lastMessage: any | null;
    }>;
  };
  encryption: {
    keyPair: CryptoKeyPair | null;
    trustedKeys: Record<string, CryptoKey>;
  };
}
```

### 10.3 Network Middleware Integration
```typescript
// PWA Middleware
const pwaMiddleware: Middleware = store => next => async action => {
  if (action.type === 'network/pwaInstall') {
    const { deferredPrompt } = store.getState().pwa.installation;
    deferredPrompt?.prompt();
  }
  
  if (action.type === 'network/offlineCache') {
    caches.open('v1').then(cache => cache.addAll(action.payload));
  }
  
  return next(action);
};

// libP2P Middleware
const libp2pMiddleware: Middleware = store => {
  let node: LibP2P | null = null;
  
  return next => async action => {
    switch (action.type) {
      case 'network/startLibp2p':
        node = await createLibP2PNode(store.getState().config.integration.libp2p);
        node.addEventListener('peer:connect', (evt) => {
          store.dispatch({ type: 'network/peerConnected', payload: evt.detail });
        });
        break;
        
      case 'network/publishMessage':
        await node?.pubsub.publish(action.topic, action.message);
        break;
    }
    return next(action);
  };
};
```

### 10.4 State Integration
```typescript
// Updated Root State
interface RootState {
  // ... existing slices
  pwa: PWAState;
  network: {
    libp2p: LibP2PState;
    web3: Web3State; // Optional additional protocols
  };
}

// Network Actions Example
type NetworkActions = 
  | { type: 'network/pwaInstall' }
  | { type: 'network/offlineCache'; payload: string[] }
  | { type: 'network/startLibp2p'; config: LibP2PConfig }
  | { type: 'network/publishMessage'; topic: string; message: any }
  | { type: 'network/peerConnected'; payload: PeerInfo };

// Enhanced Store Configuration
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(pwaMiddleware)
      .concat(libp2pMiddleware)
      .concat(offlineQueueMiddleware),
});

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {
    // Cache essential MCards
    registration.active?.postMessage({
      type: 'CACHE_CARDS',
      payload: store.getState().storage.cache.recentCards
    });
  });
}
```

### 10.5 Decentralized State Synchronization
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
