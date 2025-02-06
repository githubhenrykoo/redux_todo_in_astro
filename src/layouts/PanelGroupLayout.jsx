import React from 'react';
import { Provider } from 'react-redux';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { store } from '../store';
import ActionLogPanel from '../components/panels/ActionLogPanelReact';
import SearchAndTodos from '../components/panels/SearchAndTodos';
import ItemDetailPanel from '../components/panels/ItemDetailPanel';
import SearchANDPrompts from '../components/panels/SearchANDPrompts';
import GeneratePanel from '../components/panels/GeneratePanel';

const PanelGroupLayout = () => {
  return (
    <Provider store={store}>
      <div className="h-screen overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Item Collection Panel */}
          <Panel defaultSize={30} minSize={20}>
            <div className="h-full overflow-hidden">
              <SearchANDPrompts />
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-slate-200 hover:bg-slate-400 transition-colors" />

          {/* Create New Item Panel */}
          <Panel>
            <div className="h-full overflow-hidden">
              <ItemDetailPanel />
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-slate-200 hover:bg-slate-400 transition-colors" />

          {/* Action History Panel */}
          <Panel defaultSize={30} minSize={20}>
            <div className="h-full overflow-hidden">
              <GeneratePanel />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </Provider>
  );
};

export default PanelGroupLayout;
