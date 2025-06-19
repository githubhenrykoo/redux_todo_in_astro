import React, { useState, useEffect } from 'react';
import '../../styles/PanelCommon.css';

/**
 * ProxyPanel - A component for displaying external content through a proxy to bypass CORS restrictions
 * This panel allows loading content from websites that would normally block iframe embedding
 */
const ProxyPanel = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [targetUrl, setTargetUrl] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');
  const [useProxy, setUseProxy] = useState(true);
  const [proxyService, setProxyService] = useState('allorigins.win');
  
  // Available proxy services
  const proxyServices = {
    'allorigins.win': (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    'allorigins.win (html)': (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}&render=1`,
    'corsproxy.io': (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    'cors-anywhere (requires unlock)': (url) => `https://cors-anywhere.herokuapp.com/${url}`,
    'thingproxy.freeboard.io': (url) => `https://thingproxy.freeboard.io/fetch/${url}`
  };
  
  // Get the effective URL (either direct or proxied)
  const getEffectiveUrl = () => {
    if (!targetUrl) return '';
    if (!useProxy) return targetUrl;
    
    // Use the selected proxy service
    const proxyFunction = proxyServices[proxyService];
    return proxyFunction ? proxyFunction(targetUrl) : targetUrl;
  };
  
  // Handle iframe loading events
  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setError('Failed to load content. The website might block embedding or the proxy might be unavailable.');
    setLoading(false);
  };

  // Directly open the URL in a new tab
  const openInNewTab = () => {
    const url = useProxy ? proxyUrl : targetUrl;
    if (url) window.open(url, '_blank');
  };
  
  // Reset any errors when URL or proxy settings change
  useEffect(() => {
    setError(null);
    setLoading(true);
  }, [targetUrl, proxyService, useProxy]);
  
  // Update the proxy URL when settings change
  useEffect(() => {
    if (targetUrl) {
      const calculatedUrl = getEffectiveUrl();
      setProxyUrl(calculatedUrl);
    }
  }, [targetUrl, proxyService, useProxy]);

  // Render panel
  return (
    <div className="proxy-panel" style={{ 
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
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '16px' }}>Proxy Content Viewer</h2>
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
            disabled={!targetUrl}
          >
            Open in New Tab
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            style={{ 
              padding: '5px 8px',
              backgroundColor: 'var(--input-bg, #3a3a3a)',
              color: 'var(--text-color, #e0e0e0)',
              border: '1px solid var(--border-color, #555)',
              borderRadius: '4px',
              flex: 1
            }}
            placeholder="Enter website URL (e.g., https://example.com)"
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ color: 'var(--text-color, #e0e0e0)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input
              type="checkbox"
              checked={useProxy}
              onChange={() => setUseProxy(!useProxy)}
            />
            Use Proxy
          </label>
          
          <select
            value={proxyService}
            onChange={(e) => setProxyService(e.target.value)}
            disabled={!useProxy}
            style={{ 
              padding: '5px 8px',
              backgroundColor: 'var(--input-bg, #3a3a3a)',
              color: 'var(--text-color, #e0e0e0)',
              border: '1px solid var(--border-color, #555)',
              borderRadius: '4px'
            }}
          >
            {Object.keys(proxyServices).map(service => (
              <option key={service} value={service}>{service}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Content area with iframe */}
      <div style={{ 
        flex: 1,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {loading && targetUrl && (
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
            <p style={{ marginLeft: '15px' }}>Loading content...</p>
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
              <h3 style={{ color: '#ff5252', marginTop: 0 }}>Error Loading Content</h3>
              <p>{error}</p>
              <div style={{ marginTop: '20px' }}>
                <p><strong>Troubleshooting tips:</strong></p>
                <ul style={{ textAlign: 'left' }}>
                  <li>For plain text content, use "allorigins.win"</li>
                  <li>For sites with images, try "allorigins.win (html)" which renders the page differently</li>
                  <li>If using "cors-anywhere", you must first unlock it at: <a href="https://cors-anywhere.herokuapp.com/" target="_blank" style={{color: '#4a90e2'}}>cors-anywhere.herokuapp.com</a></li>
                  <li>For best results, consider opening the content in a new tab instead</li>
                  <li>Some websites actively block all proxy attempts, which may result in 403 errors for images</li>
                </ul>
                <button 
                  onClick={() => {setError(null); setLoading(true);}}
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
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
        
        {!targetUrl && !loading && !error && (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: 'var(--text-color, #e0e0e0)',
            textAlign: 'center',
            padding: '20px'
          }}>
            <div style={{ maxWidth: '600px' }}>
              <h3>Enter a URL above to get started</h3>
              <p>This panel allows you to view content from websites that would normally block iframe embedding.</p>
              <p>By using a proxy service, we can bypass CORS restrictions and X-Frame-Options headers.</p>
              <p><strong>Note:</strong> Not all websites can be displayed, as some actively detect and block proxies.</p>
            </div>
          </div>
        )}
        
        {targetUrl && (
          <iframe
            src={proxyUrl || targetUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: 'white', // Default before content loads
              display: error ? 'none' : 'block'
            }}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="Proxied Content"
            sandbox="allow-scripts allow-same-origin"
            referrerPolicy="no-referrer"
          />
        )}
      </div>
    </div>
  );
};

export default ProxyPanel;

// Also export as a named export to support different import strategies
export { ProxyPanel };
