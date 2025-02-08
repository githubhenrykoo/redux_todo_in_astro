import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { DemoLeftPanel } from './panels/DemoLeftPanel';
import { DemoMainPanel } from './panels/DemoMainPanel';
import { DemoRightPanel } from './panels/DemoRightPanel';

interface ResizablePanelProps {
  useDefaultContent?: boolean;
  leftPanel?: React.ReactNode;
  mainPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
}

export default function ResizablePanel({ 
  useDefaultContent = true,
  leftPanel,
  mainPanel,
  rightPanel 
}: ResizablePanelProps) {
  const onLayout = (sizes: number[]) => {
    console.log('Layout changed:', sizes);
  };

  // Use imported components as default panels
  const LeftPanel = () => <DemoLeftPanel />;
  const MainPanel = () => <DemoMainPanel />;
  const RightPanel = () => <DemoRightPanel />;

  return (
    <div style={styles.panelContainer}>
      <PanelGroup direction="horizontal" onLayout={onLayout} style={styles.panelGroup}>
        <Panel defaultSize={20} minSize={15} maxSize={40} style={styles.panel}>
          {useDefaultContent ? (
            <LeftPanel />
          ) : leftPanel ? (
            <div style={{ ...styles.panelBase, ...styles.leftPanel }}>{leftPanel}</div>
          ) : (
            <div style={{ ...styles.panelBase, ...styles.leftPanel }} />
          )}
        </Panel>
        
        <PanelResizeHandle style={styles.resizeHandle} />
        
        <Panel style={styles.panel}>
          {useDefaultContent ? (
            <MainPanel />
          ) : mainPanel ? (
            <div style={{ ...styles.panelBase, ...styles.mainPanel }}>{mainPanel}</div>
          ) : (
            <div style={{ ...styles.panelBase, ...styles.mainPanel }} />
          )}
        </Panel>

        <PanelResizeHandle style={styles.resizeHandle} />

        <Panel defaultSize={20} minSize={15} maxSize={40} style={styles.panel}>
          {useDefaultContent ? (
            <RightPanel />
          ) : rightPanel ? (
            <div style={{ ...styles.panelBase, ...styles.leftPanel }}>{rightPanel}</div>
          ) : (
            <div style={{ ...styles.panelBase, ...styles.leftPanel }} />
          )}
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
