# Architecture Decisions

## Overview

This project implements a lightweight, extensible framework for an AI-powered [Progressive Knowledge Container](./Personal%20Knowledge%20Container.md) (PKC). Built as a Progressive Web App (PWA) using JavaScript and WASM for maximum portability, it serves as a thin orchestration layer between external data stores (LLMs, SQLite, IndexedDB) and a browser-based user interface. The system transforms natural language inputs into actionable workflows and executable code, with all substantial data residing in external storage systems.

Key Design Principles:
- Minimal core codebase focused on orchestration and [Agentic Workflow](./AgenticWorkflowDesign.md) management
- External data storage for all substantial content (LLMs, SQLite, IndexedDB)
- Dynamic loading of functionality through data module definitions
- JavaScript/WASM implementation for cross-platform compatibility (see [Deno](https://deno.com/))
- Browser-based interface for universal accessibility

At its core, the system coordinates with external services and data stores to:
- Leverage Large Language Models (LLMs) for natural language processing
- Store and retrieve data using SQLite or IndexedDB
- Generate executable source code from specifications
- Create and manipulate media content through external services
- Detect and fix errors using AI agents
- Infer new content relationships from existing knowledge

Static content management follows Astro's conventions:
- Documentation in `src/assets/md` uses Markdown with front matter
- Internal document linking through Astro's file-based routing
- Media assets (images, videos) managed by Astro's asset pipeline
- Content relationships maintained through standard Astro collections

The architecture implements a REPL-driven development model where:
- Each cognitive operation (note-taking, code generation, error fixing) is an atomic ToDo
- Operations can be individually monitored, tested, and verified
- State management is handled by Redux with external persistence
- Complex AI operations are managed by Redux Thunk
- Event-driven workflows are orchestrated by Redux Saga

Framework Components:
1. **Core Orchestration Layer**
   - Functional programming paradigm with pure functions
   - Event-sourced workflow management using Redux
   - Hash-referenced configuration system
   - REPL-based development workflow

2. **External Data Integration**
   - LangChain for LLM orchestration
   - SQLite/IndexedDB for persistent storage
   - Content encoded in Markdown with front-matter
   - Dynamic module loading system

3. **UI Components**
   - Static site generation with Astro
   - React components for interactivity
   - Error detection and fixing through AI
   - Responsive PWA interface

The system implements a [Cubical Logic Model](./Cubical%20Logic%20Model.md) with the following four aspects, all persisted in external storage:

1. **Knowledge Capture (Abstract Specification)**
   - Natural language note-taking and refinement
   - Workflow step definitions and dependencies
   - Error and warning documentation
   - AI-generated insights and suggestions

2. **Code Generation (Concrete Implementation)**
   - LLM-powered source code generation
   - Automated error fixing and code optimization
   - Media content creation and manipulation
   - Executable workflow step sequences

3. **State Management (Runtime Tracking)**
   - Redux store with domain-specific slices
   - AI operation status monitoring
   - Error state tracking and resolution
   - Real-time execution feedback

4. **Event History (Realistic Expectations)**
   - ToDo event logging with MCard schema
   - AI operation audit trails
   - Error resolution history
   - Knowledge evolution tracking

The system functions as a self-contained data store, implementing distributed operating system principles through event sourcing and state management. All components follow functional programming best practices and Astro framework conventions, ensuring maintainability, testability, and scalability. The integration of LLMs enables a new paradigm of human-AI collaboration, where natural language understanding bridges the gap between human intent and executable code.

## I. Foundational Philosophy: Pure Functions and Type-Safe State Management

Our architecture implements functional programming through three core mechanisms:

1. **Redux for Pure State Transformations**
   - All state changes are performed through pure reducer functions
   - Actions represent atomic state transformation intents
   - State immutability is enforced through Redux's architecture
   - Side effects are isolated in Redux Thunk and Saga middleware

2. **TypeScript for Type Safety and Function Contracts**
   - All state shapes are strictly typed
   - Function signatures enforce input/output contracts
   - Generic types enable reusable type-safe components
   - Type inference provides development-time validation

3. **REPL for Function Verification**
   - Each function can be tested independently in the REPL
   - State transformations are immediately observable
   - Function composition can be verified step-by-step
   - Side effects can be monitored and debugged in isolation

This three-pronged approach ensures that our functional programming principles are not just theoretical but are practically enforced through tooling and development workflow.

## II. State Management Architecture

### 1. State Domain Separation Through Functional Composition

```typescript
interface RootState {
  core: {
    layout: LayoutState;
    theme: ThemeState;
    user: UserState;
  };
  features: {
    todos: TodoState;
    documents: DocumentState;
    media: MediaState;
  };
  ui: {
    panels: PanelState[];
    activePanel: string;
    savedLayouts: Record<string, PanelState[]>;
  };
}

// Pure state transformations through composition
const rootReducer = combineReducers({
  core: coreReducer,
  features: featureReducer,
  ui: uiReducer
});
```

### 2. Panel System State Management

```typescript
// Panel Registration System
interface PanelDefinition {
  id: string;
  name: string;
  contentTypes: string[];
  component: React.ComponentType<PanelProps>;
  defaultConfig: PanelConfig;
}

// Panel State Management
interface PanelState {
  readonly id: string;
  readonly type: PanelType;
  readonly content: unknown;
  readonly position: Position;
  readonly config: PanelConfig;
}

// Pure Panel Operations
const panelOperations = {
  resize: (state: PanelState, size: Size): PanelState => ({
    ...state,
    position: { ...state.position, size }
  }),
  
  move: (state: PanelState, point: Point): PanelState => ({
    ...state,
    position: { ...state.position, point }
  }),
  
  update: (state: PanelState, content: unknown): PanelState => ({
    ...state,
    content
  })
};
```

## III. The REPL Pattern and Redux Loop

Our architecture embraces the Read-Eval-Print Loop (REPL) pattern, which aligns perfectly with Redux's state management cycle:

### 1. Core REPL Cycle

```typescript
interface REPLCycle<S, A> {
  read: () => A;                     // Action creators
  eval: (state: S, action: A) => S;  // Reducers
  print: (state: S) => void;         // UI rendering
  loop: () => void;                  // Next cycle
}

// Implementation in Redux terms
const createREPLStore = <S, A>(
  initialState: S,
  reducer: (state: S, action: A) => S
) => {
  let currentState = initialState;
  
  return {
    read: () => ({ type: 'READ' as const }),
    eval: (action: A) => {
      currentState = reducer(currentState, action);
      return currentState;
    },
    print: () => renderUI(currentState),
    loop: () => requestAnimationFrame(tick)
  };
};
```

### 2. Side Effect Management

```typescript
// Effect description type
interface Effect<T> {
  type: string;
  payload: T;
  execute: () => Promise<void>;
}

// Pure effect creator
const createEffect = <T>(type: string, payload: T): Effect<T> => ({
  type,
  payload,
  execute: async () => {
    // Effect implementation
  }
});

// Effect middleware
const effectMiddleware = (store: Store) => (next: Dispatch) => (action: Action) => {
  const result = next(action);
  if (isEffect(action)) {
    action.execute().then(
      () => store.dispatch(effectSuccess(action)),
      error => store.dispatch(effectFailure(action, error))
    );
  }
  return result;
};
```

## IV. Panel Implementation Architecture

### 1. Layout System Abstraction

```typescript
// Layout Manager Interface
interface LayoutManager {
  createLayout: (type: LayoutType, config: LayoutConfig) => Layout;
  addPanel: (panel: PanelDefinition, position?: Position) => void;
  removePanel: (panelId: string) => void;
  resizePanel: (panelId: string, dimensions: Dimensions) => void;
  serializeLayout: () => LayoutState;
  deserializeLayout: (state: LayoutState) => void;
}

// Panel Group Implementation
interface PanelGroup {
  readonly id: string;
  readonly panels: ReadonlyArray<Panel>;
  readonly layout: Layout;
  
  addPanel: (panel: Panel) => PanelGroup;
  removePanel: (id: string) => PanelGroup;
  updatePanel: (id: string, updates: Partial<Panel>) => PanelGroup;
}
```

### 2. Focus Management Integration

```typescript
// Focus Management System
interface FocusManager {
  currentFocusedPanel: string | null;
  
  getFocusableElements(panel: HTMLElement): HTMLElement[];
  moveFocusToNextPanel(currentPanelId: string): void;
  trapFocus(panel: HTMLElement): void;
}

// Focus-Aware Panel Component
interface FocusAwarePanelProps {
  id: string;
  children: React.ReactNode;
}

const FocusAwarePanel: React.FC<FocusAwarePanelProps> = ({ id, children }) => {
  const dispatch = useDispatch();
  const activePanelId = useSelector((state: RootState) => state.focus.activePanelId);
  
  useEffect(() => {
    if (activePanelId === id) {
      const panel = document.getElementById(id);
      if (panel) {
        setupFocusTrap(panel);
      }
    }
  }, [id, activePanelId]);
  
  return (
    <div 
      id={id}
      role="region"
      tabIndex={-1}
      aria-label={`Panel ${id}`}
    >
      {children}
    </div>
  );
};
```

### 3. Drag and Drop Integration

```typescript
// DnD State Management
interface DragState {
  isDragging: boolean;
  sourceId: string | null;
  targetId: string | null;
  itemType: string | null;
  item: any;
  position: { x: number; y: number } | null;
}

// Draggable Panel Component
const DraggablePanel: React.FC<DraggablePanelProps> = ({
  id,
  children,
  dragType,
  dragData
}) => {
  const dispatch = useDispatch();
  
  const [{ opacity }, dragRef] = useDrag({
    type: dragType,
    item: () => {
      dispatch(dndSlice.actions.dragStart({
        sourceId: id,
        itemType: dragType,
        item: dragData
      }));
      return { id, type: dragType, data: dragData };
    },
    collect: (monitor) => ({
      opacity: monitor.isDragging() ? 0.5 : 1
    })
  });

  return (
    <FocusAwarePanel id={id}>
      <div ref={dragRef} style={{ opacity }}>
        {children}
      </div>
    </FocusAwarePanel>
  );
};
```

## V. Performance Optimizations

### 1. State Updates
```typescript
// Optimized state transitions
const createOptimizedReducer = <S, A>(
  handlers: Record<string, (state: S, action: A) => S>
) => {
  const memoizedHandlers = new Map();
  
  return (state: S, action: A): S => {
    const handler = handlers[action.type];
    if (!handler) return state;
    
    const key = JSON.stringify(action);
    if (memoizedHandlers.has(key)) {
      return memoizedHandlers.get(key)(state);
    }
    
    const result = handler(state, action);
    memoizedHandlers.set(key, () => result);
    return result;
  };
};
```

### 2. Component Optimizations
```typescript
// Memoized panel component
const MemoizedPanel = memo(Panel, (prev, next) => {
  return (
    prev.id === next.id &&
    prev.size === next.size &&
    prev.content === next.content
  );
});

// Selective rendering
const usePanelRenderer = (panelId: string) => {
  const panel = useSelector(
    (state: RootState) => state.panels[panelId],
    shallowEqual
  );
  
  return useMemo(
    () => <PanelContent content={panel.content} />,
    [panel.content]
  );
};
```

## VI. Benefits and Considerations

### 1. Architectural Benefits
- **Predictability**: Pure functions ensure predictable state changes
- **Testability**: Pure functions are easily tested
- **Maintainability**: Clear separation of concerns
- **Scalability**: Functional composition for complex features
- **Performance**: Efficient state updates through immutability

### 2. Implementation Considerations
- Careful management of side effects
- Proper type safety throughout the system
- Balance between performance and immutability
- Proper error boundaries and recovery
- Accessibility compliance

This architectural approach provides a robust foundation for building complex, maintainable applications while ensuring high performance and reliability through functional programming principles.
