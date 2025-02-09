import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

const panelGroupStyle = {
  display: 'flex',
  height: '100%',
  width: '100%',
};

const panelStyle = {
  flex: 1,
  overflow: 'hidden',
  position: 'relative',
};

const panelResizeHandleStyle = {
  width: '10px',
  background: '#333',
  cursor: 'col-resize',
};

const ReactResiableSlot = (props) => {
  console.log('ReactResiableSlot props:', props);

  // Extract Astro slot components
  const leftComponent = props.left;
  const middleComponent = props.middle;
  const rightComponent = props.right;

  console.log('Components:', {
    leftComponent,
    middleComponent,
    rightComponent
  });

  // Determine which components are present
  const panelComponents = [
    leftComponent, 
    middleComponent, 
    rightComponent
  ].filter(Boolean);

  console.log('Filtered panel components:', panelComponents);

  // Distribute sizes based on number of panels
  const panelCount = panelComponents.length;
  const defaultSize = panelCount > 0 ? Math.floor(100 / panelCount) : 33;

  return (
    <PanelGroup direction="horizontal" style={panelGroupStyle}>
      {panelComponents.map((panelComponent, index) => {
        console.log(`Rendering panel ${index}:`, panelComponent);
        return (
          <React.Fragment key={index}>
            <Panel 
              defaultSize={defaultSize} 
              minSize={20} 
              style={panelStyle}
            >
              <div style={{ 
                padding: '10px', 
                backgroundColor: `hsl(${index * 60}, 50%, 80%)`, 
                height: '100%' 
              }}>
                {/* Render the slot content */}
                <div dangerouslySetInnerHTML={{ __html: panelComponent.props.value }} />
              </div>
            </Panel>
            
            {/* Add resize handle between panels, except for the last one */}
            {index < panelComponents.length - 1 && (
              <PanelResizeHandle style={panelResizeHandleStyle} />
            )}
          </React.Fragment>
        );
      })}
    </PanelGroup>
  );
};

export default ReactResiableSlot;
