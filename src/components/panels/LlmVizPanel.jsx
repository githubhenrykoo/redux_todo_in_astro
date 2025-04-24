import React, { useState, useEffect } from 'react';
import '../../styles/PanelCommon.css';

/**
 * LlmVizPanel - Component for displaying the LLM Visualization website
 * Embeds the locally running server as an iframe
 */
const LlmVizPanel = () => {
  // State for iframe loading
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverUrl, setServerUrl] = useState('http://localhost:3043');
  
  // Handle iframe loading events
  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setError('Failed to load LLM Visualization. Make sure the server is running.');
    setLoading(false);
  };

  // Directly open the URL in a new tab
  const openInNewTab = () => {
    window.open(serverUrl, '_blank');
  };

  // Check server availability on component mount
  useEffect(() => {
    const checkServerAvailability = async () => {
      try {
        // Use a timeout to avoid hanging if server is completely down
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(serverUrl, {
          method: 'HEAD',
          signal: controller.signal,
          mode: 'no-cors' // This allows the request to succeed even with CORS restrictions
        });
        
        clearTimeout(timeoutId);
        
        // With mode: 'no-cors', we can't actually check response.ok
        // The request will "succeed" even if the server is unreachable
        // So we need to use the fact that the fetch completed at all
        setError(null);
      } catch (err) {
        setError(`Cannot connect to LLM Visualization server at ${serverUrl}. Make sure it's running.`);
      }
    };
    
    checkServerAvailability();
    
    // Set a timer to automatically hide the loading indicator after a reasonable time
    // This is a fallback in case the iframe load event doesn't fire due to CORS
    const loadingTimer = setTimeout(() => {
      setLoading(false);
    }, 5000);
    
    return () => clearTimeout(loadingTimer);
  }, [serverUrl]);

  // Render panel
  return (
    <div className="llm-viz-panel" style={{ 
      height: '100%', 
      width: '100%', 
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header section with controls */}
      <div style={{
        padding: '10px',
        backgroundColor: 'var(--panel-header-bg, #2c2c2c)',
        borderBottom: '1px solid var(--border-color, #3e3e3e)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h2 style={{ margin: 0, fontSize: '16px' }}>LLM Visualization</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            style={{ 
              padding: '5px 8px',
              backgroundColor: 'var(--input-bg, #3a3a3a)',
              color: 'var(--text-color, #e0e0e0)',
              border: '1px solid var(--border-color, #555)',
              borderRadius: '4px',
              width: '250px'
            }}
            placeholder="Server URL"
          />
          <button 
            onClick={openInNewTab}
            style={{
              padding: '5px 10px',
              backgroundColor: 'var(--accent-color, #4a90e2)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Open in New Tab
          </button>
        </div>
      </div>
      
      {/* Content area with iframe */}
      <div style={{ 
        flex: 1,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(30, 30, 30, 0.7)',
            zIndex: 5
          }}>
            <div className="loading-spinner"></div>
            <p style={{ marginLeft: '15px' }}>Loading LLM Visualization...</p>
          </div>
        )}
        
        {error && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-color, #1e1e1e)',
            padding: '20px',
            textAlign: 'center',
            zIndex: 10
          }}>
            <div style={{ 
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid rgba(255, 0, 0, 0.3)',
              borderRadius: '5px',
              padding: '15px',
              maxWidth: '500px'
            }}>
              <h3 style={{ color: '#ff5252', marginTop: 0 }}>Connection Error</h3>
              <p>{error}</p>
              <div style={{ marginTop: '20px' }}>
                <p><strong>To start the server:</strong></p>
                <code style={{ 
                  display: 'block', 
                  backgroundColor: '#2a2a2a', 
                  padding: '10px',
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  textAlign: 'left'
                }}>
                  cd llm-viz<br/>
                  npm run dev
                </code>
                <button 
                  onClick={openInNewTab}
                  style={{
                    marginTop: '15px',
                    padding: '8px 15px',
                    backgroundColor: 'var(--accent-color, #4a90e2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Try Opening Directly
                </button>
              </div>
            </div>
          </div>
        )}
        
        <iframe
          src={serverUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: 'white' // Default before content loads
          }}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title="LLM Visualization"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
};

export default LlmVizPanel;

// Also export as a named export to support different import strategies
export { LlmVizPanel };
