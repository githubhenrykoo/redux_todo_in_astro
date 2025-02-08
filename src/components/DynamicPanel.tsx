import React, { Suspense } from 'react';
import { IslandFactory } from './factories/IslandFactory';

interface DynamicPanelProps {
  panelType: string;
  slot: string;
  sliceName: string;
  props?: Record<string, any>;
}

export function DynamicPanel({ panelType, slot, sliceName, props = {} }: DynamicPanelProps) {
  const renderPanel = () => {
    const Component = React.lazy(() => 
      import(`./panels/${panelType}.jsx`)
        .catch(() => import(`./panels/${panelType}.tsx`))
        .catch(() => {
          throw new Error(`No component found for panel type: ${panelType}`);
        })
    );

    return (
      <Suspense fallback={
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
      }>
        <IslandFactory
          client:load
          slot={slot}
          component={Component}
          sliceName={sliceName}
          hydration="load"
          {...props}
        />
      </Suspense>
    );
  };

  try {
    return renderPanel();
  } catch (error) {
    return (
      <div style={{ 
        padding: '1rem', 
        color: 'red', 
        backgroundColor: '#fee',
        border: '1px solid #fcc',
        borderRadius: '4px',
        margin: '0.5rem'
      }}>
        Error loading {panelType}: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }
}
