import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

interface IslandFactoryProps {
  component: React.ComponentType<any>;
  sliceName: string;
  hydration?: string;
  slot?: string;
  [key: string]: any;
}

export function IslandFactory({ component: Component, sliceName, slot, ...props }: IslandFactoryProps) {
  console.log(`[IslandFactory] Rendering for slice: ${sliceName}, slot: ${slot}, component:`, Component?.name);
  
  if (!Component) {
    console.error('[IslandFactory] No component provided!');
    return null;
  }

  // Create a store for this island
  const store = configureStore({
    reducer: {
      [sliceName]: (state = {}, action) => state // Placeholder reducer
    }
  });

  try {
    return (
      <Provider store={store}>
        <div data-slice={sliceName} data-slot={slot} style={{ height: '100%' }}>
          <Component {...props} />
        </div>
      </Provider>
    );
  } catch (error) {
    console.error('[IslandFactory] Error rendering component:', error);
    return (
      <div style={{ 
        padding: '1rem', 
        color: 'red', 
        backgroundColor: '#fee',
        border: '1px solid #fcc',
        borderRadius: '4px',
        margin: '0.5rem'
      }}>
        Error rendering component: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }
}
