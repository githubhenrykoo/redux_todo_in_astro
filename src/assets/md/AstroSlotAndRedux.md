# Advanced Redux Integration with Astro Slots

[Slots](./slot.md) are foundational to Astro's Islands Architecture, serving as the bridge between static HTML and interactive JavaScript components. In Astro, a slot is a template feature that enables component composition by defining specific insertion points where content can be dynamically injected. This is particularly crucial in the Islands Architecture, where we need to carefully manage the boundary between static and interactive content. Slots allow us to create isolated "islands" of interactivity (React components with Redux state) within a sea of static content, ensuring that JavaScript is only loaded for components that truly need it. By leveraging slots, we can maintain a clear separation between the static layout structure and dynamic React components, enabling efficient partial hydration and optimal performance.

## Architectural Principles

1. **Isolated State Containers**: Each React Island manages its own Redux slice
2. **Slot Composition**: Astro handles layout structure, React manages interactivity
3. **Hydration Stratification**: Components hydrate based on priority and visibility
4. **Type-Safe Bridges**: TypeScript ensures type safety between Astro and React

## Core Implementation

### 1. Island Factory Pattern

```typescript
// src/patterns/createIsland.ts
import type { ComponentType } from 'react';
import type { RootState, AppDispatch } from '../store';

export function createIsland<T extends object>(
  Component: ComponentType<T>,
  sliceKey: keyof RootState
) {
  return (props: T) => {
    const sliceState = useSelector((state: RootState) => state[sliceKey]);
    const dispatch = useDispatch<AppDispatch>();
    
    return <Component {...props} state={sliceState} dispatch={dispatch} />;
  };
}

// src/components/factories/IslandFactory.tsx
interface IslandFactoryProps<T> {
  component: ComponentType<T>;
  sliceName: keyof RootState;
  hydration?: 'load' | 'idle' | 'visible';
}

export function IslandFactory<T extends object>({
  component,
  sliceName,
  hydration = 'idle'
}: IslandFactoryProps<T>) {
  const IslandComponent = createIsland(component, sliceName);
  
  return (
    <AstroIsland 
      client:only={hydration}
      component={IslandComponent} 
    />
  );
}
```

### 2. Compound Component System

```typescript
// src/components/panels/PanelSystem.tsx
export const PanelSystem = ({ children }) => {
  const [state, dispatch] = usePanelState();

  return (
    <PanelContext.Provider value={{ state, dispatch }}>
      <div className="panel-system">{children}</div>
    </PanelContext.Provider>
  );
};

PanelSystem.Header = ({ children }) => (
  <div className="panel-header">{children}</div>
);

PanelSystem.Content = ({ children }) => (
  <div className="panel-content">{children}</div>
);

// Usage in a feature component
export function PanelController() {
  const { panels, handlers } = usePanelLogic();
  
  return (
    <PanelSystem>
      <PanelSystem.Header>
        <PanelControls handlers={handlers} />
      </PanelSystem.Header>
      <PanelSystem.Content>
        {panels.map(panel => (
          <Panel key={panel.id} config={panel} />
        ))}
      </PanelSystem.Content>
    </PanelSystem>
  );
}

export const PanelIsland = createIsland(PanelController, 'panels');
```

### 3. Astro Integration

```astro
---
// src/layouts/IslandLayout.astro
import { IslandFactory } from '../components/factories/IslandFactory';
import { PanelController } from '../components/panels/PanelSystem';

const { slots } = Astro.props;
---

<IslandFactory 
  component={PanelController} 
  sliceName="panels"
  hydration="visible"
>
  <slot name="header" />
  <slot name="content" />
  <slot name="controls" />
</IslandFactory>

---
// Usage in pages
// src/pages/dashboard.astro
import IslandLayout from '../layouts/IslandLayout.astro';
---

<IslandLayout>
  <h1 slot="header">Dashboard</h1>
  <AnalyticsPanel slot="content" />
  <ControlPanel slot="controls" />
</IslandLayout>
```

## Understanding Slot Mechanics

### Slot Tag vs Slot Attribute

1. **`<slot name="header" />`** (Slot Tag)
   - Used in component templates to define insertion points
   - Acts as a placeholder where content will be injected
   - Defines where named content will appear in the layout
   - Part of the component's template structure

2. **`<h1 slot="header">Dashboard</h1>`** (Slot Attribute)
   - Used when consuming a component
   - Marks content to be inserted into a specific slot
   - Targets a named slot in the parent component
   - Directs content to the corresponding `<slot>` placeholder

Example of slot mechanics:

```astro
// src/layouts/SlotDemo.astro
---
// Component Definition
---
<div class="layout">
  <!-- Slot Tags: Define insertion points -->
  <header>
    <slot name="header" />  <!-- Placeholder for header content -->
  </header>
  <main>
    <slot name="content" /> <!-- Placeholder for main content -->
  </main>
  <footer>
    <slot name="footer" />  <!-- Placeholder for footer content -->
  </footer>
</div>

// src/pages/index.astro
---
import SlotDemo from '../layouts/SlotDemo.astro';
---
<SlotDemo>
  <!-- Slot Attributes: Target specific slots -->
  <h1 slot="header">Title</h1>        <!-- Goes to header slot -->
  <article slot="content">Text</article> <!-- Goes to content slot -->
  <p slot="footer">Footer</p>         <!-- Goes to footer slot -->
</SlotDemo>
```

### Flow of Content

```plaintext
Content with slot attribute → Matching slot tag in template
<h1 slot="header"> → <slot name="header" />
```

This pattern enables:
- Component composition with named sections
- Template reuse with flexible content injection
- Clear separation of layout and content

## Performance Optimization

```typescript
// src/lib/optimization.ts
export const lazyIsland = (component: string, slice: keyof RootState) =>
  lazy(() => import(`../components/${component}`).then(mod => ({
    default: createIsland(mod.default, slice)
  })));

// Usage with different hydration strategies
<IslandFactory component={CriticalComponent} hydration="load" />
<IslandFactory component={BackgroundComponent} hydration="idle" />
<IslandFactory component={LazyComponent} hydration="visible" />
```

## Best Practices

1. **State Management**
   - Colocate state with feature components
   - Use RTK Query for data fetching
   - Implement selectors for derived state

2. **Component Design**
   - Build self-contained islands
   - Use compound components for complex UIs
   - Implement lazy loading for heavy components

3. **Testing**
   ```typescript
   const mockStore = configureStore({
     reducer: { panels: panelReducer },
     preloadedState: { panels: mockPanelState }
   });

   const Wrapper = ({ children }) => (
     <Provider store={mockStore}>
       {children}
     </Provider>
   );
   ```

## References

- [Astro Islands](https://docs.astro.build/en/concepts/islands/)
- [Redux Toolkit](https://redux-toolkit.js.org)
- [React Patterns](https://reactpatterns.com)