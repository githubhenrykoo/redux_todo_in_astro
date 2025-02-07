# Multi-Panel Design System for Interactive Multimedia & Chat

## Design Philosophy

A reusable multimedia-chat interface should be:

- Content-agnostic (supports images, video, 3D models, documents)
- Collaboration-first with real-time interaction capabilities
- Context-aware of media types and workflows
- Conversation-integrated (chat tied to content)
- Cross-platform consistent across devices
- Functionally pure with isolated side effects

## Panel Architecture

### Core Panel Types

1. **Media Workspace (Primary)**
   - Central canvas for media interaction
   - Supports layered editing/preview
   - Multiple tabbed workspaces
   - Pure rendering functions

2. **Conversation Hub (Secondary)**
   - Threaded chat with media annotations
   - Collaborative cursor/pointer sharing
   - Context-aware suggestion panel
   - Immutable message history

3. **Asset Navigator (Secondary)**
   - Unified media library (local/cloud)
   - Version history timeline
   - Metadata inspector
   - Pure state transformations

4. **Tool Orchestrator (Utility)**
   - Adaptive editing tools palette
   - AI-assisted quick actions
   - Session participants roster
   - Side-effect isolation

### Functional Implementation Architecture

#### 1. Pure Panel Components

```astro
// ResizablePanel.astro - Pure Component
---
interface Props {
  defaultSize: number;
  minSize: number;
  id: string;
}

const { defaultSize = 30, minSize = 20, id } = Astro.props;
---
<aside 
  id={id}
  style={`flex: ${defaultSize}%; min-width: ${minSize}%`} 
  class="h-full overflow-hidden"
  x-data={`{ 
    size: ${defaultSize},
    resize(newSize) {
      this.size = Math.max(${minSize}, Math.min(newSize, 100 - ${minSize}));
    }
  }`}
>
  <slot />
</aside>
```

#### 2. Functional Layout Framework

```astro
// PanelGroupLayout.jsx - Pure Container
---
interface Props {
  layout: Layout;
}

const { layout } = Astro.props;
---
<div class="h-screen flex">
  {layout.panels.map(panel => (
    <ResizablePanel
      id={panel.id}
      defaultSize={panel.size}
      minSize={panel.minSize}
    >
      <slot name={panel.id} />
    </ResizablePanel>
  ))}
</div>
```

### Pure State Management

#### 1. Immutable Panel State
```typescript
// Pure state types
type PanelId = string;
type Size = number;

interface PanelState {
  readonly id: PanelId;
  readonly type: PanelType;
  readonly size: Size;
  readonly isVisible: boolean;
  readonly content: unknown;
}

// Pure state transformations
const updatePanelSize = (
  state: PanelState,
  newSize: Size
): PanelState => ({
  ...state,
  size: Math.max(state.minSize, Math.min(newSize, 100 - state.minSize))
});

const togglePanelVisibility = (
  state: PanelState
): PanelState => ({
  ...state,
  isVisible: !state.isVisible
});
```

#### 2. Side Effect Isolation
```typescript
// Side effect wrapper for resize handling
const createResizeHandler = (
  panelId: PanelId,
  dispatch: Dispatch
) => {
  let startX: number;
  let startSize: Size;

  const start = (e: MouseEvent) => {
    startX = e.clientX;
    startSize = getPanelSize(panelId);
    
    // Isolate document-level effects
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', end);
  };

  const move = (e: MouseEvent) => {
    const delta = e.clientX - startX;
    const newSize = startSize + (delta / window.innerWidth) * 100;
    
    // Pure state update through Redux
    dispatch(updatePanelSize({ id: panelId, size: newSize }));
  };

  const end = () => {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', end);
  };

  return { start };
};
```

### Functional Workflow Patterns

#### 1. Pure Layout Composition
```typescript
// Pure layout configuration
const createVideoReviewLayout = (
  content: VideoContent
): Layout => ({
  panels: [
    {
      id: 'asset-browser',
      type: 'browser',
      size: 25,
      content: content.versions
    },
    {
      id: 'media-workspace',
      type: 'player',
      size: 50,
      content: content.current
    },
    {
      id: 'conversation',
      type: 'chat',
      size: 25,
      content: content.comments
    }
  ]
});
```

