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
}
```

### 1.2 Domain-Specific States

#### Theme Management
```typescript
interface ThemeState {
  mode: 'light' | 'dark';
  customizations: Record<string, string>;
  systemPreference: boolean;
}

type ThemeActions = 
  | { type: 'TOGGLE_THEME' }                     // Switch between light and dark
  | { type: 'SET_THEME_MODE'; payload: 'light' | 'dark' }  // Explicitly set theme
```

#### Action History
```typescript
interface ActionHistoryState {
  actions: Array<{
    hash: string;        // Version-controlled identifier
    type: string;        // Action type
    content: string;     // Action payload
    timestamp: string;   // Action timestamp
    metadata: {          // Additional context
      source: string;
      category: string;
      priority: number;
    };
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
```

#### Content Management
```typescript
interface ContentState {
  contents: Array<{
    hash: string;           // Content identifier
    content: string;        // Content data
    timestamp: string;      // Modification time
    version: number;        // Content version
    relationships: {        // Content relationships
      parentHash?: string;
      childHashes: string[];
      relatedHashes: string[];
    };
  }>;
  searchQuery: string;
  selectedContent: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  pagination: {
    currentPage: number;
    itemsPerPage: number;
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
```

#### LLM Integration
```typescript
interface LLMState {
  messages: Array<{
    content: string;
    role: 'user' | 'assistant' | 'system';
    timestamp: string;
    metadata: {
      model: string;
      temperature: number;
      maxTokens: number;
    };
  }>;
  currentConversationId: string | null;
  generation: {
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    progress: number;
    currentTask: string | null;
    error: string | null;
  };
  memory: {
    contextWindow: string[];
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
```

#### User Management
```typescript
interface UserState {
  // Add user state properties here
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

## 7. State-Specific Actions

### 7.1 Theme Management Actions
```typescript
type ThemeActions = 
  | { type: 'TOGGLE_THEME' }                     // Switch between light and dark
  | { type: 'SET_THEME_MODE'; payload: 'light' | 'dark' }  // Explicitly set theme
```

### 7.2 Action History Actions
```typescript
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
```

### 7.3 Content Management Actions
```typescript
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
```

### 7.4 LLM Integration Actions
```typescript
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
```

### 7.5 User Management Actions
```typescript
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