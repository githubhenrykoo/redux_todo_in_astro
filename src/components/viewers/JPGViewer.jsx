// src/components/viewers/JPGViewer.jsx
import React, { useState, useEffect, useMemo } from 'react';

/**
 * A specialized viewer for JPG/JPEG images
 */
export const JPGViewer = ({ content, contentType }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jpegSource, setJpegSource] = useState(null);
  
  // Process the content and set the appropriate state
  useEffect(() => {
    const processContent = () => {
      // If content is already a data URL or external URL
      if (typeof content === 'string' && 
          (content.startsWith('data:') || content.startsWith('http'))) {
        setJpegSource(content);
        return;
      }
      
      // If content is a Uint8Array or ArrayBuffer, convert to base64
      if (content instanceof Uint8Array || content instanceof ArrayBuffer) {
        try {
          const array = content instanceof ArrayBuffer ? new Uint8Array(content) : content;
          const bytes = Array.from(array).map(byte => String.fromCharCode(byte)).join('');
          const base64 = btoa(bytes);
          setJpegSource(`data:image/jpeg;base64,${base64}`);
          return;
        } catch (e) {
          setError("Unable to display JPEG: Error converting binary data");
          return;
        }
      }
      
      // If it's a string that's not a URL, it might be base64 without the prefix
      if (typeof content === 'string') {
        try {
          // Test if it's valid base64
          btoa(atob(content));
          setJpegSource(`data:image/jpeg;base64,${content}`);
          return;
        } catch (e) {
          setError("Unable to display JPEG: Invalid format");
          return;
        }
      }
      
      setError("Unable to display JPEG: Unsupported format");
    };
    
    processContent();
  }, [content]); // Only re-run when content changes
  
  // Format file size for display
  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return 'Unknown size';
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
    else return (bytes / 1073741824).toFixed(2) + ' GB';
  };
  
  // Get size from content if possible - using useMemo to avoid recalculation on each render
  const size = useMemo(() => {
    if (content instanceof ArrayBuffer) {
      return content.byteLength;
    } else if (content instanceof Uint8Array) {
      return content.byteLength;
    } else if (typeof content === 'string') {
      // For base64 encoded data
      if (content.startsWith('data:')) {
        const base64Content = content.split(',')[1];
        return Math.ceil(base64Content.length * 0.75); // Approximate size
      }
      return new TextEncoder().encode(content).length;
    } 
    return null;
  }, [content]);
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-50">
        <div className="text-red-500 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="font-medium">{error}</p>
          <p className="text-sm text-gray-600 mt-2">File type: JPEG</p>
          {size && <p className="text-sm text-gray-600">Size: {formatFileSize(size)}</p>}
        </div>
      </div>
    );
  }
  
  if (!jpegSource) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-50">
        <div className="text-gray-500 text-center">
          <div className="text-5xl mb-4">🖼️</div>
          <p className="font-medium">Unable to display JPEG</p>
          <p className="text-sm text-gray-600 mt-2">
            The provided content could not be converted to a viewable JPEG.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-50 overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <div className="animate-pulse text-gray-500">Loading image...</div>
        </div>
      )}
      
      <div className="relative max-w-full max-h-full overflow-auto">
        <img
          src={jpegSource}
          alt="JPEG image"
          className="max-w-full object-contain"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError("Failed to load JPEG");
          }}
        />
      </div>
      
      <div className="mt-2 text-sm text-gray-600 text-center">
        <p>JPEG Image</p>
        {size && <p>Size: {formatFileSize(size)}</p>}
      </div>
    </div>
  );
};

export default JPGViewer;
