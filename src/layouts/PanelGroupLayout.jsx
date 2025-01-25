import React from 'react';
import { Provider } from 'react-redux';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TopBanner, Sidebar } from '../components/ui/placeholder';
import { store } from '../store';
import ActionLogPanel from '../components/ActionLogPanel';
import ToDos from '../components/ToDos';
import AddTodo from '../components/AddTodo';
import ResizeHandle from '../components/ui/ResizeHandle';
import SearchTodo from '../components/SearchTodo';

const PanelLabel = ({ children }) => (
  <div className="absolute top-0 left-0 right-0 bg-slate-100 px-4 py-1 text-xs font-medium text-slate-600 border-b border-slate-200">
    {children}
  </div>
);

const PanelGroupLayout = () => {
  return (
    <Provider store={store}>
      <div className="h-screen w-full">
        {/* Top Banner */}
        <div className="h-16">
          <TopBanner />
        </div>

        {/* Main Content */}
        <div className="h-[calc(100vh-4rem)]">
          <PanelGroup direction="horizontal">
            {/* Fixed Sidebar - 48px width */}
            <Panel defaultSize={4} minSize={4} maxSize={4}>
              <div className="h-full bg-white relative w-12">
                <div className="pt-8">
                  <Sidebar />
                </div>
              </div>
            </Panel>
            
            <PanelResizeHandle />

            {/* Main Content Area with three horizontal panels */}
            <Panel>
              <PanelGroup direction="horizontal">
                {/* Action Log Panel */}
                <Panel defaultSize={30} minSize={20}>
                  <div className="h-full bg-white relative">
                    <PanelLabel>Item Collection</PanelLabel>
                    <div className="h-full pt-8 p-4">
                      <SearchTodo />
                      <ToDos />
                    </div>
                  </div>
                </Panel>
                <ResizeHandle />

                {/* Todo Components */}
                <Panel>
                  <div className="h-full bg-white relative">
                    <PanelLabel>Create New Item</PanelLabel>
                    <div className="h-full pt-8 p-4">
                      <AddTodo />
                      
                    </div>
                  </div>
                </Panel>
                <ResizeHandle />

                {/* Additional Panel (Placeholder) */}
                <Panel defaultSize={30} minSize={20}>
                  <div className="h-full bg-white relative">
                    <PanelLabel>Action History</PanelLabel>
                    <div className="h-full pt-8 p-4">
                      {/* Placeholder for any additional content */}
                      <ActionLogPanel />
                    </div>
                  </div>
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </Provider>
  );
};

export default PanelGroupLayout;
