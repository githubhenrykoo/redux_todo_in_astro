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

  // Default right panel content
  const RightPanel = () => (
    <div style={{
      padding: '1rem',
      backgroundColor: '#f5f5f5',
      height: '100%',
      border: '1px solid #ddd'
    }}>
      <h2 style={{ margin: '0 0 1rem 0', color: '#333' }}>Right Panel</h2>
      <p style={{ margin: '0.5rem 0', color: '#666' }}>
        This panel has a fixed width of 200px
      </p>
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

        <PanelResizeHandle className="resize-handle" />

        <Panel defaultSize={20} minSize={15} maxSize={40}>
          {useDefaultContent ? <RightPanel /> : <div className="panel right-panel" />}
        </Panel>
      </PanelGroup>
    </div>
  );
}
