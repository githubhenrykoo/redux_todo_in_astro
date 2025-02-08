import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import './ResizableLayout.css';

export default function ResizableLayout() {
  return (
    <div className="panel-container">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={20} minSize={15} maxSize={40}>
          <div className="panel left-panel">
            <h2>Left Panel</h2>
            <p>This panel has a fixed width of 200px</p>
          </div>
        </Panel>
        
        <PanelResizeHandle />
        
        <Panel>
          <div className="panel main-panel">
            <h2>Main Panel</h2>
            <p>This panel takes up the remaining space</p>
            <div className="content-box">
              {Array(20).fill(0).map((_, i) => (
                <p key={i}>Main panel content line {i + 1}</p>
              ))}
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
