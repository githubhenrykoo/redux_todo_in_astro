# Resizable Panel Implementation Plan 

## Overview

Current implementation provides a nested panel system using `react-resizable-panels` with alternating vertical/horizontal layouts, integrated with Astro's Island Architecture. The system consists of:
1. A React-based resizable panel component with recursive nested panel support
2. Dynamic panel loading through DynamicPanel and Island Factory
3. Configurable panel sizes and constraints
4. Alternating panel orientations based on depth
5. Independent resize handles for nested panels
6. Slot-based component rendering

## 1. Core Components

### 1.1 ResizablePanel Component (ResizablePanel.tsx)
```typescript
const DEFAULT_COMPONENTS = [
  'DemoMainPanel',
  ['SearchAndTodos',
    ['DemoLeftPanel', 'DemoRightPanel'], 
    ['DemoRightPanel', 'DemoRightPanel'],
    'DemoRightPanel'
  ], 
  'DemoRightPanel'
];

interface ResizablePanelProps {
  panelCount?: number;
  useDefaultContent?: boolean;
}

interface PanelConfig {
  id: string;
  defaultSize: number;
  minSize: number;
  maxSize: number;
  defaultComponent: string | (string | any[])[];
  sliceName: string;
}
```

Key features:
- Recursive nested panel rendering
- Alternating vertical/horizontal layout based on depth
- Dynamic panel sizing
- Configurable resize constraints
- Flexible component loading
- **Dynamic panel count based on `panelCount` and `DEFAULT_COMPONENTS`**
- Integration with Island Factory
- Slot-based component rendering

### 1.2 Island Factory Integration
```typescript
export const islands = {
  'DemoMainPanel': () => import('./panels/DemoMainPanel'),
  'SearchAndTodos': () => import('./panels/SearchAndTodos'),
  'DemoLeftPanel': () => import('./panels/DemoLeftPanel'),
  'DemoRightPanel': () => import('./panels/DemoRightPanel'),
};

// Usage in DynamicPanel
const Component = await islands[panelType]();
```
key features:
- Lazy loading of panel components
- Isolated component hydration
- Optimized client-side JavaScript
- Component-level partial hydration

interface SlotConfig {
  id: string;
  sliceName: string;
  props: Record<string, any>;
}

### 1.3 Slot System
```typescript
// Usage in DynamicPanel
<Component 
  slot={config.id}
  sliceName={config.sliceName}
  {...props}
/>
```
Key features:
- Named slot support
- Dynamic slot assignment
- Prop passing through slots
- Slot-based state management

### 1.4 DynamicPanel Component 
DynamicPanel Component
```typescript
interface DynamicPanelProps {
  panelType: string;
  slot: string;
  sliceName: string;
  props?: Record<string, any>;
}
```

Key features:
- Dynamic component loading
- Direct component mapping for debugging
- Async component loading with error handling
- Loading state management
- Error boundary protection

### 1.5 Styling System
```typescript
const styles = {
  panelContainer: {
    display: 'flex',
    height: '100%',
    width: '100%',
    backgroundColor: '#1a1a1a',
  },
  panel: {
    backgroundColor: '#2d2d2d',
    overflow: 'hidden',
  },
  resizeHandle: {
    width: '4px',
    backgroundColor: '#404040',
    cursor: 'col-resize',
  },
  verticalResizeHandle: {
    height: '4px',
    backgroundColor: '#404040',
    cursor: 'row-resize',
  }
}
 ```
 key features
- Root level uses horizontal layout
- Nested levels alternate between vertical and horizontal
- Each level maintains its own resize handles and size constraints
- Dynamic component loading through DynamicPanel

## 2. Current Features
### 2.1 Panel Layout Rendering Structure
```
const renderNestedPanel = (
  component: string | any[],
  config: PanelConfig,
  depth: number = 0
): React.ReactElement => {
  // Alternates between vertical and horizontal layouts
  const direction = depth % 2 === 0 ? "vertical" : "horizontal";
  // ... panel rendering logic
}
```
### 2.2 Panel Layout Structure
1. Panel System 
   - Recursive nested panel support
   - Dynamic panel creation
   - Independent resize handles
   - Configurable panel sizes
2. Layout Management
   - Depth-based direction switching
   - Automatic size distribution
   - Nested component rendering
   - Flexible panel configuration
3. Component Loading
   - Dynamic component loading
   - Nested component support
   - Slot-based rendering
   - Configuration-driven setup


