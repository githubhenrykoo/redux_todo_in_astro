---
modified: 2025-02-08T09:15:35+08:00
created: 2025-02-08T08:56:50+08:00
title: slot in Astro
subject: slot, Islands Architecture, reusability, MVC, Astro Islands
authors: ChatGPT
---

# Understanding Astro Slots

## Overview

Slots are foundational to Astro's Islands Architecture, serving as the bridge between static HTML and interactive JavaScript components. They enable component composition through content projection, allowing you to create isolated "islands" of interactivity within static content.

## Core Concepts

### 1. Basic Slot Usage

#### Default Slots
The simplest form of slot usage:

```astro
// Component Definition
<div class="wrapper">
  <slot /> <!-- Default slot -->
</div>

// Usage
<Component>
  <p>Content automatically goes to default slot</p>
</Component>
```

#### Named Slots
For more complex layouts with multiple content areas:

```astro
// src/layouts/IslandLayout.astro
---
import { IslandFactory } from '../components/factories/IslandFactory';
import { PanelController } from '../components/panels/PanelSystem';
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

// Usage in pages
<IslandLayout>
  <h1 slot="header">Dashboard</h1>
  <AnalyticsPanel slot="content" />
  <ControlPanel slot="controls" />
</IslandLayout>
```

### 2. Slots with Redux Integration

Slots play a crucial role when integrating Redux with Astro components:

```typescript
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

### 3. Advanced Patterns

#### Compound Components with Slots
Using slots in a compound component system:

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

// Usage with slots
export function PanelController() {
  const { panels, handlers } = usePanelLogic();
  
  return (
    <PanelSystem>
      <PanelSystem.Header>
        <slot name="header" />
      </PanelSystem.Header>
      <PanelSystem.Content>
        <slot name="content" />
      </PanelSystem.Content>
    </PanelSystem>
  );
}
```

## Hydration Strategies

### 1. Priority-based Hydration

```astro
// Critical components that need immediate interactivity
<IslandFactory 
  component={CriticalComponent}
  sliceName="critical"
  hydration="load" 
/>

// Background components that can wait
<IslandFactory
  component={BackgroundComponent}
  sliceName="background"
  hydration="idle"
/>

// Components that only hydrate when visible
<IslandFactory
  component={LazyComponent}
  sliceName="lazy"
  hydration="visible"
/>
```

### 2. Performance Optimization

```typescript
// src/lib/optimization.ts
export const lazyIsland = (component: string, slice: keyof RootState) =>
  lazy(() => import(`../components/${component}`).then(mod => ({
    default: createIsland(mod.default, slice)
  })));
```

## Best Practices

1. **Architectural Principles**
   - **Isolated State**: Each React Island should manage its own Redux slice
   - **Clear Boundaries**: Use slots to separate static and interactive content
   - **Type Safety**: Leverage TypeScript for component interfaces

2. **Performance**
   - Group related interactive content in the same island
   - Use appropriate hydration strategies based on content priority
   - Implement lazy loading for non-critical components

3. **Component Design**
   - Keep slot structures shallow and intuitive
   - Use descriptive names for slots
   - Provide fallback content where appropriate
   - Document expected slot content and behavior

## Common Patterns

1. **Layout Composition**
```astro
// src/layouts/AppLayout.astro
<div class="app-layout">
  <slot name="navigation" />
  <main>
    <slot name="content" />
  </main>
  <slot name="sidebar" />
</div>
```

2. **Interactive Islands**
```astro
<AppLayout>
  <StaticNav slot="navigation" />
  <ReduxIsland slot="content" client:load />
  <WidgetPanel slot="sidebar" client:visible />
</AppLayout>
```

## Related Concepts

- [Astro Islands Architecture](https://docs.astro.build/en/concepts/islands/)
- [Partial Hydration](https://docs.astro.build/en/concepts/partial-hydration/)
- [Redux Integration](./AstroSlotAndRedux.md)

# References
```dataview 
Table title as Title, authors as Authors
where contains(subject, "slot")
sort title, authors, modified
```