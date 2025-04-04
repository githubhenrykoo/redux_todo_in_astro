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
      // Try both .tsx and .jsx extensions
      Promise.any([
        import(`./panels/${panelType}.tsx`).then(module => {
          console.log(`Successfully loaded .tsx component for: ${panelType}`);
          return { default: module.default || module[panelType] };
        }),
        import(`./panels/${panelType}.jsx`).then(module => {
          console.log(`Successfully loaded .jsx component for: ${panelType}`);
          return { default: module.default || module[panelType] };
        })
      ]).catch((error) => {
        console.error(`Failed to load component for panel type: ${panelType}`, error);
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
    console.error(`Error rendering panel ${panelType}:`, error);
    return (
      <div style={{ 
        padding: '1rem', 
        color: 'red', 
        backgroundColor: '#fee',
        border: '1px solid #fcc',
        borderRadius: '4px',
        margin: '0.5rem'
      }}>
        Error rendering panel: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }
}
