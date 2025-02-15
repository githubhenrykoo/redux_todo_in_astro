import React, { useState } from 'react';
import type { CSSProperties } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

type UrlConfig = 
  | string 
  | string[] 
  | (string | string[] | (string | string[])[])[];

interface UrlResizablePanelProps {
  urls?: UrlConfig;
  direction?: 'horizontal' | 'vertical';
}

export default function UrlResizablePanel({ 
  urls = [],
  direction = 'horizontal',
}: UrlResizablePanelProps) {
  // Function to handle different URL types
  const processUrl = (inputUrl: string) => {
    // YouTube watch URL to embed URL
    const youtubeWatchRegex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/;
    const youtubeWatchMatch = inputUrl.match(youtubeWatchRegex);
    
    if (youtubeWatchMatch && youtubeWatchMatch[1]) {
      return `https://www.youtube.com/embed/${youtubeWatchMatch[1]}`;
    }
    
    return inputUrl;
  };

  // Recursively render nested panels
  const renderNestedPanel = (
    config: UrlConfig, 
    currentDirection: 'horizontal' | 'vertical',
    depth: number = 0
  ) => {
    // If it's a string, render a single iframe
    if (typeof config === 'string') {
      return renderSinglePanel(config);
    }

    // If it's an array, create a panel group
    if (Array.isArray(config)) {
      const nextDirection = depth % 2 === 0 ? 'vertical' : 'horizontal';
      const defaultSize = 100 / config.length;

      return (
        <PanelGroup
          direction={currentDirection}
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: currentDirection === 'horizontal' ? 'row' : 'column',
          }}
        >
          {config.map((subConfig, index) => (
            <React.Fragment key={`panel-${depth}-${index}`}>
              <Panel
                defaultSize={defaultSize}
                minSize={10}
                maxSize={90}
                style={{
                  backgroundColor: '#2d2d2d',
                  overflow: 'hidden',
                  height: '100%',
                  width: '100%',
                }}
              >
                {renderNestedPanel(subConfig, nextDirection, depth + 1)}
              </Panel>
              {index < config.length - 1 && (
                <PanelResizeHandle 
                  style={
                    currentDirection === 'horizontal' 
                      ? styles.resizeHandle 
                      : styles.verticalResizeHandle
                  } 
                />
              )}
            </React.Fragment>
          ))}
        </PanelGroup>
      );
    }

    // Fallback for unexpected input
    return <div>Invalid configuration</div>;
  };

  // Render a single iframe panel
  const renderSinglePanel = (url: string) => {
    const [iframeError, setIframeError] = useState(false);
    const processedUrl = processUrl(url);

    const handleIframeError = () => {
      setIframeError(true);
    };

    if (iframeError) {
      return (
        <div style={styles.errorContainer}>
          <p>Unable to embed the website directly.</p>
          <div style={styles.buttonContainer}>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={styles.link}
            >
              Open in New Tab
            </a>
          </div>
        </div>
      );
    }

    return (
      <iframe 
        src={processedUrl}
        width="100%" 
        height="100%" 
        frameBorder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Embedded Website"
        onError={handleIframeError}
      />
    );
  };

  const styles: Record<string, CSSProperties> = {
    panelContainer: {
      display: 'flex',
      height: '100%',
      width: '100%',
      backgroundColor: '#1a1a1a',
    },
    errorContainer: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      width: '100%',
      backgroundColor: '#2d2d2d',
      color: '#ffffff',
      textAlign: 'center',
      padding: '20px',
    },
    buttonContainer: {
      display: 'flex',
      gap: '20px',
      marginTop: '20px',
    },
    link: {
      color: '#4da6ff',
      textDecoration: 'underline',
      padding: '10px',
      backgroundColor: '#3a3a3a',
      borderRadius: '5px',
    },
    resizeHandle: {
      width: '4px',
      backgroundColor: '#404040',
      cursor: 'col-resize',
    },
    verticalResizeHandle: {
      height: '4px',
      backgroundColor: '#404040',
      cursor: 'row-resize',
    },
  };

  return (
    <div style={styles.panelContainer}>
      {renderNestedPanel(urls, direction)}
    </div>
  );
}