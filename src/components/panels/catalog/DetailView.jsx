import React, { useState, useEffect, useRef } from 'react';
import { getSimpleContentType, getContentTypeDisplay } from './utils';
import { ContentService } from '../../../services/content-service';
import { processContent, isImageType } from '../../../utils/content-utils';
import VideoPlayer from '../../viewers/VideoPlayer';
import '../../viewers/video-player.css';
import './detail-view.css';

/**
 * Detail view component for a catalog item
 */
const DetailView = ({ 
  itemLoading, 
  itemError, 
  selectedItem, 
  onBack, 
  onDeleteItem 
}) => {
  const [wordWrap, setWordWrap] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [imageData, setImageData] = useState(null);
  const [contentData, setContentData] = useState(null);
  const imageRef = useRef(null);
  
  // Get content type display mapping
  const contentTypeMap = getContentTypeDisplay();

  // Reset state when item changes
  useEffect(() => {
    if (selectedItem) {
      setImageLoaded(false);
      setImageError(false);
      setRetryCount(0);
      setImageData(null);
      setContentData(null);
    }
  }, [selectedItem?.hash]);

  // Load content when an item is selected using ContentService
  useEffect(() => {
    if (!selectedItem) return;
    
    const contentType = selectedItem.contentType;
    const isImage = isImageType(contentType);
    
    if (isImage) {
      console.log(`Loading image for item: ${selectedItem.hash}`);
      setImageLoaded(false);
      setImageError(false);
      
      // Use ContentService to fetch and process the image
      ContentService.fetchContent(selectedItem.hash)
        .then(result => {
          console.log("Content loaded:", result.hash);
          
          if (result.error) {
            console.error("Error loading content:", result.error);
            throw new Error(result.error);
          }
          
          if (result.processed && result.processed.type === 'dataUrl') {
            // Already processed to data URL
            setImageData(result.processed.url);
            setImageLoaded(true);
          } else if (result.raw?.content) {
            // Process the content
            const processed = processContent(result.raw.content, contentType);
            
            if (processed.type === 'dataUrl') {
              setImageData(processed.url);
              setImageLoaded(true);
            } else {
              console.error("Unexpected content format:", processed.type);
              throw new Error(`Unexpected content format: ${processed.type}`);
            }
          } else {
            throw new Error("No valid content found in API response");
          }
        })
        .catch(error => {
          console.error("Error processing image:", error);
          setImageError(true);
        });
    } else {
      // For non-image content types, just fetch the data
      ContentService.fetchContent(selectedItem.hash)
        .then(result => {
          if (result.error) {
            console.error("Error loading content:", result.error);
            return;
          }
          setContentData(result);
        })
        .catch(error => {
          console.error("Error loading content:", error);
        });
    }
  }, [selectedItem, retryCount]);

  // Helper function to get proper content type display
  const getFormattedContentType = (mimeType) => {
    if (!mimeType) return 'Unknown';
    
    const simpleType = getSimpleContentType(mimeType);
    if (!simpleType) return mimeType;
    
    return `${contentTypeMap[simpleType] || simpleType.toUpperCase()} (${mimeType})`;
  };
  
  if (itemLoading) {
    return <div className="loading-indicator">Loading item details...</div>;
  }

  if (itemError) {
    return <div className="error-message">Error: {itemError}</div>;
  }

  if (!selectedItem) {
    return <div className="error-message">Item not found</div>;
  }
  
  // Universal content wrapper to enforce containment
  const ContentWrapper = ({ children, className = '' }) => (
    <div className={`universal-content-wrapper ${className}`}>
      {children}
    </div>
  );
  
  // Helper function to render JSON with syntax highlighting and guaranteed wrapping
  const renderJsonWithHighlighting = (jsonObj) => {
    // Convert JSON to a vertical display format that won't overflow
    const renderJsonAsTable = (obj, depth = 0) => {
      // For primitive values, just return them formatted
      if (typeof obj !== 'object' || obj === null) {
        return renderPrimitiveValue(obj);
      }
      
      // Recursive table builder
      const rows = [];
      
      // Handle arrays or objects
      const isArray = Array.isArray(obj);
      
      // For each key/index in the object/array
      Object.entries(obj).forEach(([key, value], index) => {
        // Create indentation based on depth
        const indent = '  '.repeat(depth);
        const displayKey = isArray ? `[${key}]` : key;
        
        // If value is an object, recurse, otherwise format the primitive
        if (typeof value === 'object' && value !== null) {
          // For objects/arrays, create a row with the key and a placeholder
          rows.push(
            `<tr>
              <td class="json-key-cell">${indent}${displayKey}:</td>
              <td class="json-value-cell">${isArray ? '[]' : '{'}...</td>
            </tr>`
          );
          
          // Add the nested object as indented rows
          rows.push(renderJsonAsTable(value, depth + 1));
          
          // Close the object
          rows.push(
            `<tr>
              <td class="json-key-cell">${indent}</td>
              <td class="json-value-cell">${isArray ? ']' : '}'}</td>
            </tr>`
          );
        } else {
          // For primitive values, just add a row with the key and value
          rows.push(
            `<tr>
              <td class="json-key-cell">${indent}${displayKey}:</td>
              <td class="json-value-cell">${renderPrimitiveValue(value)}</td>
            </tr>`
          );
        }
      });
      
      return rows.join('');
    };
    
    // Helper to format primitive values with truncation and highlighting
    const renderPrimitiveValue = (value) => {
      // Format and truncate based on type
      if (typeof value === 'string') {
        // Truncate long strings
        const displayValue = value.length > 30 
          ? `"${value.substring(0, 30)}..."` 
          : `"${value}"`;
        return `<span class="json-string">${displayValue}</span>`;
      } else if (typeof value === 'number') {
        return `<span class="json-number">${value}</span>`;
      } else if (typeof value === 'boolean') {
        return `<span class="json-boolean">${value}</span>`;
      } else if (value === null) {
        return `<span class="json-null">null</span>`;
      } else {
        return `<span>${String(value)}</span>`;
      }
    };
    
    // Create the table HTML
    const tableHtml = `
      <table class="json-table">
        <tbody>
          ${renderJsonAsTable(jsonObj)}
        </tbody>
      </table>
    `;
    
    // Return the HTML table with inline styles for containment
    return (
      <div 
        className="content-json-container" 
        dangerouslySetInnerHTML={{ __html: tableHtml }}
      />
    );
  };
  
  // Process and display content based on type
  const renderContent = () => {
    if (!selectedItem) {
      return <div className="empty-content">No content available</div>;
    }
    
    const contentType = selectedItem.contentType || { mimeType: 'text/plain' };
    
    // Handle different content types
    if (contentType.mimeType?.startsWith('image/')) {
      // For images, we need to create a data URL from the API response
      const isGif = contentType.mimeType === 'image/gif';
      
      return (
        <ContentWrapper className="image-wrapper">
          {imageError ? (
            <div className="content-error">
              <p>Unable to load image preview</p>
              <button 
                className="btn btn-small" 
                onClick={() => {
                  setImageError(false);
                  setRetryCount(prev => prev + 1);
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <div className={`image-container ${isGif ? 'gif-container' : ''}`}>
              {!imageLoaded && <div className="content-loading">Loading image...</div>}
              {imageLoaded && imageData && (
                <img 
                  ref={imageRef}
                  src={imageData}
                  alt={selectedItem.name || 'Content Preview'} 
                  className={`content-image loaded ${isGif ? 'gif-image' : ''}`}
                  onError={(e) => {
                    console.error("Image load error:", e);
                    setImageError(true);
                  }}
                />
              )}
            </div>
          )}
        </ContentWrapper>
      );
    } else if (contentType.mimeType === 'application/pdf') {
      return (
        <ContentWrapper className="pdf-wrapper">
          <div className="pdf-container">
            <iframe 
              src={`/api/card-collection?action=get&hash=${selectedItem.hash}`} 
              className="pdf-frame" 
              title="PDF Viewer"
            ></iframe>
          </div>
        </ContentWrapper>
      );
    } else if (contentType.mimeType?.startsWith('audio/')) {
      return (
        <ContentWrapper className="audio-wrapper">
          <audio controls className="content-audio">
            <source 
              src={`/api/card-collection?action=get&hash=${selectedItem.hash}`} 
              type={contentType.mimeType} 
            />
            Your browser does not support the audio element.
          </audio>
        </ContentWrapper>
      );
    } else if (contentType.mimeType.startsWith('video/') || contentType.mimeType === 'video/quicktime') {
      // Use our new VideoPlayer component for video content
      return (
        <ContentWrapper className="video-wrapper">
          <VideoPlayer 
            hash={selectedItem.hash} 
            contentType={contentType.mimeType} 
            content={selectedItem.content}
          />
        </ContentWrapper>
      );
    } else if (contentType.mimeType === 'text/html') {
      // For HTML content, we'll fetch it and then render it
      return (
        <ContentWrapper className="html-wrapper">
          {selectedItem.content ? (
            <div className="html-content" dangerouslySetInnerHTML={{ __html: selectedItem.content }}></div>
          ) : (
            <iframe 
              src={`/api/card-collection?action=get&hash=${selectedItem.hash}`} 
              className="html-frame" 
              title="HTML Viewer"
              sandbox="allow-same-origin"
            ></iframe>
          )}
        </ContentWrapper>
      );
    } else if (contentType.mimeType === 'application/json' || 
              (typeof selectedItem.content === 'string' && selectedItem.content.trim().startsWith('{'))) {
      // Parse JSON if it's not already an object
      let jsonContent;
      try {
        jsonContent = typeof selectedItem.content === 'string' 
          ? JSON.parse(selectedItem.content) 
          : selectedItem.content;
      } catch (e) {
        console.error('Error parsing JSON:', e);
        return (
          <ContentWrapper className="text-wrapper">
            <pre className="content-text">
              {typeof selectedItem.content === 'string' 
                ? selectedItem.content 
                : JSON.stringify(selectedItem.content, null, 2)}
            </pre>
          </ContentWrapper>
        );
      }
      
      return (
        <ContentWrapper className="json-wrapper">
          {renderJsonWithHighlighting(jsonContent)}
        </ContentWrapper>
      );
    } else if (contentType.mimeType === 'text/csv' || contentType.extension === 'csv') {
      return (
        <ContentWrapper className="csv-wrapper">
          <div className="csv-content">
            <table className="csv-table">
              <tbody>
                {typeof selectedItem.content === 'string' && 
                  selectedItem.content.split('\n').map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.split(',').map((cell, cellIndex) => (
                        <td key={cellIndex} className="csv-cell">
                          {cell.length > 50 ? cell.substring(0, 47) + '...' : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </ContentWrapper>
      );
    } else {
      // Default text display
      return (
        <ContentWrapper className="text-wrapper">
          <div className="content-controls">
            <div className="text-content-options">
              <label>
                <input 
                  type="checkbox" 
                  checked={!wordWrap} 
                  onChange={() => setWordWrap(!wordWrap)} 
                />
                Disable word wrap
              </label>
            </div>
            <pre className={`content-text ${!wordWrap ? 'wrap-text' : 'nowrap-text'}`}>
              {typeof selectedItem.content === 'string' 
                ? selectedItem.content 
                : JSON.stringify(selectedItem.content, null, 2)}
            </pre>
          </div>
        </ContentWrapper>
      );
    }
  };
  
  return (
    <div className="catalog-detail-view">
      <div className="catalog-detail-header">
        <button 
          className="btn btn-back"
          onClick={onBack}
        >
          Back
        </button>
        <h2>{selectedItem.name}</h2>
      </div>
      
      <div className="catalog-detail-content">
        <div className="catalog-detail-info">
          <div className="info-section">
            <p><strong>Hash:</strong> {selectedItem.hash}</p>
            <p><strong>Type:</strong> {
              selectedItem.contentType?.mimeType 
                ? getFormattedContentType(selectedItem.contentType.mimeType)
                : 'Unknown'
            }</p>
            <p><strong>Date:</strong> {selectedItem.timestamp || 'Unknown'}</p>
          </div>
          
          <div className="content-section">
            <h3>Content</h3>
            <div className="content-container">
              {renderContent()}
            </div>
          </div>
          
          <div className="catalog-detail-actions">
            <button 
              className="btn btn-danger"
              onClick={() => onDeleteItem(selectedItem.hash)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailView;
