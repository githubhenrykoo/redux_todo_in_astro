import React, { useEffect, useState } from 'react';
import { getPanelLoader } from '../config/panelRegistry';
import { IslandFactory } from './factories/IslandFactory';
import { DemoLeftPanel } from './panels/DemoLeftPanel';
import { DemoMainPanel } from './panels/DemoMainPanel';
import { DemoRightPanel } from './panels/DemoRightPanel';
import { ContentDetail } from './panels/ContentDetail';

interface DynamicPanelProps {
  panelType: string;
  slot: string;
  sliceName: string;
  props?: Record<string, any>;
}

// Direct component mapping for debugging
const componentMap = {
  DemoLeftPanel,
  DemoMainPanel,
  DemoRightPanel,
  ContentDetail
};

export function DynamicPanel({ panelType, slot, sliceName, props = {} }: DynamicPanelProps) {
  console.log(`[DynamicPanel] Initial render for ${panelType}, available components:`, Object.keys(componentMap));
  
  // Try direct component loading first
  const DirectComponent = componentMap[panelType as keyof typeof componentMap];
  console.log(`[DynamicPanel] Direct component for ${panelType}:`, DirectComponent);

  if (DirectComponent) {
    console.log(`[DynamicPanel] Rendering direct component for ${panelType}`);
    return (
      <IslandFactory
        client:load
        slot={slot}
        component={DirectComponent}
        sliceName={sliceName}
        hydration="load"
        {...props}
      />
    );
  }

  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    console.log(`[DynamicPanel] useEffect running for ${panelType}`);

    async function loadComponent() {
      try {
        console.log(`[DynamicPanel] Getting component for ${panelType}`);
        const component = getPanelLoader(panelType);
        
        if (!component) {
          throw new Error(`No component found for panel type: ${panelType}`);
        }

        console.log(`[DynamicPanel] Got component for ${panelType}:`, component);
        
        if (mounted) {
          console.log(`[DynamicPanel] Setting component for ${panelType}`);
          setComponent(() => component);
          console.log(`[DynamicPanel] Component set for ${panelType}`);
        }
      } catch (err) {
        console.error(`[DynamicPanel] Error loading ${panelType}:`, err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error loading component');
        }
      }
    }

    loadComponent();

    return () => {
      mounted = false;
    };
  }, [panelType]);

  console.log(`[DynamicPanel] Render state for ${panelType}:`, { 
    hasComponent: !!Component, 
    componentType: Component?.name,
    error 
  });

  if (error) {
    return (
      <div style={{ 
        padding: '1rem', 
        color: 'red', 
        backgroundColor: '#fee',
        border: '1px solid #fcc',
        borderRadius: '4px',
        margin: '0.5rem'
      }}>
        Error loading {panelType}: {error}
      </div>
    );
  }

  if (!Component) {
    return (
      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '4px',
        margin: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        Loading {panelType}...
      </div>
    );
  }

  console.log(`[DynamicPanel] Rendering IslandFactory for ${panelType}`);
  return (
    <IslandFactory
      client:load
      slot={slot}
      component={Component}
      sliceName={sliceName}
      hydration="load"
      {...props}
    />
  );
}
