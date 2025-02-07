import React, { Suspense } from 'react';
import { Provider, useSelector } from 'react-redux';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { store } from '../store';
import panelsConfig from '../components/panels/panels.json';

const PanelContent = () => {
  const panellayout = useSelector(state => state.panellayout);
  
  console.log('Full panellayout state:', panellayout);

  // Defensive check for panels
  if (!panellayout || !panellayout.panels) {
    console.log('No panels found in state');
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Panel configuration not loaded</p>
      </div>
    );
  }

  const { panels } = panellayout;
  console.log('Panels from state:', panels);

  const renderPanel = async (panelConfig) => {
    console.log('Rendering panel config:', panelConfig);
    if (!panelConfig || !panelConfig.type) return null;

    try {
      const panelType = panelConfig.type;
      const componentPath = panelsConfig[panelType]?.component;
      console.log('Loading component from:', componentPath);
      
      const Component = React.lazy(() => import(componentPath));
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <Component />
        </Suspense>
      );
    } catch (error) {
      console.error(`Failed to render component for type: ${panelConfig.type}`, error);
      return null;
    }
  };

  return (
    <div className="h-screen overflow-hidden">
      <PanelGroup direction="horizontal" className="h-full">
        {/* Left Panel */}
        <Panel defaultSize={panels.left.size} minSize={panels.left.minSize}>
          <div className="h-full overflow-hidden">
            {renderPanel(panels.left)}
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-slate-200 hover:bg-slate-400 transition-colors" />

        {/* Middle Panel */}
        <Panel defaultSize={panels.middle.size} minSize={panels.middle.minSize}>
          <div className="h-full overflow-hidden">
            {renderPanel(panels.middle)}
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-slate-200 hover:bg-slate-400 transition-colors" />

        {/* Right Panel */}
        <Panel defaultSize={panels.right.size} minSize={panels.right.minSize}>
          <div className="h-full overflow-hidden">
            {renderPanel(panels.right)}
          </div>
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
