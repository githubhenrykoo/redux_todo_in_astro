import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { IslandFactory } from './factories/IslandFactory';
import { DemoLeftPanel } from './panels/DemoLeftPanel';
import { DemoMainPanel } from './panels/DemoMainPanel';
import { DemoRightPanel } from './panels/DemoRightPanel';

interface ResizablePanelProps {
  useDefaultContent?: boolean;
  leftPanel?: React.ComponentType<any>;
  mainPanel?: React.ComponentType<any>;
  rightPanel?: React.ComponentType<any>;
  leftProps?: Record<string, any>;
  mainProps?: Record<string, any>;
  rightProps?: Record<string, any>;
}

export default function ResizablePanel({ 
  useDefaultContent = true,
  leftPanel,
  mainPanel,
  rightPanel,
  leftProps = {},
  mainProps = {},
  rightProps = {}
}: ResizablePanelProps) {
  const onLayout = (sizes: number[]) => {
    console.log('Layout changed:', sizes);
  };

  return (
    <div style={styles.panelContainer}>
      <PanelGroup direction="horizontal" onLayout={onLayout} style={styles.panelGroup}>
        <Panel defaultSize={20} minSize={15} maxSize={40} style={styles.panel}>
          <IslandFactory
            component={useDefaultContent ? DemoLeftPanel : leftPanel}
            sliceName="left-panel"
            slot="left"
            {...leftProps}
          />
        </Panel>
        
        <PanelResizeHandle style={styles.resizeHandle} />
        
        <Panel style={styles.panel}>
          <IslandFactory
            component={useDefaultContent ? DemoMainPanel : mainPanel}
            sliceName="main-panel"
            slot="main"
            {...mainProps}
          />
        </Panel>

        <PanelResizeHandle style={styles.resizeHandle} />

        <Panel defaultSize={20} minSize={15} maxSize={40} style={styles.panel}>
          <IslandFactory
            component={useDefaultContent ? DemoRightPanel : rightPanel}
            sliceName="right-panel"
            slot="right"
            {...rightProps}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}

const styles = {
  panelContainer: {
    height: '100%',
    width: '100%',
    backgroundColor: 'white',
  },
  panelGroup: {
    height: '100%',
  },
  panel: {
    height: '100%',
    overflow: 'hidden',
  },
  resizeHandle: {
    backgroundColor: '#e5e7eb',
    width: '4px',
    margin: '0 -2px',
    cursor: 'col-resize',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#60a5fa',
    },
  },
  panelBase: {
    height: '100%',
    padding: '1rem',
  },
  leftPanel: {
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
  },
  mainPanel: {
    backgroundColor: 'white',
    border: '1px solid #ddd',
  },
  contentBox: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
  },
  heading: {
    margin: '0 0 1rem 0',
    color: '#333',
  },
  paragraph: {
    margin: '0.5rem 0',
    color: '#666',
  },
};
