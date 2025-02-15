import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

const DEFAULT_URL = 'https://www.youtube.com/embed/1WWweyBaWZk';

interface ResizablePanelProps {
  url?: string;
}

export default function urlResizablePanel({ 
  url = DEFAULT_URL,
}: ResizablePanelProps) {
  const onLayout = (sizes: number[]) => {
    console.log('Layout changed:', sizes);
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
        <Panel 
          defaultSize={100}
          minSize={10}
          maxSize={100}
          style={styles.panel}
        >
          <iframe 
            src={url} 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            title="Embedded YouTube Video"
          />
        </Panel>
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
  panel: {
    backgroundColor: '#2d2d2d',
    overflow: 'hidden',
    height: '100%',
    width: '100%',
  },
};