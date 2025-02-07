import React from 'react';
import { Provider, useSelector } from 'react-redux';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { store } from '../store';
import GeneratePanel from '../components/panels/GeneratePanel';
import panelConfig from '../components/panels/panels.json';

const PanelContent = () => {
  const panels = useSelector(state => state.panellayout.panels);


  const renderPanel = (type) => {
    const panel = panelConfig[type];
    if (panel) {
      const Component = componentMap[panel.component];
      return Component ? <Component /> : null;
    }
    return null;
  };

  return (
    <div className="h-screen overflow-hidden">
      <PanelGroup direction="horizontal" className="h-full">
        {/* Left Panel */}
        <Panel defaultSize={panels.left.size} minSize={panels.left.minSize}>
          <div className="h-full overflow-hidden">
            {renderPanel(panels.left.type)}
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-slate-200 hover:bg-slate-400 transition-colors" />

        {/* Middle Panel */}
        <Panel defaultSize={panels.middle.size} minSize={panels.middle.minSize}>
          <div className="h-full overflow-hidden">
            <GeneratePanel />
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-slate-200 hover:bg-slate-400 transition-colors" />

        {/* Right Panel */}
        <Panel defaultSize={panels.right.size} minSize={panels.right.minSize}>
          <div className="h-full overflow-hidden">
            {renderPanel(panels.right.type)}
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
