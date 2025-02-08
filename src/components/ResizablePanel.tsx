import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import './ResizablePanel.css';

interface ResizablePanelProps {
  useDefaultContent?: boolean;
}

export default function ResizablePanel({ useDefaultContent = true }: ResizablePanelProps) {
  const onLayout = (sizes: number[]) => {
    console.log('Layout changed:', sizes);
  };

  // Default left panel content
  const LeftPanel = () => (
    <div className="panel left-panel">
      <h2>Left Panel</h2>
      <p>This panel has a fixed width of 200px</p>
    </div>
  );

  // Default main panel content
  const MainPanel = () => (
    <div className="panel main-panel">
      <h2>Main Panel</h2>
      <p>This panel takes up the remaining space</p>
      <div className="content-box">
        {Array(20).fill(0).map((_, i) => (
          <p key={i}>Main panel content line {i + 1}</p>
        ))}
      </div>
    </div>
  );

  return (
    <div className="panel-container">
      <PanelGroup direction="horizontal" onLayout={onLayout}>
        <Panel defaultSize={20} minSize={15} maxSize={40}>
          {useDefaultContent ? <LeftPanel /> : <div className="panel left-panel" />}
        </Panel>
        
        <PanelResizeHandle className="resize-handle" />
        
        <Panel>
          {useDefaultContent ? <MainPanel /> : <div className="panel main-panel" />}
        </Panel>
      </PanelGroup>
    </div>
  );
}
