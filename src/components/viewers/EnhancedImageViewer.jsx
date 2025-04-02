'use client';

import React, { useState, useEffect } from 'react';

/**
 * Enhanced image viewer with zoom capabilities and improved Buffer handling
 */
const EnhancedImageViewer = ({ content, contentType }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [imageInfo, setImageInfo] = useState({ width: 0, height: 0, format: 'unknown' });

  useEffect(() => {
    const processImageContent = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Case 1: Content is already a data URL
        if (typeof content === 'string' && content.startsWith('data:image')) {
          console.log("EnhancedImageViewer: Using direct data URL");
          setImageUrl(content);
          return;
        }
        
        // Case 2: Content is a Buffer JSON object
        if (content && typeof content === 'object' && content.type === 'Buffer' && Array.isArray(content.data)) {
          try {
            const array = new Uint8Array(content.data);
            // Determine the MIME type from contentType or default to a generic image type
            const mimeType = contentType?.mimeType || 'image/png';
            const base64 = btoa(String.fromCharCode.apply(null, array));
            const dataUrl = `data:${mimeType};base64,${base64}`;
            console.log(`EnhancedImageViewer: Converted buffer to data URL (${mimeType})`);
            setImageUrl(dataUrl);
            return;
          } catch (err) {
            console.error("Error converting buffer to image:", err);
            setError("Failed to convert buffer data to an image");
            return;
          }
        }
        
        // Case 3: Content is a base64 string without the data URL prefix
        if (typeof content === 'string' && /^[A-Za-z0-9+/=]+$/.test(content)) {
          try {
            const mimeType = contentType?.mimeType || 'image/png';
            const dataUrl = `data:${mimeType};base64,${content}`;
            console.log("EnhancedImageViewer: Using base64 string directly");
            setImageUrl(dataUrl);
            return;
          } catch (err) {
            console.error("Error converting base64 to image:", err);
            setError("Failed to convert base64 data to an image");
            return;
          }
        }
        
        // If we get here, we don't know how to handle the content
        console.error("EnhancedImageViewer: Unsupported content format", typeof content);
        setError("Unsupported image format");
      } catch (err) {
        console.error("Error in image processing:", err);
        setError(`Image processing error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    processImageContent();
  }, [content, contentType]);
  
  // Get image dimensions once it loads
  const handleImageLoad = (e) => {
    setLoading(false);
    setImageInfo({
      width: e.target.naturalWidth,
      height: e.target.naturalHeight,
      format: contentType?.mimeType?.split('/')[1] || 'unknown'
    });
  };
  
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 400));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleResetZoom = () => setZoom(100);

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleZoomOut}
            className="p-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            title="Zoom out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <span className="text-sm">{zoom}%</span>
          <button 
            onClick={handleZoomIn}
            className="p-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            title="Zoom in"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <button 
            onClick={handleResetZoom}
            className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            title="Reset zoom"
          >
            Reset
          </button>
        </div>
        
        {!loading && !error && (
          <div className="text-xs text-gray-500">
            {imageInfo.width} × {imageInfo.height} {imageInfo.format}
          </div>
        )}
      </div>
      
      {/* Image container */}
      <div className="flex-1 overflow-auto flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 bg-grid-pattern">
        {loading && (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mb-4"></div>
            <p>Loading image...</p>
          </div>
        )}
        
        {error && (
          <div className="max-w-md p-6 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-medium mb-2">Image Error</h3>
            <p>{error}</p>
          </div>
        )}
        
        {!loading && !error && imageUrl && (
          <div className="relative max-h-full overflow-auto p-4">
            <img 
              src={imageUrl} 
              alt="Image content" 
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
              className="transition-transform duration-200 max-w-none" 
              onLoad={handleImageLoad}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedImageViewer;
