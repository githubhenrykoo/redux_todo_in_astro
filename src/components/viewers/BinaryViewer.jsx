// src/components/viewers/BinaryViewer.jsx
import React from 'react';

/**
 * A viewer for binary data that can't be directly displayed
 */
export const BinaryViewer = ({ content, contentType }) => {
  // Format file size for display
  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return 'Unknown size';
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
    else return (bytes / 1073741824).toFixed(2) + ' GB';
  };
  
  // Get size from binary content
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
  
  // Try to get some info about the content
  const size = getContentSize();
  const mimeType = contentType?.mimeType || 'application/octet-stream';
  const extension = contentType?.extension || '';
  
  // Handle content that has link/URL
  const hasDownloadLink = typeof content === 'string' && 
    (content.startsWith('data:') || content.startsWith('http'));
  
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-gray-50 rounded">
      <div className="text-center">
        <div className="text-6xl mb-4">📁</div>
        <h3 className="text-xl font-medium mb-2">Binary Content</h3>
        
        <div className="text-sm text-gray-600 mb-4">
          <p><strong>Type:</strong> {mimeType}</p>
          {extension && <p><strong>Extension:</strong> {extension}</p>}
          <p><strong>Size:</strong> {formatFileSize(size)}</p>
        </div>
        
        {hasDownloadLink && (
          <a 
            href={content}
            download={`download${extension ? '.' + extension : ''}`}
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download File
          </a>
        )}
        
        {!hasDownloadLink && (
          <p className="text-gray-500">
            This binary content cannot be displayed directly in the browser.
          </p>
        )}
      </div>
    </div>
  );
};

export default BinaryViewer;
