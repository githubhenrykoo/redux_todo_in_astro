import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { DynamicPanel } from './DynamicPanel';

interface ResizablePanelProps {
  useDefaultContent?: boolean;
  leftPanel?: string;
  mainPanel?: string;
  rightPanel?: string;
  leftProps?: Record<string, any>;
  mainProps?: Record<string, any>;
  rightProps?: Record<string, any>;
}

const PANEL_CONFIG = [
  {
    id: 'left',
    defaultSize: 20,
    minSize: 15,
    maxSize: 40,
    defaultComponent: 'DemoLeftPanel',
    sliceName: 'left-panel',
  },
  {
    id: 'main',
    defaultComponent: 'DemoMainPanel',
    sliceName: 'main-panel',
  },
  {
    id: 'right',
    defaultSize: 20,
    minSize: 15,
    maxSize: 40,
    defaultComponent: 'DemoRightPanel',
    sliceName: 'right-panel',
  },
];

export default function ResizablePanel({ 
  useDefaultContent = true,
  leftPanel,
  mainPanel,
  rightPanel,
  leftProps = {},
  mainProps = {},
  rightProps = {},
}: ResizablePanelProps) {
  const onLayout = (sizes: number[]) => {
    console.log('Layout changed:', sizes);
  };

  const getCustomComponent = (id: string) => {
    switch(id) {
      case 'left': return leftPanel;
      case 'main': return mainPanel;
      case 'right': return rightPanel;
      default: return null;
    }
  };

  const getProps = (id: string) => {
    switch(id) {
      case 'left': return leftProps;
      case 'main': return mainProps;
      case 'right': return rightProps;
      default: return {};
    }
  };

  return (
    <div style={styles.panelContainer}>
      <PanelGroup direction="horizontal" onLayout={onLayout} style={styles.panelGroup}>
        {PANEL_CONFIG.map((config, index) => (
          <React.Fragment key={config.id}>
            <Panel
              defaultSize={config.defaultSize}
              minSize={config.minSize}
              maxSize={config.maxSize}
              style={styles.panel}
            >
              <DynamicPanel
                panelType={useDefaultContent ? config.defaultComponent : getCustomComponent(config.id) || config.defaultComponent}
                slot={config.id}
                sliceName={config.sliceName}
                props={getProps(config.id)}
              />
            </Panel>
            {index < PANEL_CONFIG.length - 1 && <PanelResizeHandle style={styles.resizeHandle} />}
          </React.Fragment>
        ))}
      </PanelGroup>
    </div>
  );
}

const styles = {
  panelContainer: {
    display: 'flex',
    height: '100%',
    width: '100%',
  },
  panelGroup: {
    width: '100%',
  },
  panel: {
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  resizeHandle: {
    width: '4px',
    backgroundColor: '#ddd',
    cursor: 'col-resize',
  },
};
