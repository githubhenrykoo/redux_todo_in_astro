import React from 'react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import { TopBanner, Sidebar, ChatPanel } from './ui/placeholder';
import StoreProvider from './ui/placeholder/StoreProvider';
import ResizeHandle from './ui/ResizeHandle';
import SearchTodo from './SearchTodo';
import ToDos from './ToDos';
import AddTodo from './AddTodo';

const PanelLabel = ({ children }) => (
  <div className="absolute top-0 left-0 right-0 bg-slate-100 px-4 py-1 text-xs font-medium text-slate-600 border-b border-slate-200">
    {children}
  </div>
);

export default function PanelGroupWrapper({ children }) {
  return (
    <StoreProvider>
      <div className="h-screen w-full">
        {/* Top Banner */}
        <div className="h-16">
          <TopBanner />
        </div>

        {/* Main Content */}
        <div className="h-[calc(100vh-4rem)]">
          <PanelGroup direction="horizontal">
            {/* Fixed Sidebar - 48px width */}
            <Panel 
              defaultSize={4}
              minSize={4}
              maxSize={4}
            >
              <div className="h-full bg-white relative w-12">
                <div className="pt-8">
                  <Sidebar />
                </div>
              </div>
            </Panel>

            {/* Main Content Area */}
            <Panel>
              <PanelGroup direction="horizontal">
                {/* Asset Navigator with Todo Components */}
                <Panel defaultSize={30} minSize={20}>
                  <div className="h-full bg-white relative">
                    <PanelLabel>Asset Navigator</PanelLabel>
                    <div className="h-full pt-8 p-4">
                      <div className="flex flex-col h-full">

                        <SearchTodo />
                        <div className="flex-1 overflow-auto">
                          <ToDos />
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel>

                <ResizeHandle />

                {/* Workspace */}
                <Panel defaultSize={40}>
                  <div className="h-full bg-white relative">
                    <PanelLabel>Workspace</PanelLabel>
                    <div className="h-full pt-8 p-4">
                    <AddTodo />
                      {children?.default}
                    </div>
                  </div>
                </Panel>

                <ResizeHandle />

                {/* Chat Panel */}
                <Panel defaultSize={30} minSize={20}>
                  <div className="h-full bg-white relative">
                    <PanelLabel>Chat</PanelLabel>
                    <div className="pt-8">
                      <ChatPanel />
                    </div>
                  </div>
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </StoreProvider>
  );
}
