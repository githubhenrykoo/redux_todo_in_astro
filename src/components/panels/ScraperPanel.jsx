import React, { useState, useEffect, useRef } from 'react';
import '../../styles/PanelCommon.css';

/**
 * ScraperPanel - A component that scrapes and displays HTML content from external URLs
 * This panel fetches HTML directly and renders it within the application instead of using iframes
 */
const ScraperPanel = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [targetUrl, setTargetUrl] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [fetchMethod, setFetchMethod] = useState('cors-proxy');
  const contentRef = useRef(null);

  // Available fetch methods
  const fetchMethods = {
    'cors-proxy': 'Use CORS proxy (best compatibility)',
    'direct': 'Direct fetch (only works for CORS-enabled sites)',
    'html-only': 'HTML only (strips scripts and interactive elements)'
  };

  // Fetch HTML content from the URL
  const fetchContent = async () => {
    if (!targetUrl) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let response;
      let html;
      
      // Use different fetch approaches based on selected method
      switch(fetchMethod) {
        case 'direct':
          response = await fetch(targetUrl);
          html = await response.text();
          break;
          
        case 'html-only':
          response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
          html = await response.text();
          // Strip scripts and other potentially problematic elements
          html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
          html = html.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
          break;
          
        case 'cors-proxy':
        default:
          response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
          html = await response.text();
          break;
      }
      
      // Update HTML content
      setHtmlContent(html);
      
      // Handle content display after render
      setTimeout(() => {
        if (contentRef.current) {
          // Fix relative URLs in the HTML content
          const baseUrl = new URL(targetUrl).origin;
          const links = contentRef.current.querySelectorAll('a');
          const images = contentRef.current.querySelectorAll('img');
          
          // Fix links
          links.forEach(link => {
            if (link.href && link.href.startsWith('/')) {
              link.href = `${baseUrl}${link.href}`;
            }
            // Open links in new tab
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
          });
          
          // Fix images
          images.forEach(img => {
            if (img.src && img.src.startsWith('/')) {
              img.src = `${baseUrl}${img.src}`;
            } else if (img.src && !img.src.startsWith('http')) {
              img.src = `${baseUrl}/${img.src}`;
            }
          });
        }
      }, 100);
      
    } catch (err) {
      setError(`Failed to fetch content: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Clear the content when URL changes
  useEffect(() => {
    setHtmlContent('');
    setError(null);
  }, [targetUrl, fetchMethod]);

  // Open URL in a new tab
  const openInNewTab = () => {
    if (targetUrl) window.open(targetUrl, '_blank');
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    fetchContent();
  };

  return (
    <div className="scraper-panel" style={{ 
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
        borderBottom: '1px solid var(--border-color, #3e3e3e)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '16px' }}>HTML Scraper Viewer</h2>
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
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
            <button 
              type="submit"
              style={{
                padding: '5px 10px',
                backgroundColor: 'var(--accent-color, #4a90e2)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Fetch
            </button>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {Object.entries(fetchMethods).map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="fetchMethod"
                  checked={fetchMethod === key}
                  onChange={() => setFetchMethod(key)}
                />
                <span style={{ fontSize: '14px' }}>{label}</span>
              </label>
            ))}
          </div>
        </form>
      </div>
      
      {/* Content area */}
      <div style={{ 
        flex: 1,
        position: 'relative',
        overflow: 'auto',
        backgroundColor: 'white',
        color: 'black'
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
            color: 'white',
            zIndex: 10
          }}>
            <div className="loading-spinner"></div>
            <p style={{ marginLeft: '15px' }}>Fetching content...</p>
          </div>
        )}
        
        {error && (
          <div style={{
            padding: '20px',
            backgroundColor: 'var(--bg-color, #1e1e1e)',
            color: 'var(--text-color, #e0e0e0)',
            height: '100%',
            overflow: 'auto'
          }}>
            <div style={{ 
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid rgba(255, 0, 0, 0.3)',
              borderRadius: '5px',
              padding: '15px',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              <h3 style={{ color: '#ff5252', marginTop: 0 }}>Error Loading Content</h3>
              <p>{error}</p>
              <div style={{ marginTop: '20px' }}>
                <p><strong>Troubleshooting tips:</strong></p>
                <ul>
                  <li>Try a different fetch method</li>
                  <li>Make sure the URL is correct and includes https://</li>
                  <li>Some websites actively block scraping attempts</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {!targetUrl && !htmlContent && !loading && !error && (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-color, #1e1e1e)',
            color: 'var(--text-color, #e0e0e0)',
            textAlign: 'center',
            padding: '20px'
          }}>
            <div style={{ maxWidth: '600px' }}>
              <h3>Enter a URL above and click Fetch</h3>
              <p>This panel allows you to view content from websites by scraping their HTML.</p>
              <p>Unlike the Proxy Panel, this directly renders the HTML content without using iframes.</p>
              <p><strong>Note:</strong> Interactive elements like JavaScript may not work properly.</p>
            </div>
          </div>
        )}
        
        {htmlContent && (
          <div 
            ref={contentRef}
            style={{ 
              padding: '10px', 
              backgroundColor: 'white', 
              color: 'black',
              height: '100%',
              overflow: 'auto'
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )}
      </div>
    </div>
  );
};

export default ScraperPanel;

// Also export as a named export to support different import strategies
export { ScraperPanel };
