import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { DynamicPanel } from './DynamicPanel';

const DEFAULT_COMPONENTS = ['SearchAndTodos', 'DemoMainPanel', 'DemoRightPanel','DemoLeftPanel','SearchAndTodos', 'DemoMainPanel', 'DemoRightPanel','DemoLeftPanel','SearchAndTodos', 'DemoMainPanel', 'DemoRightPanel','DemoLeftPanel'];

interface ResizablePanelProps {
  panelCount?: number;
  useDefaultContent?: boolean;
}


export default function ResizablePanel({ 
  panelCount = DEFAULT_COMPONENTS.length,
  useDefaultContent = true,
}: ResizablePanelProps) {
  const onLayout = (sizes: number[]) => {
    console.log('Layout changed:', sizes);
  };

  const generatePanels = (count: number) => {
    const defaultSize = Math.floor(100 / count);
    
    return Array(count).fill(0).map((_, index) => ({
      id: `panel-${index + 1}`,
      defaultSize: defaultSize,
      minSize: 10,
      maxSize: 90,
      defaultComponent: DEFAULT_COMPONENTS[index] || `Panel${index + 1}`,
      sliceName: `panel-${index + 1}`,
    }));
  };

  return (
    <div style={styles.panelContainer}>
      <PanelGroup direction="horizontal" onLayout={onLayout} style={styles.panelGroup}>
        {generatePanels(panelCount).map((config, index) => (
          <React.Fragment key={config.id}>
            <Panel
              defaultSize={config.defaultSize}
              minSize={config.minSize}
              maxSize={config.maxSize}
              style={styles.panel}
            >
              {useDefaultContent && DEFAULT_COMPONENTS.includes(config.defaultComponent) ? (
                <DynamicPanel
                  panelType={config.defaultComponent}
                  slot={config.id}
                  sliceName={config.sliceName}
                  props={{}}
                />
              ) : (
                <div style={styles.upcomingPanel}>
                  <span>Upcoming Panel {index + 1}</span>
                </div>
              )}
            </Panel>
            {index < panelCount - 1 && <PanelResizeHandle style={styles.resizeHandle} />}
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
    backgroundColor: '#1a1a1a',
  },
  panelGroup: {
    width: '100%',
  },
  panel: {
    height: '100%',
    backgroundColor: '#2d2d2d',
  },
  resizeHandle: {
    width: '4px',
    backgroundColor: '#404040',
    cursor: 'col-resize',
  },
  upcomingPanel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '1rem',
    backgroundColor: '#2d2d2d',
    color: '#a0a0a0',
    fontStyle: 'italic',
  },
};
