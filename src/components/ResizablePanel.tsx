import React from 'react';
import { useSelector } from 'react-redux';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { DynamicPanel } from './DynamicPanel';
import resizeableConfig from '../features/resizeable.json';

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
          {component.map((subComponent: string | any[], subIndex: number) => (
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
      panelType={component as string}
      slot={config.id}
      sliceName={config.sliceName}
      props={{}}
    />
  );
};

interface ResizablePanelProps {
  panelCount?: number;
  useDefaultContent?: boolean;
}

export default function ResizablePanel({ 
  panelCount,
  useDefaultContent = true,
}: ResizablePanelProps) {
  // Get current layout from Redux state
  const currentLayout = useSelector((state: any) => state.resizeable.currentLayout);

  // FORCE layout selection with aggressive logging
  console.error('===== RESIZABLE PANEL DIAGNOSTIC START =====');
  console.error(`FORCED Redux Layout: ${currentLayout}`);
  console.error(`Available Layouts: ${JSON.stringify(Object.keys(resizeableConfig.layouts))}`);
  
  // FORCE layout to be a string and matches exactly
  const normalizedLayout = String(currentLayout).toLowerCase().trim();
  console.error(`FORCED Normalized Layout: ${normalizedLayout}`);

  // FORCE validate layout with case-insensitive check
  const validLayouts = Object.keys(resizeableConfig.layouts).map(l => l.toLowerCase());
  console.error(`FORCED Normalized Available Layouts: ${JSON.stringify(validLayouts)}`);

  // FORCE layout selection, throwing an error if not found
  if (!validLayouts.includes(normalizedLayout)) {
    console.error(`CRITICAL: Invalid layout detected!`);
    console.error(`FORCED Attempted Layout: ${normalizedLayout}`);
    console.error(`FORCED Available Layouts: ${validLayouts.join(', ')}`);
    throw new Error(`Invalid layout: ${normalizedLayout}. Available layouts are: ${validLayouts.join(', ')}`);
  }

  // FORCE find the exact case-sensitive layout key
  const exactLayoutKey = Object.keys(resizeableConfig.layouts)
    .find(l => l.toLowerCase() === normalizedLayout);
  
  console.error(`FORCED Exact Layout Key: ${exactLayoutKey}`);

  // FORCE use of the selected layout
  const layoutConfig = resizeableConfig.layouts[exactLayoutKey as keyof typeof resizeableConfig.layouts];
  console.error(`FORCED Layout Config: ${JSON.stringify(layoutConfig)}`);

  // FORCE ensure components exist and is an array
  if (!layoutConfig || !layoutConfig.components) {
    console.error('CRITICAL: No components found for the selected layout!');
    throw new Error(`No components defined for layout: ${exactLayoutKey}`);
  }

  // FORCE panelCount to match the selected layout's components
  const finalPanelCount = layoutConfig.components.length;
  console.error(`FORCED Panel Count: ${finalPanelCount}`);
  console.error(`FORCED Specific Components: ${JSON.stringify(layoutConfig.components)}`);
  console.error('===== RESIZABLE PANEL DIAGNOSTIC END =====');

  const onLayout = (sizes: number[]) => {
    console.log('Layout changed:', sizes);
  };

  const generatePanels = (count: number) => {
    const defaultSize = Math.floor(100 / count);
    
    return layoutConfig.components.map((component, index) => ({
      id: `panel-${index + 1}`,
      defaultSize: defaultSize,
      minSize: 10,
      maxSize: 90,
      defaultComponent: component,
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
        {generatePanels(finalPanelCount).map((config, index) => (
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
                  panelType={config.defaultComponent as string}
                  slot={config.id}
                  sliceName={config.sliceName}
                  props={{}}
                />
              )}
            </Panel>
            {index < finalPanelCount - 1 && (
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