#### 2. Pure Content Transformations
```typescript
// Pure content processing
const processMediaContent = (
  content: RawContent
): ProcessedContent => ({
  ...content,
  thumbnail: generateThumbnail(content),
  metadata: extractMetadata(content),
  preview: createPreview(content)
});
```

# Focus Management System

Focus management is a crucial aspect of panel-based web applications, ensuring proper keyboard navigation and accessibility. This section outlines our approach to managing focus across multiple panels.

## Core Focus Management

```typescript
// Core Focus Management System
interface FocusManager {
  // Track currently focused panel
  currentFocusedPanel: string | null;
  
  // Get focusable elements within a panel
  getFocusableElements(panel: HTMLElement): HTMLElement[] {
    return Array.from(panel.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ));
  }
  
  // Move focus to next panel
  moveFocusToNextPanel(currentPanelId: string): void {
    const nextPanel = this.getNextPanel(currentPanelId);
    if (nextPanel) {
      const focusableElements = this.getFocusableElements(nextPanel);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }
  
  // Handle focus trapping within a panel
  trapFocus(panel: HTMLElement): void {
    const focusableElements = this.getFocusableElements(panel);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    panel.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    });
  }
}
```

## Panel-Specific Focus Management

```typescript
// Panel Focus Management Implementation
class PanelFocusManager {
  // Set initial focus when panel opens
  setInitialFocus(panel: HTMLElement): void {
    const defaultFocusElement = panel.querySelector('[data-default-focus]');
    if (defaultFocusElement instanceof HTMLElement) {
      defaultFocusElement.focus();
    }
  }
  
  // Handle focus when panel becomes active
  handlePanelActivation(panel: HTMLElement): void {
    // Store last focused element
    const lastFocused = document.activeElement;
    
    // Set focus to panel
    this.setInitialFocus(panel);
    
    // Store for restoration
    panel.dataset.lastFocused = lastFocused?.id;
  }
  
  // Restore focus when panel closes
  restoreFocus(panel: HTMLElement): void {
    const lastFocusedId = panel.dataset.lastFocused;
    if (lastFocusedId) {
      const element = document.getElementById(lastFocusedId);
      element?.focus();
    }
  }
}
```

## Keyboard Navigation System

```typescript
// Keyboard Navigation Implementation
const handlePanelKeyboard = (event: KeyboardEvent): void => {
  switch(event.key) {
    case 'ArrowRight':
      moveFocusToNextPanel();
      break;
    case 'ArrowLeft':
      moveFocusToPreviousPanel();
      break;
    case 'Escape':
      closeActivePanel();
      break;
    case 'F6':
      // Common shortcut for moving between panels
      togglePanelFocus();
      break;
  }
};
```

## Accessibility Enhancements

```typescript
// Accessibility Implementation
interface AccessiblePanel {
  // ARIA attributes
  setAriaAttributes(panel: HTMLElement): void {
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'Panel content');
    panel.setAttribute('tabindex', '-1');
  }
  
  // Focus announcement
  announceForScreenReader(message: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.textContent = message;
    // Clean up after announcement
    setTimeout(() => announcement.remove(), 1000);
  }
}
```

## Focus Management Best Practices

1. **Focus Trapping**
   - Contain focus within active panels
   - Prevent focus from leaving modal dialogs
   - Handle edge cases (first/last focusable elements)

2. **Focus Restoration**
   - Save focus state before panel switches
   - Restore focus when returning to previous panel
   - Handle focus history for nested panels

3. **Focus Indicators**
   - Provide visible focus indicators
   - Support high contrast modes
   - Maintain consistent focus styles

4. **Focus Order**
   - Match visual layout with tab order
   - Ensure logical navigation flow
   - Support both LTR and RTL layouts

5. **Keyboard Shortcuts**
   - `Tab`: Navigate between focusable elements
   - `Shift + Tab`: Reverse navigation
   - `Arrow Keys`: Navigate between panels
   - `Escape`: Close active panel/dialog
   - `F6`: Toggle between major UI sections

6. **Screen Reader Support**
   - Announce panel changes
   - Provide meaningful labels
   - Support ARIA landmarks
   - Include skip links for navigation

## Implementation Guidelines

