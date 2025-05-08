import React, { useState, useEffect, useRef } from 'react';
import { getSimpleContentType, getContentTypeDisplay, determineCorrectContentType } from './utils';
import { ContentService } from '../../../services/content-service';
import { processContent, isImageType } from '../../../utils/content-utils';
import VideoPlayer from '../../viewers/VideoPlayer';
import PDFViewer from '../../viewers/PDFViewer';
import AudioViewer from '../../viewers/AudioViewer';
import PythonViewer from '../../viewers/PythonViewer';
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
  const [rawContent, setRawContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState(null);
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
      setRawContent(null);
      setContentLoading(false);
      setContentError(null);
    }
  }, [selectedItem?.hash]);

  useEffect(() => {
    if (selectedItem?.hash) {
      document.title = `Card - ${selectedItem.hash.substring(0, 8)}`;
    }
    return () => {
      document.title = 'Card Catalog';
    };
  }, [selectedItem]);

  // For PDF content, create a direct link to the file
  const getPdfDirectUrl = (hash) => {
    // Use direct file access with the raw parameter to bypass content processing
    return `/api/card-collection?action=get&hash=${hash}&raw=true&forceDownload=false`;
  };

  // Fetch content for the selected item
  useEffect(() => {
    if (!selectedItem?.hash) return;
    
    setContentLoading(true);
    setImageLoaded(false);
    setImageError(false);
    
    // Determine if we need special content processing
    const needsBinaryProcessing = 
      selectedItem.contentType?.mimeType?.startsWith('image/') ||
      selectedItem.contentType?.mimeType === 'application/pdf' ||
      selectedItem.contentType?.mimeType?.startsWith('audio/') ||
      selectedItem.contentType?.mimeType?.startsWith('video/');
    
    console.log(`Loading content for item: ${selectedItem.hash}, type: ${selectedItem.contentType?.mimeType}`);
    
    // Use ContentService to fetch and process content
    ContentService.fetchContent(selectedItem.hash, { maxRetries: 3 })
      .then(result => {
        setContentLoading(false);
        
        if (result.error) {
          console.error("Error loading content:", result.error);
          setContentError(result.error);
          return;
        }
        
        // Store raw content for specialized viewers (PDF, Video, Audio)
        if (result.raw) {
          setRawContent(result.raw.content || result.raw);
        }
        
        // For image content, create a data URL
        if (isImageType(selectedItem.contentType)) {
          if (result.processed && result.processed.type === 'dataUrl') {
            // Already processed to data URL
            setImageData(result.processed.url);
            setImageLoaded(true);
          } else if (result.raw?.content) {
            // Process the content
            const processed = processContent(result.raw.content, selectedItem.contentType);
            
            if (processed.type === 'dataUrl') {
              setImageData(processed.url);
              setImageLoaded(true);
            } else {
              console.error("Unexpected content format:", processed.type);
              setContentError("Failed to process image data");
            }
          } else {
            setContentError("No valid content found in API response");
          }
        }
        
        // Store full content data for JSON, text, etc.
        setContentData(result);
      })
      .catch(error => {
        console.error("Error loading content:", error);
        setContentLoading(false);
        setContentError(`Failed to load content: ${error.message || 'Unknown error'}`);
        
        if (isImageType(selectedItem.contentType)) {
          setImageError(true);
        }
      });
      
  }, [selectedItem?.hash, retryCount]);

  // Helper function to get proper content type display
  const getFormattedContentType = (mimeType) => {
    if (!mimeType) return 'Unknown';
    
    const simpleType = getSimpleContentType(mimeType);
    if (!simpleType) return mimeType;
    
    return `${contentTypeMap[simpleType] || simpleType.toUpperCase()} (${mimeType})`;
  };

  // Helper function to detect if content is binary data
  const isBinaryContent = (data) => {
    if (!data) return false;
    
    // Check if it's a string that looks like binary data (contains many non-printable characters)
    if (typeof data === 'string') {
      // Simple heuristic: if string contains many non-printable characters or appears to be binary
      const nonPrintableChars = data.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g);
      return nonPrintableChars && nonPrintableChars.length > (data.length * 0.1); // More than 10% non-printable
    }
    
    // If it's an object that looks like a buffer or array of numbers
    if (
      (typeof data === 'object' && 
       data !== null && 
       (data.type === 'Buffer' || data instanceof Uint8Array || 
        (Array.isArray(data) && data.length > 0 && typeof data[0] === 'number')))
    ) {
      return true;
    }
    
    return false;
  };

  // Helper function to format file size
  const formatFileSize = (size) => {
    if (size < 1024) return `${size} bytes`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Get correct content type for display
  const getDisplayContentType = () => {
    if (!selectedItem?.contentType?.mimeType) return 'Unknown';
    
    // Handle special case for QuickTime videos that are actually MP4s
    if (selectedItem.contentType.mimeType === 'video/quicktime') {
      console.log('Converting QuickTime content type display to MP4');
      return 'MP4 (video/mp4)';
    }
    
    // Use the standard formatting function for all other content types
    return getFormattedContentType(selectedItem.contentType.mimeType);
  };

  // Format content for display
  const getFormattedContent = (content, contentType) => {
    // Check if content is a buffer represented as JSON
    if (content && typeof content === 'object' && content.type === 'Buffer' && Array.isArray(content.data)) {
      // For Python files, convert to text
      if (contentType && 
          (contentType.mimeType === 'text/x-python-script' || 
           contentType.mimeType === 'text/x-python' ||
           (contentType.extension === 'py'))) {
        try {
          // Convert buffer data to text
          const array = new Uint8Array(content.data);
          return new TextDecoder().decode(array);
        } catch (e) {
          console.error('Error decoding Python file content:', e);
        }
      }

      // For image types, return the content as is
      if (contentType && contentType.mimeType && contentType.mimeType.startsWith('image/')) {
        return content;
      }

      // For text files that might be incorrectly stored as buffers
      if (contentType && 
          (contentType.mimeType?.startsWith('text/') || 
           contentType.mimeType === 'application/json')) {
        try {
          const array = new Uint8Array(content.data);
          return new TextDecoder().decode(array);
        } catch (e) {
          console.error('Error decoding text content:', e);
        }
      }
    }

    // If content is a string, try to parse it if it looks like JSON
    if (typeof content === 'string' && 
        (content.startsWith('{') || content.startsWith('[')) && 
        contentType?.mimeType === 'application/json') {
      try {
        return JSON.stringify(JSON.parse(content), null, 2);
      } catch (e) {
        // If parsing fails, just return the original string
        return content;
      }
    }

    // Return as is for all other cases
    return content;
  };

  // Render item details section
  const renderItemDetails = () => {
    return (
      <div className="info-section">
        <p><strong>Hash:</strong> {selectedItem.hash}</p>
        <p><strong>Type:</strong> {getDisplayContentType()}</p>
        <p><strong>Date:</strong> {selectedItem.timestamp || 'Unknown'}</p>
      </div>
    );
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
  const ContentWrapper = ({ children, className = '', fullWidth = false }) => (
    <div className={`universal-content-wrapper ${className} ${fullWidth ? 'full-width' : ''}`}>
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
    
    // Special handler for PDFs - prioritize this at the very top
    if (contentType.mimeType === 'application/pdf') {
      console.log("Rendering PDF with direct object approach");
      // Create a direct URL to the raw PDF content
      const pdfUrl = getPdfDirectUrl(selectedItem.hash);
      
      return (
        <ContentWrapper className="pdf-wrapper">
          <div className="pdf-container">
            <object
              data={pdfUrl}
              type="application/pdf"
              className="pdf-frame"
              aria-label="PDF Document"
            >
              <p>
                Your browser doesn't support PDF viewing.
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  Download PDF
                </a>
              </p>
            </object>
          </div>
        </ContentWrapper>
      );
    }
    
    // Handle binary data that may be misclassified
    if (contentData && isBinaryContent(contentData.raw?.content || contentData.raw)) {
      console.log("Detected binary content, proper rendering required", contentType.mimeType);
      
      // Skip binary handling for known file types that are binary by nature
      if (contentType.mimeType === 'application/pdf' || 
          contentType.mimeType.startsWith('image/') ||
          contentType.mimeType.startsWith('video/') ||
          contentType.mimeType.startsWith('audio/')) {
        // Let the specific handlers below deal with these known binary formats
        console.log("Skipping binary fallback for known binary file type:", contentType.mimeType);
      }
      // Only use binary fallback for octet-stream or unknown binary content
      else if (contentType.mimeType === 'application/octet-stream' || 
          contentType.mimeType === 'binary/octet-stream') {
        // Treat as a binary file with download option
        return (
          <ContentWrapper className="binary-wrapper">
            <div className="binary-container">
              <div className="binary-info">
                <div className="binary-icon">📄</div>
                <h3>Binary File</h3>
                <p>This appears to be a binary file that cannot be displayed in the browser.</p>
                <p>Content type: {contentType.mimeType}</p>
                {contentData && contentData.raw && (
                  <p>File size: {formatFileSize(
                    contentData.raw.content ? 
                    contentData.raw.content.length || 0 : 
                    contentData.raw.length || 0
                  )}</p>
                )}
                <a 
                  href={`/api/card-collection?action=get&hash=${selectedItem.hash}`}
                  download={`${selectedItem.hash.substring(0, 8)}.bin`}
                  className="btn btn-primary"
                >
                  Download File
                </a>
              </div>
            </div>
          </ContentWrapper>
        );
      }
    }
    
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
    } else if (contentType.mimeType?.startsWith('video/')) {
      console.log('Rendering video content:', contentType.mimeType);
      return (
        <div className="video-display-container">
          <VideoPlayer 
            hash={selectedItem.hash} 
            contentType={contentType} 
            content={contentData?.raw?.content || contentData?.raw}
          />
        </div>
      );
    } else if (contentType.mimeType?.startsWith('audio/')) {
      return (
        <ContentWrapper className="audio-wrapper">
          <AudioViewer 
            hash={selectedItem.hash}
            content={rawContent}
            contentType={contentType}
            format={contentType.extension || "audio"}
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
    } else if (contentType.mimeType === 'text/x-python-script' || 
               contentType.mimeType === 'text/x-python' || 
               contentType.extension === 'py') {
      // Use the specialized Python viewer for Python files
      console.log("Rendering Python file with syntax highlighting");
      return (
        <ContentWrapper className="python-wrapper">
          <PythonViewer 
            content={selectedItem.content} 
            hash={selectedItem.hash}
          />
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
      const content = getFormattedContent(selectedItem.content, contentType);
      
      // Convert content to string if it's an object (including Buffer)
      const displayContent = typeof content === 'object' && content !== null
        ? JSON.stringify(content, null, 2) // Pretty print if it's an object
        : content;
        
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
              {displayContent}
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
          {renderItemDetails()}
          
          <div className="content-section">
            <h3>Content</h3>
            <div className="content-container">
              {contentLoading ? (
                <div className="content-loading">Loading content...</div>
              ) : contentError ? (
                <div className="content-error">
                  <p>{contentError}</p>
                  <button 
                    className="btn btn-small" 
                    onClick={() => {
                      setContentError(null);
                      setRetryCount(prev => prev + 1);
                    }}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                renderContent()
              )}
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
