# Resizable Panel Implementation Plan

## Overview

This implementation provides a flexible three-panel system using `react-resizable-panels` for robust resizing capabilities, combined with Astro's Islands architecture for component hydration. The system is built on four main components:
1. A React-based resizable panel component
2. A dynamic panel loader for flexible component management
3. An Astro layout for the overall page structure
4. Island-based component hydration for optimal performance

## 1. Core Components

### 1.1 ResizablePanel Component (ResizablePanel.tsx)
```typescript
interface ResizablePanelProps {
  panelCount?: number;
  useDefaultContent?: boolean;
}

const DEFAULT_COMPONENTS = ['SearchAndTodos', 'DemoMainPanel', 'DemoRightPanel'];

export default function ResizablePanel({ 
  panelCount = DEFAULT_COMPONENTS.length,
  useDefaultContent = true,
}: ResizablePanelProps) {
  const onLayout = (sizes: number[]) => {
    console.log('Layout changed:', sizes);
  };

  const generatePanels = (count: number) => {
    const defaultSize = Math.floor(100 / count);
    
    return Array(count).fill(0).map((_, index) => ({
      id: `panel-${index + 1}`,
      defaultSize: defaultSize,
      minSize: 10,
      maxSize: 90,
      defaultComponent: DEFAULT_COMPONENTS[index] || `Panel${index + 1}`,
      sliceName: `panel-${index + 1}`,
    }));
  };
}
```

Key features:
- Configuration-driven panel system
- Built on react-resizable-panels for reliable resizing
- Dynamic component loading through DynamicPanel
- Configurable panel sizes and constraints
- Smooth resize animations with visual feedback
- **Dynamic panel count based on `panelCount` and `DEFAULT_COMPONENTS`**

### 1.2 DynamicPanel Component (DynamicPanel.tsx)
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

### 1.3 Layout System (ResizablePanelLayout2.astro)
```typescript
interface Props {
  leftPanelType?: string;
  mainPanelType?: string;
  rightPanelType?: string;
  leftProps?: Record<string, any>;
  mainProps?: Record<string, any>;
  rightProps?: Record<string, any>;
}
```

Key features:
- Flexible header and footer slots
- Responsive layout structure
- CSS-based panel organization
- Clean separation of layout and content

### 1.4 Panel Registry System
```typescript
// panelRegistry.ts
const panelLoaders: Record<string, () => Promise<any>> = {
  DemoLeftPanel: () => import('./panels/DemoLeftPanel'),
  DemoMainPanel: () => import('./panels/DemoMainPanel'),
  DemoRightPanel: () => import('./panels/DemoRightPanel'),
};

export const getPanelLoader = (panelType: string) => panelLoaders[panelType];
```

Key features:
- Centralized panel registration
- Lazy loading support
- Easy panel addition and removal
- Type-safe panel loading

## 2. Implementation Details

### 2.1 Panel Layout Structure

The panel system uses a configuration-driven approach:
```typescript
const PANEL_CONFIG = generatePanels(panelCount);
```

Dynamic panel rendering:
```tsx
<PanelGroup direction="horizontal" onLayout={onLayout} style={styles.panelGroup}>
  {PANEL_CONFIG.map((config, index) => (
    <React.Fragment key={config.id}>
      <Panel
        defaultSize={config.defaultSize}
        minSize={config.minSize}
        maxSize={config.maxSize}
        style={styles.panel}
      >
        <DynamicPanel
          panelType={useDefaultContent ? config.defaultComponent : getCustomComponent(config.id) || config.defaultComponent}
          slot={config.id}
          sliceName={config.sliceName}
          props={getProps(config.id)}
        />
      </Panel>
      {index < PANEL_CONFIG.length - 1 && <PanelResizeHandle style={styles.resizeHandle} />}
    </React.Fragment>
  ))}
</PanelGroup>
```

### 2.2 Page Layout Structure
```astro
<div class="app-layout">
  <header class="app-header">
    <slot name="header">
      <h1>Three Panel Layout</h1>
    </slot>
  </header>

  <main class="app-content">
    <ResizablePanel
      client:load
      panelCount={panelCount}
      useDefaultContent={useDefaultContent}
    />
  </main>

  <footer class="app-footer">
    <slot name="footer">
      <p>&copy; 2025 Panel Layout Demo</p>
    </slot>
  </footer>
</div>
```

## 3. Usage Examples

### 3.1 Basic Usage with Default Content
```astro
<ResizablePanelLayout>
  <ResizablePanel client:only="react" useDefaultContent={true} />
</ResizablePanelLayout>
```

### 3.2 Custom Panel Types Usage
```astro
<ResizablePanelLayout>
  <ResizablePanel 
    client:only="react"
    useDefaultContent={false}
    panelCount={3}
  />
</ResizablePanelLayout>
```

## 4. Styling System

### 4.1 Layout Styles
```css
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.app-content {
  flex: 1;
  min-height: 0;
  position: relative;
}
```

### 4.2 Panel Styles
```css
.panel {
  height: 100%;
  background-color: #f0f0f0;
}

.resize-handle {
  width: 4px;
  background-color: #ddd;
  cursor: col-resize;
}
```

## 5. Future Enhancements

1. **Dynamic Loading Features**
   - Preloading strategies
   - Loading priority system
   - Caching mechanisms
   - Fallback component system

2. **Panel Features**
   - Panel collapse/expand
   - Panel state persistence
   - Dynamic panel addition/removal
   - Panel configuration presets

3. **Layout Features**
   - Additional layout templates
   - Nested panel support
   - Responsive breakpoints
   - Layout state persistence

4. **Performance**
   - Optimized component loading
   - Bundle size optimization
   - Selective hydration
   - Performance monitoring

5. **Accessibility**
   - Keyboard navigation
   - Screen reader support
   - ARIA attributes
   - Focus management