1. Use `tabindex="0"` for interactive panels
2. Maintain focus history stack for nested navigation
3. Provide clear visual indicators for focused elements
4. Support both mouse and keyboard interactions
5. Implement consistent keyboard shortcuts
6. Handle focus for dynamic content updates
7. Test with screen readers and keyboard navigation

This focus management system ensures:
- Efficient keyboard navigation
- Improved accessibility compliance
- Better user experience for all users
- Consistent behavior across different panels
- Proper support for assistive technologies

# Redux Integration with Focus Management

Focus management can be effectively integrated with Redux to maintain a single source of truth for focus state across the application. This approach provides predictable focus behavior and enables features like focus history and state persistence.

## Focus State Management

```typescript
// Focus State Types
interface FocusState {
  activePanelId: string | null;
  focusHistory: string[];
  lastFocusedElements: Record<string, string>;
  trapFocusEnabled: boolean;
}

// Focus Slice
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const focusSlice = createSlice({
  name: 'focus',
  initialState: {
    activePanelId: null,
    focusHistory: [],
    lastFocusedElements: {},
    trapFocusEnabled: true
  } as FocusState,
  reducers: {
    setActivePanel: (state, action: PayloadAction<string>) => {
      state.focusHistory.push(state.activePanelId!);
      state.activePanelId = action.payload;
    },
    setLastFocusedElement: (state, action: PayloadAction<{panelId: string, elementId: string}>) => {
      state.lastFocusedElements[action.payload.panelId] = action.payload.elementId;
    },
    popFocusHistory: (state) => {
      state.activePanelId = state.focusHistory.pop() ?? null;
    },
    toggleTrapFocus: (state) => {
      state.trapFocusEnabled = !state.trapFocusEnabled;
    }
  }
});
```

## Focus Management Middleware

```typescript
// Focus Management Middleware
const focusMiddleware: Middleware = store => next => action => {
  const result = next(action);
  const state = store.getState();
  
  // Handle focus changes based on actions
  if (focusSlice.actions.setActivePanel.match(action)) {
    const panelElement = document.getElementById(action.payload);
    const lastFocusedId = state.focus.lastFocusedElements[action.payload];
    
    if (panelElement) {
      if (lastFocusedId) {
        // Restore last focused element
        const element = panelElement.querySelector(`#${lastFocusedId}`);
        (element as HTMLElement)?.focus();
      } else {
        // Focus first focusable element
        const firstFocusable = getFocusableElements(panelElement)[0];
        firstFocusable?.focus();
      }
    }
  }
  
  return result;
};
```

## Focus-Aware Components

```typescript
// Focus-Aware Panel Component
interface FocusAwarePanelProps {
  id: string;
  children: React.ReactNode;
}

const FocusAwarePanel: React.FC<FocusAwarePanelProps> = ({ id, children }) => {
  const dispatch = useDispatch();
  const activePanelId = useSelector((state: RootState) => state.focus.activePanelId);
  const trapFocusEnabled = useSelector((state: RootState) => state.focus.trapFocusEnabled);
  
  // Handle focus events
  const handleFocus = (e: FocusEvent) => {
    if (e.target instanceof HTMLElement) {
      dispatch(focusSlice.actions.setLastFocusedElement({
        panelId: id,
        elementId: e.target.id
      }));
    }
  };
  
  // Set up focus trapping
  useEffect(() => {
    const panel = document.getElementById(id);
    if (panel && trapFocusEnabled && activePanelId === id) {
      const cleanup = setupFocusTrap(panel);
      return cleanup;
    }
  }, [id, trapFocusEnabled, activePanelId]);
  
  return (
    <div 
      id={id}
      role="region"
      onFocus={handleFocus}
      tabIndex={-1}
      aria-label={`Panel ${id}`}
    >
      {children}
    </div>
  );
};
```

## Focus Management Hooks

```typescript
// Custom Focus Management Hooks
const usePanelFocus = (panelId: string) => {
  const dispatch = useDispatch();
  const activePanelId = useSelector((state: RootState) => state.focus.activePanelId);
  
  const activatePanel = useCallback(() => {
    dispatch(focusSlice.actions.setActivePanel(panelId));
  }, [dispatch, panelId]);
  
  const deactivatePanel = useCallback(() => {
    dispatch(focusSlice.actions.popFocusHistory());
  }, [dispatch]);
  
  return {
    isActive: activePanelId === panelId,
    activatePanel,
    deactivatePanel
  };
};

