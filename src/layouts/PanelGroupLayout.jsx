import React, { Suspense, lazy } from 'react';
import { Provider, useSelector } from 'react-redux';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { store } from '../store';

// Map of panel types to their components
const panelComponents = {
  // Special case components can be added here
};

// Create a client-only wrapper for xterm
const ClientOnly = ({ children, fallback = <div>Loading...</div> }) => {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  return mounted ? children : fallback;
};

const PanelContent = () => {
  const { panels } = useSelector(state => state.panellayout);
  if (!panels) return <div>Loading panels...</div>;

  const renderPanel = (config) => {
    // Special handling for xterm
    if (config.type === 'xterm') {
      return (
        <ClientOnly fallback={<div className="flex items-center justify-center h-full">Loading terminal...</div>}>
          <Suspense fallback={<div className="flex items-center justify-center h-full">Initializing terminal...</div>}>
            {React.createElement(React.lazy(() => import('../components/panels/xterm.jsx')))}
          </Suspense>
        </ClientOnly>
      );
    }
    
    // First check if we have a direct component mapping
    if (panelComponents[config.type]) {
      const Component = panelComponents[config.type];
      return (
        <Suspense fallback={<div className="flex items-center justify-center h-full">Loading {config.type}...</div>}>
          <Component />
        </Suspense>
      );
    }
    
    // Try both .tsx and .jsx extensions
    const Component = React.lazy(() => 
      Promise.any([
        import(`../components/panels/${config.type}.tsx`).then(module => {
          console.log(`Successfully loaded .tsx component for: ${config.type}`);
          return { default: module.default };
        }).catch(err => {
          console.log(`Failed to load .tsx for ${config.type}:`, err);
          throw err;
        }),
        import(`../components/panels/${config.type}.jsx`).then(module => {
          console.log(`Successfully loaded .jsx component for: ${config.type}`);
          return { default: module.default };
        }).catch(err => {
          console.log(`Failed to load .jsx for ${config.type}:`, err);
          throw err;
        })
      ]).catch((error) => {
        console.error(`Failed to load component for panel type: ${config.type}`, error);
        throw new Error(`No component found for panel type: ${config.type}`);
      })
    );
    
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-full">Loading panel...</div>}>
        <Component />
      </Suspense>
    );
  };

  return (
    <div className="h-full w-full overflow-hidden">
      <PanelGroup direction="horizontal" className="h-full">
        <Panel defaultSize={panels.left.size} minSize={panels.left.minSize}>
          {renderPanel(panels.left)}
        </Panel>

        <PanelResizeHandle className="w-1 bg-slate-200 hover:bg-slate-400 transition-colors" />

        <Panel defaultSize={panels.middle.size} minSize={panels.middle.minSize}>
          {renderPanel(panels.middle)}
        </Panel>

        <PanelResizeHandle className="w-1 bg-slate-200 hover:bg-slate-400 transition-colors" />

        <Panel defaultSize={panels.right.size} minSize={panels.right.minSize}>
          {renderPanel(panels.right)}
        </Panel>
      </PanelGroup>
    </div>
  );
};

const PanelGroupLayout = () => {
  return (
    <Provider store={store}>
      <PanelContent />
    </Provider>
  );
};

export default PanelGroupLayout;
