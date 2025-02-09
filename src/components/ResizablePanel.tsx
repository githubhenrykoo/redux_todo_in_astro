import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { DynamicPanel } from './DynamicPanel';

const DEFAULT_COMPONENTS = ['DemoMainPanel','DemoRightPanel','DemoRightPanel',['SearchAndTodos',['DemoLeftPanel', 'DemoRightPanel'], ['DemoRightPanel','DemoRightPanel','DemoRightPanel', 'DemoRightPanel'],'DemoRightPanel'], 'DemoRightPanel'];

interface ResizablePanelProps {
  panelCount?: number;
  useDefaultContent?: boolean;
}

interface PanelConfig {
  id: string;
  defaultSize: number;
  minSize: number;
  maxSize: number;
  defaultComponent: string | (string | any[])[];
  sliceName: string;
}

const renderNestedPanel = (
  component: string | any[],
  config: PanelConfig,
  depth: number = 0
): React.ReactElement => {
  if (Array.isArray(component)) {
    const direction = depth % 2 === 0 ? "vertical" : "horizontal";
    const defaultSize = 100 / component.length;
    
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex' }}>
        <PanelGroup 
          direction={direction} 
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: direction === 'horizontal' ? 'row' : 'column',
          }}
        >
          {component.map((subComponent, subIndex) => (
            <React.Fragment key={`${config.id}-d${depth}-${subIndex}`}>
              <Panel 
                defaultSize={defaultSize}
                minSize={10}
                maxSize={90}
                style={{
                  ...styles.panel,
                  display: '1',
                  flexDirection: direction === 'vertical' ? 'column' : 'row',
                }}
              >
                {renderNestedPanel(
                  subComponent,
                  {
                    ...config,
                    id: `${config.id}-d${depth}-${subIndex}`,
                    sliceName: `${config.sliceName}-d${depth}-${subIndex}`,
                  },
                  depth + 1
                )}
              </Panel>
              {subIndex < component.length - 1 && (
                <PanelResizeHandle 
                  style={direction === "horizontal" ? styles.resizeHandle : styles.verticalResizeHandle} 
                />
              )}
            </React.Fragment>
          ))}
        </PanelGroup>
      </div>
    );
  }

  return (
    <DynamicPanel
      panelType={component}
      slot={config.id}
      sliceName={config.sliceName}
      props={{}}
    />
  );
};

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
      <PanelGroup 
        direction="horizontal" 
        onLayout={onLayout}
        style={{
          height: '100%',
          width: '100%',
        }}
      >
        {generatePanels(panelCount).map((config, index) => (
          <React.Fragment key={config.id}>
            <Panel 
              defaultSize={config.defaultSize}
              minSize={config.minSize}
              maxSize={config.maxSize}
              style={styles.panel}
            >
              {Array.isArray(config.defaultComponent) ? (
                renderNestedPanel(config.defaultComponent, config)
              ) : (
                <DynamicPanel
                  panelType={config.defaultComponent}
                  slot={config.id}
                  sliceName={config.sliceName}
                  props={{}}
                />
              )}
            </Panel>
            {index < panelCount - 1 && (
              <PanelResizeHandle style={styles.resizeHandle} />
            )}
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
    height: '100%',
    display: 'flex',
  },
  panel: {
    backgroundColor: '#2d2d2d',
    overflow: 'hidden',
    height: '100%',
    width: '100%',
  },
  resizeHandle: {
    width: '4px',
    backgroundColor: '#404040',
    cursor: 'col-resize',
    '&:hover': {
      backgroundColor: '#666',
    },
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
  verticalResizeHandle: {
    height: '4px',
    backgroundColor: '#404040',
    cursor: 'row-resize',
    '&:hover': {
      backgroundColor: '#666',
    },
  },
};