// Focus History Hook
const useFocusHistory = () => {
  const focusHistory = useSelector((state: RootState) => state.focus.focusHistory);
  const dispatch = useDispatch();
  
  const goBack = useCallback(() => {
    if (focusHistory.length > 0) {
      dispatch(focusSlice.actions.popFocusHistory());
    }
  }, [dispatch, focusHistory.length]);
  
  return { focusHistory, goBack };
};
```

## Focus State Persistence

```typescript
// Focus State Persistence
const persistFocusState = (state: FocusState) => {
  localStorage.setItem('focusState', JSON.stringify({
    activePanelId: state.activePanelId,
    lastFocusedElements: state.lastFocusedElements
  }));
};

const loadPersistedFocusState = (): Partial<FocusState> => {
  const saved = localStorage.getItem('focusState');
  return saved ? JSON.parse(saved) : {};
};
```

## Usage Example

```typescript
// Application Setup
const store = configureStore({
  reducer: {
    focus: focusSlice.reducer,
    // ... other reducers
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(focusMiddleware),
  preloadedState: {
    focus: {
      ...initialFocusState,
      ...loadPersistedFocusState()
    }
  }
});

// Panel Implementation
const MediaPanel: React.FC = () => {
  const { isActive, activatePanel } = usePanelFocus('media-panel');
  
  return (
    <FocusAwarePanel id="media-panel">
      <button onClick={activatePanel}>
        Activate Media Panel
      </button>
      {/* Panel content */}
    </FocusAwarePanel>
  );
};
```

This Redux integration provides several benefits:
- Centralized focus state management
- Predictable focus behavior
- Focus history tracking
- State persistence
- Reusable focus management hooks
- Type-safe focus operations
- Testable focus logic

The system can be extended to support:
- Complex focus patterns
- Multi-window applications
- Nested focus contexts
- Focus-based animations
- A11y announcements
- Keyboard shortcuts

# Drag and Drop Integration

This section outlines the implementation of drag and drop functionality within our panel system, focusing on Redux integration and composability patterns.

## Framework Selection and Integration

### 1. Recommended Libraries

```typescript
// Popular DnD Libraries and Their Use Cases
interface DnDFramework {
  name: string;
  bestFor: string[];
  reduxIntegration: string;
}

const dndFrameworks: DnDFramework[] = [
  {
    name: 'react-dnd',
    bestFor: [
      'Complex drag and drop interactions',
      'Custom drag previews',
      'Multiple drop targets',
      'Redux integration via monitors'
    ],
    reduxIntegration: 'Direct middleware support'
  },
  {
    name: '@dnd-kit/core',
    bestFor: [
      'Modern, lightweight implementation',
      'Accessible by default',
      'Touch devices support',
      'Virtualized lists'
    ],
    reduxIntegration: 'Via custom sensors'
  },
  {
    name: 'react-beautiful-dnd',
    bestFor: [
      'List and grid reordering',
      'Natural dropping animations',
      'Screen reader support',
      'Touch screen support'
    ],
    reduxIntegration: 'Through state updates'
  }
];
```

## Redux DnD State Management

```typescript
// DnD State Types
interface DragState {
  isDragging: boolean;
  sourceId: string | null;
  targetId: string | null;
  itemType: string | null;
  item: any;
  position: { x: number; y: number } | null;
}

// DnD Slice
const dndSlice = createSlice({
  name: 'dnd',
  initialState: {
    isDragging: false,
    sourceId: null,
    targetId: null,
    itemType: null,
    item: null,
    position: null
  } as DragState,
  reducers: {
    dragStart: (state, action: PayloadAction<{
      sourceId: string;
      itemType: string;
      item: any;
    }>) => {
      state.isDragging = true;
      state.sourceId = action.payload.sourceId;
      state.itemType = action.payload.itemType;
      state.item = action.payload.item;
    },
    dragOver: (state, action: PayloadAction<{
      targetId: string;
      position: { x: number; y: number };
    }>) => {
      state.targetId = action.payload.targetId;
      state.position = action.payload.position;
    },
    dragEnd: (state) => {
      return {
        isDragging: false,
        sourceId: null,
        targetId: null,
        itemType: null,
        item: null,
        position: null
      };
    }
  }
});
```

## Composable DnD Components

```typescript
// Draggable Panel Component
interface DraggablePanelProps extends FocusAwarePanelProps {
  dragType: string;
  dragData: any;
}

const DraggablePanel: React.FC<DraggablePanelProps> = ({
  id,
  children,
  dragType,
  dragData
}) => {
  const dispatch = useDispatch();
  const { isDragging } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging()
  }));

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
    }),
    end: () => dispatch(dndSlice.actions.dragEnd())
  });

  return (
    <FocusAwarePanel id={id}>
      <div ref={dragRef} style={{ opacity }}>
        {children}
      </div>
    </FocusAwarePanel>
  );
};

