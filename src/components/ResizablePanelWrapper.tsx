import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import DemoLeftPanel from './panels/DemoLeftPanel';
import DemoMainPanel from './panels/DemoMainPanel';

import './ResizablePanelWrapper.css';

export default function ResizablePanelWrapper() {
  const onLayout = (sizes: number[]) => {
    console.log('Layout changed:', sizes);
  };

  return (
    <div className="panel-container">
      <PanelGroup direction="horizontal" onLayout={onLayout}>
        <Panel defaultSize={20} minSize={15} maxSize={40}>
          <DemoLeftPanel />
        </Panel>
        
        <PanelResizeHandle className="resize-handle" />
        
        <Panel>
          <DemoMainPanel />
        </Panel>
      </PanelGroup>
    </div>
  );
}
