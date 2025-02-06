# Redux + Astro Architecture Design

## Core Design Principles

### 1. State Domain Separation
- **Core State**: Global application state (layout, themes, user preferences)
- **Feature State**: Domain-specific state (todos, documents, media)
- **UI State**: Panel configurations and layout preferences

### 2. Layout System Abstraction

#### Panel Framework Design
```mermaid
graph TD
    A[Panel Registry] --> B[Layout Manager]
    B --> C[Panel Instance]
    C --> D[Content Renderer]
    D --> E[Content Adapter]
```

#### Key Components
1. **Panel Registry**
   - Manages available panel types
   - Handles dynamic panel registration
   - Maps content types to appropriate panels

2. **Layout Manager**
   - Controls panel dimensions and positions
   - Manages panel state persistence
   - Handles resize events and constraints

3. **Content Adapters**
   - Abstracts content type handling
   - Prepares for Astro DB integration
   - Standardizes content interfaces

### 3. Redux Architecture

#### State Organization
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
```

#### Slice Structure
Each feature slice follows this pattern:
```typescript
// Feature Slice Template
interface FeatureState<T> {
  entities: Record<string, T>;
  metadata: {
    lastUpdated: string;
    source: 'local' | 'astro-db';
  };
  ui: {
    selected?: string;
    filters: Record<string, unknown>;
  };
}
```

### 4. Content-Driven Architecture

#### Content Type System
```typescript
interface ContentType {
  id: string;
  type: 'todo' | 'document' | 'media';
  metadata: {
    created: string;
    modified: string;
    astroDbId?: string;
  };
  content: unknown;
}

interface ContentAdapter<T> {
  serialize: (content: T) => string;
  deserialize: (raw: string) => T;
  validate: (content: unknown) => content is T;
}
```

### 5. Panel Implementation

#### Base Components
```astro
// ResizablePanel.astro
---
const { defaultSize = 30, minSize = 20 } = Astro.props;
---
<aside style={`flex: ${defaultSize}%; min-width: ${minSize}%`} 
       class="h-full overflow-hidden">
  <slot />
</aside>
<div class="w-1 bg-slate-200 hover:bg-slate-400 transition-colors cursor-ew-resize">
</div>

// PanelGroupLayout.astro
---
---
<div class="h-screen flex">
  <slot />
</div>
```

#### Panel State Management
```typescript
// Panel Types
interface PanelConfig {
  type: PanelType;
  defaultSize: number;
  minSize: number;
  content: Component;
}

// Panel State
interface PanelState {
  id: string;
  type: PanelType;
  size: number;
  isVisible: boolean;
  content: any;
}

// Redux Slice
const panelSlice = createSlice({
  name: 'panels',
  initialState,
  reducers: {
    updatePanelSize: (state, action) => {
      const { id, size } = action.payload;
      const panel = state.panels.find(p => p.id === id);
      if (panel) panel.size = size;
    },
    togglePanelVisibility: (state, action) => {
      const { id } = action.payload;
      const panel = state.panels.find(p => p.id === id);
      if (panel) panel.isVisible = !panel.isVisible;
    }
  }
});
```

### 6. Content Integration

#### Dynamic Panel Loading
```typescript
const loadPanel = async (config: PanelConfig) => {
  const Panel = await import(`./panels/${config.type}.astro`);
  return (
    <ResizablePanel 
      defaultSize={config.defaultSize} 
      minSize={config.minSize}
    >
      <Panel.default content={config.content} />
    </ResizablePanel>
  );
};
```

#### Layout Persistence
```typescript
// Local Storage Integration
const persistLayout = (layout: LayoutState) => {
  localStorage.setItem('panel-layout', JSON.stringify(layout));
};

// Redux Middleware
const layoutPersistenceMiddleware = store => next => action => {
  const result = next(action);
  if (action.type.startsWith('panels/')) {
    const state = store.getState();
    persistLayout(state.ui.panels);
  }
  return result;
};
```

## Implementation Strategy

### Phase 1: Foundation
1. Split current todoSlice.js into domain-specific slices
2. Implement Panel Registry and Layout Manager
3. Create base Content Adapter interface

### Phase 2: Panel System
1. Convert existing components to use Panel System
2. Implement panel state persistence
3. Add panel type registration system

### Phase 3: Astro Integration
1. Create Astro DB content adapters
2. Implement hybrid rendering strategy
3. Add SSR optimization for static content

## Directory Structure
```
src/
├── core/
│   ├── state/           # Core Redux setup
│   ├── panels/          # Panel system
│   └── content/         # Content type system
├── features/
│   ├── todos/           # Todo management
│   │   ├── slice.ts
│   │   ├── adapters.ts
│   │   └── components/
│   └── documents/       # Future feature
├── layouts/
│   ├── panels/
│   └── templates/
└── shared/
    ├── hooks/
    └── utils/
```

## Migration Path

### Current to Target Architecture
1. **Extract Core State**
   - Move layout state to dedicated slice
   - Create panel configuration system

2. **Modularize Features**
   - Split todoSlice.js into domain slices
   - Create feature-specific adapters

3. **Panel System Integration**
   - Implement Panel Registry
   - Convert existing views to panel system

4. **Astro DB Preparation**
   - Add content type interfaces
   - Create Astro DB adapters

## Best Practices

### State Management
1. Use feature-specific selectors
2. Implement memoization for complex computations
3. Keep UI state separate from domain state

### Panel System
1. Register panels at startup
2. Use content type matching for panel selection
3. Implement layout persistence

### Content Handling
1. Use strict typing for content interfaces
2. Implement content validation
3. Prepare for Astro DB migration

## Future Considerations

### Astro DB Integration
- Content type mapping
- Migration strategy
- Hybrid rendering optimization

### Scalability
- Dynamic panel loading
- State persistence strategies
- Performance optimization

### Testing Strategy
1. Unit tests for reducers and selectors
2. Integration tests for panel system
3. E2E tests for critical paths

## Implementation Guidelines

### 1. Panel Development
- Use Astro slots for content injection
- Implement resize handlers with debouncing
- Support dynamic content loading
- Maintain accessibility standards

### 2. State Management
- Separate layout state from content state
- Use Redux for global panel management
- Implement local storage persistence
- Handle panel visibility efficiently

### 3. Performance Optimization
- Lazy load panel content
- Implement resize debouncing
- Use efficient state updates
- Optimize panel transitions

### 4. Accessibility
- Implement keyboard navigation
- Add ARIA attributes
- Support screen readers
- Maintain focus management

## Migration Strategy

### Phase 1: Core Implementation
1. Set up base panel components
2. Implement Redux state management
3. Add layout persistence

### Phase 2: Feature Integration
1. Integrate content adapters
2. Add dynamic panel loading
3. Implement panel registry

### Phase 3: Enhancement
1. Add accessibility features
2. Optimize performance
3. Implement advanced layouts