// Droppable Zone Component
interface DroppableZoneProps {
  id: string;
  acceptTypes: string[];
  onDrop: (item: any) => void;
}

const DroppableZone: React.FC<DroppableZoneProps> = ({
  id,
  acceptTypes,
  onDrop,
  children
}) => {
  const dispatch = useDispatch();
  
  const [{ isOver }, dropRef] = useDrop({
    accept: acceptTypes,
    drop: (item: any) => {
      onDrop(item);
      dispatch(dndSlice.actions.dragEnd());
    },
    hover: (item: any, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (clientOffset) {
        dispatch(dndSlice.actions.dragOver({
          targetId: id,
          position: clientOffset
        }));
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  return (
    <div 
      ref={dropRef}
      style={{ 
        backgroundColor: isOver ? 'rgba(0,0,0,0.1)' : 'transparent'
      }}
    >
      {children}
    </div>
  );
};
```

## Panel Composition with DnD

```typescript
// Composable Panel Layout with DnD
const DraggablePanelLayout: React.FC = () => {
  const dispatch = useDispatch();
  
  const handlePanelDrop = (source: string, target: string) => {
    dispatch(panelActions.swapPanels({ source, target }));
  };

  return (
    <PanelGroupLayout>
      <DraggablePanel
        id="media-panel"
        dragType="PANEL"
        dragData={{ type: 'media' }}
      >
        <DroppableZone
          id="media-drop"
          acceptTypes={['PANEL']}
          onDrop={(item) => handlePanelDrop(item.id, 'media-panel')}
        >
          <MediaContent />
        </DroppableZone>
      </DraggablePanel>
      
      <DraggablePanel
        id="chat-panel"
        dragType="PANEL"
        dragData={{ type: 'chat' }}
      >
        <DroppableZone
          id="chat-drop"
          acceptTypes={['PANEL']}
          onDrop={(item) => handlePanelDrop(item.id, 'chat-panel')}
        >
          <ChatContent />
        </DroppableZone>
      </DraggablePanel>
    </PanelGroupLayout>
  );
};
```

## DnD Performance Optimizations

```typescript
// Optimized DnD Monitoring
const useDragMonitor = (panelId: string) => {
  const isDragging = useSelector((state: RootState) => 
    state.dnd.isDragging && state.dnd.sourceId === panelId
  );
  
  const isOver = useSelector((state: RootState) =>
    state.dnd.targetId === panelId
  );
  
  return { isDragging, isOver };
};

// Memoized Drag Preview
const DragPreview: React.FC<{ content: React.ReactNode }> = memo(
  ({ content }) => (
    <div className="drag-preview">
      {content}
    </div>
  ),
  (prev, next) => prev.content === next.content
);
```

## Composability Guidelines

1. **Panel Independence**
   - Panels should be self-contained drag sources
   - Drop zones should be independent of panel content
   - Use composition over inheritance for DnD behavior

2. **State Management**
   - Keep drag state in Redux for global access
   - Use local state for UI feedback
   - Maintain clear separation between DnD and panel state

3. **Event Handling**
   - Implement drag events at panel level
   - Handle drops through Redux actions
   - Use middleware for complex DnD logic

4. **Performance**
   - Memoize drag previews
   - Use selective rendering for drag feedback
   - Optimize drop zone updates

## Framework-Specific Considerations

1. **react-dnd**
   ```typescript
   // Custom Monitor
   const usePanelDragMonitor = () => {
     const collected = useDragLayer((monitor) => ({
       isDragging: monitor.isDragging(),
       currentOffset: monitor.getSourceClientOffset(),
       item: monitor.getItem()
     }));
     return collected;
   };
   ```

2. **@dnd-kit/core**
   ```typescript
   // Custom Sensor
   const usePanelSensor = () => {
     const sensors = useSensors(
       useSensor(PointerSensor),
       useSensor(KeyboardSensor, {
         coordinateGetter: sortableKeyboardCoordinates
       })
     );
     return sensors;
   };
   ```

3. **react-beautiful-dnd**
   ```typescript
   // Droppable Configuration
   const getPanelDroppableConfig = (panelId: string) => ({
     droppableId: panelId,
     type: 'PANEL',
     direction: 'horizontal',
     mode: 'standard'
   });
   ```

These patterns ensure:
- Clean separation of concerns
- Predictable state management
- Optimal performance
- Accessibility compliance
- Touch device support
- Flexible composition
- Type safety

# Naming Convention System
Structural Pattern
Copy

[Position][Function]Panel

    Position: Center|Left|Right|Top|Bottom

    Function: Workspace|Chat|Assets|Tools

Examples:

    CenterWorkspacePanel

    RightChatPanel

    LeftAssetsPanel

Layout Patterns
Collaborative Editing Layout
Copy

+--+----------------------------------------------------------+
| S |                         Top_Banner                      |
| i |------------------+-------------------+------------------+
| d | Asset_Navigator  |                   |                  |
| e | (List of assets) |     Workspace     | Action_History   |
| b |                  |                   |                  |
| a |                  |                   |                  |
| r |                  |                   |                  |
+---|------------------+-------------------+------------------+

Mobile-Optimized Layout
Copy

+------------------------------+
| [Collapsed] Asset Navigator  |
+------------------------------+
|         Workspace            |
+------------------------------+
|  Contextual Chat Drawer      |
+------------------------------+

Presentation Mode
Copy

+-----------------------------------------+
|               Workspace                 |
|           (Fullscreen Media)            |
+-----------------------------------------+
| Floating Collaborative Tools & Comments |
+-----------------------------------------+

# Key Features
Multimedia Specific

    Smart Preview System

        Adaptive viewer for 100+ file types

        3D model manipulation controls

        Video frame-accurate commenting

    Conversation Integration

        Click-to-reference media regions

        Automatic version snapshots in chat

        Shared annotation canvas

    Unified Asset Management

        Drag-drop between panels

        Visual search powered by ML

        Bulk metadata editing

# Implementation Strategy
Core Requirements

    Real-Time Sync

        Operational transforms for collaborative editing

        WebSocket-based chat system

        Media change delta compression

    Adaptive Rendering

        Media-type specific viewers/components

        GPU-accelerated previews

        Progressive loading for large files

    Contextual UI

        Auto-switching tools per media type

        Chat suggestion engine (ML-powered)

        Dynamic keyboard shortcuts

# Component Ecosystem
Base Components

    MediaWorkspace

        Handles all content types

        Manages zoom/pan states

        Collaboration cursors

    ConversationPanel

        Threaded comments

        Annotation linking

        @mention system

    AssetNavigator

        Unified search

        Visual browsing

        Collection management

    ContextToolbar

        Auto-context tools

        Quick AI actions

        Session controls

# Workflow Examples

    Video Review Session

        Left: Asset browser with video versions

        Center: Video player with frame markers

        Right: Timecoded comments & annotations

        Bottom: Collaborative trimming tools

    3D Model Collaboration

        Center: Interactive 3D viewer

        Right: Measurement tools & chat

        Left: Model component tree

        Floating: VR/AR preview controls

    Document + Media Discussion

        Center: Hybrid document editor

        Right: Inline media comments

        Bottom: Asset reference pool

        Floating: AI research assistant

This system provides a foundation for building collaborative multimedia applications while maintaining flexibility for different use cases and content types. The panel architecture allows for context-aware reorganization while preserving consistent interaction patterns across media formats.