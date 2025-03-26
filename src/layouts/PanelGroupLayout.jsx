import React, { Suspense } from 'react';
import { Provider, useSelector } from 'react-redux';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { store } from '../store';

const PanelContent = () => {
  const { panels } = useSelector(state => state.panellayout);
  if (!panels) return <div>Loading panels...</div>;

  const renderPanel = (config) => {
    const Component = React.lazy(() => 
      // Try both .tsx and .jsx extensions using Promise.any
      Promise.any([
        import(`../components/panels/${config.type}.tsx`).then(module => {
          console.log(`Successfully loaded .tsx component for: ${config.type}`);
          return { default: module.default || module[config.type] };
        }),
        import(`../components/panels/${config.type}.jsx`).then(module => {
          console.log(`Successfully loaded .jsx component for: ${config.type}`);
          return { default: module.default || module[config.type] };
        })
      ]).catch((error) => {
        console.error(`Failed to load component for panel type: ${config.type}`, error);
        throw new Error(`No component found for panel type: ${config.type}`);
      })
    );
    
    return (
      <Suspense fallback={<div>Loading panel...</div>}>
        <Component />
      </Suspense>
    );
  };

  return (
    <div className="h-screen overflow-hidden">
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

const PanelGroupLayout = () => (
  <Provider store={store}>
    <PanelContent />
  </Provider>
);

export default PanelGroupLayout;
