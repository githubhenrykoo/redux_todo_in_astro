// src/components/viewers/ImageViewer.jsx
import React, { useState } from 'react';

/**
 * A viewer for image content types (png, jpg, gif, etc)
 */
export const ImageViewer = ({ content, contentType }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Determine the source for the image
  const getImageSource = () => {
    // If content is already a data URL or external URL
    if (typeof content === 'string' && 
        (content.startsWith('data:') || content.startsWith('http'))) {
      return content;
    }
    
    // If content is a Uint8Array or ArrayBuffer, convert to base64
    if (content instanceof Uint8Array || content instanceof ArrayBuffer) {
      const array = content instanceof ArrayBuffer ? new Uint8Array(content) : content;
      const bytes = Array.from(array).map(byte => String.fromCharCode(byte)).join('');
      const base64 = btoa(bytes);
      const mimeType = contentType?.mimeType || 'image/png';
      return `data:${mimeType};base64,${base64}`;
    }
    
    // If it's a string that's not a URL, it might be base64 without the prefix
    if (typeof content === 'string') {
      try {
        // Test if it's valid base64
        btoa(atob(content));
        const mimeType = contentType?.mimeType || 'image/png';
        return `data:${mimeType};base64,${content}`;
      } catch (e) {
        // Not valid base64, might be binary data as a string
        setError("Unable to display image: Invalid format");
        return null;
      }
    }
    
    setError("Unable to display image: Unsupported format");
    return null;
  };
  
  const imageSource = getImageSource();
  
  // Format file size for display if available
  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return 'Unknown size';
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
    else return (bytes / 1073741824).toFixed(2) + ' GB';
  };
  
  // Get size from content if possible
  const getContentSize = () => {
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
  };
  
  // Get content details
  const size = getContentSize();
  const mimeType = contentType?.mimeType || 'image/png';
  const extension = contentType?.extension || '';
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-50">
        <div className="text-red-500 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="font-medium">{error}</p>
          <p className="text-sm text-gray-600 mt-2">
            File type: {mimeType} {extension ? `(.${extension})` : ''}
          </p>
          {size && <p className="text-sm text-gray-600">Size: {formatFileSize(size)}</p>}
        </div>
      </div>
    );
  }
  
  if (!imageSource) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-50">
        <div className="text-gray-500 text-center">
          <div className="text-5xl mb-4">🖼️</div>
          <p className="font-medium">Unable to display image</p>
          <p className="text-sm text-gray-600 mt-2">
            The provided content could not be converted to a viewable image.
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
          src={imageSource}
          alt={`${extension} image`}
          className="max-w-full object-contain"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError("Failed to load image");
          }}
        />
      </div>
      
      <div className="mt-2 text-sm text-gray-600 text-center">
        <p>{mimeType} {extension ? `(.${extension})` : ''}</p>
        {size && <p>Size: {formatFileSize(size)}</p>}
      </div>
    </div>
  );
};

export default ImageViewer;
