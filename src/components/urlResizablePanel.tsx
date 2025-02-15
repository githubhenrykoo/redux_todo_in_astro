import React, { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

interface UrlResizablePanelProps {
  url: string;
}

export default function UrlResizablePanel({ url }: UrlResizablePanelProps) {
  const [iframeError, setIframeError] = useState(false);

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
    <div style={styles.panelContainer}>
      <PanelGroup 
        direction="horizontal"
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
            src={processedUrl}
            width="100%" 
            height="100%" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Embedded Website"
            onError={handleIframeError}
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
};