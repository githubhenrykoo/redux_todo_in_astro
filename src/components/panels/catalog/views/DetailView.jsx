import React, { useState } from 'react';
import { getSimpleContentType } from '../utils/contentTypeUtils';

/**
 * DetailView component for displaying detailed information about a catalog item
 */
const DetailView = ({ 
  item, 
  isLoading, 
  error, 
  onBack, 
  onDelete 
}) => {
  const [wordWrap, setWordWrap] = useState(true);

  if (isLoading) {
    return <div className="loading-indicator">Loading item details...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (!item) {
    return <div className="error-message">Item not found</div>;
  }
  
  // Universal content wrapper to enforce containment
  const ContentWrapper = ({ children, className = '' }) => (
    <div className={`universal-content-wrapper ${className}`}>
      {children}
    </div>
  );
  
  // Process and display content based on type
  const renderContent = () => {
    if (!item?.content) {
      return <div className="empty-content">No content available</div>;
    }
    
    const contentType = item.contentType || { mimeType: 'text/plain' };
    
    // Handle different content types
    if (contentType.mimeType?.startsWith('image/')) {
      return (
        <ContentWrapper className="image-wrapper">
          <img src={`data:${contentType.mimeType};base64,${item.content}`} alt="Content Preview" className="content-image" />
        </ContentWrapper>
      );
    } else if (contentType.mimeType === 'application/pdf') {
      return (
        <ContentWrapper className="pdf-wrapper">
          <div className="pdf-container">
            <iframe src={`data:${contentType.mimeType};base64,${item.content}`} className="pdf-frame" title="PDF Viewer"></iframe>
          </div>
        </ContentWrapper>
      );
    } else if (contentType.mimeType?.startsWith('audio/')) {
      return (
        <ContentWrapper className="audio-wrapper">
          <audio controls className="content-audio">
            <source src={`data:${contentType.mimeType};base64,${item.content}`} type={contentType.mimeType} />
            Your browser does not support the audio element.
          </audio>
        </ContentWrapper>
      );
    } else if (contentType.mimeType?.startsWith('video/')) {
      return (
        <ContentWrapper className="video-wrapper">
          <video controls className="content-video">
            <source src={`data:${contentType.mimeType};base64,${item.content}`} type={contentType.mimeType} />
            Your browser does not support the video element.
          </video>
        </ContentWrapper>
      );
    } else if (contentType.mimeType === 'text/html') {
      return (
        <ContentWrapper className="html-wrapper">
          <div className="html-content" dangerouslySetInnerHTML={{ __html: item.content }}></div>
        </ContentWrapper>
      );
    } else if (contentType.mimeType === 'application/json' || 
               (typeof item.content === 'string' && item.content.trim().startsWith('{'))) {
      // Parse JSON if it's not already an object
      let jsonContent;
      try {
        jsonContent = typeof item.content === 'string' 
          ? JSON.parse(item.content) 
          : item.content;
      } catch (e) {
        console.error('Error parsing JSON:', e);
        return (
          <ContentWrapper className="text-wrapper">
            <pre className="content-text">
              {typeof item.content === 'string' 
                ? item.content 
                : JSON.stringify(item.content, null, 2)}
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
                {typeof item.content === 'string' && 
                  item.content.split('\n').map((row, rowIndex) => (
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
              {typeof item.content === 'string' 
                ? item.content 
                : JSON.stringify(item.content, null, 2)}
            </pre>
          </div>
        </ContentWrapper>
      );
    }
  };

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

  return (
    <div className="catalog-detail-view">
      <div className="catalog-detail-header">
        <button 
          className="btn btn-back"
          onClick={onBack}
        >
          Back
        </button>
        <h2>{item.name}</h2>
      </div>
      
      <div className="catalog-detail-content">
        <div className="catalog-detail-info">
          <div className="info-section">
            <p><strong>Hash:</strong> {item.hash}</p>
            <p><strong>Type:</strong> {
              item.contentType?.mimeType 
                ? `${getSimpleContentType(item.contentType.mimeType) || item.contentType.mimeType} (${item.contentType.mimeType})` 
                : 'Unknown'
            }</p>
            <p><strong>gtime:</strong> {new Date(item.timestamp).toLocaleString()}</p>
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
              onClick={() => onDelete(item.hash)}
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
