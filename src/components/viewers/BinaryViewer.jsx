// src/components/viewers/BinaryViewer.jsx
import React from 'react';

/**
 * A viewer for binary content that displays file size and hex preview
 */
export const BinaryViewer = ({ content }) => {
  // Get the size of the content
  const getContentSize = () => {
    if (!content) return 0;
    
    // Handle Node.js Buffer JSON format
    if (typeof content === 'object' && content !== null && 
        content.type === 'Buffer' && Array.isArray(content.data)) {
      return content.data.length;
    }
    
    // Handle regular string
    if (typeof content === 'string') {
      return content.length;
    }
    
    // Handle array buffers and typed arrays
    if (content instanceof ArrayBuffer || 
        content instanceof Uint8Array || 
        content instanceof Int8Array) {
      return content.byteLength;
    }
    
    // Fallback: convert to string and get length
    return String(content).length;
  };

  // Convert binary data to a hex string for preview
  const getHexPreview = () => {
    if (!content) return '';
    
    try {
      let bytes;
      
      // Handle Node.js Buffer JSON format
      if (typeof content === 'object' && content !== null && 
          content.type === 'Buffer' && Array.isArray(content.data)) {
        bytes = new Uint8Array(content.data);
      }
      // Handle typed arrays
      else if (content instanceof Uint8Array || content instanceof Int8Array) {
        bytes = content;
      }
      // Handle ArrayBuffer
      else if (content instanceof ArrayBuffer) {
        bytes = new Uint8Array(content);
      }
      // Handle string by converting to array of char codes
      else if (typeof content === 'string') {
        bytes = new Uint8Array(content.split('').map(c => c.charCodeAt(0)));
      }
      // Fallback
      else {
        return 'Unable to generate hex preview';
      }
      
      // Generate hex representation (limit to first 500 bytes)
      const maxBytes = Math.min(bytes.length, 500);
      const hexChunks = [];
      
      for (let i = 0; i < maxBytes; i++) {
        // Convert to hex and pad with leading zero if needed
        hexChunks.push(bytes[i].toString(16).padStart(2, '0'));
        
        // Add space every 2 bytes (1 hex pair)
        if (i % 2 === 1) hexChunks.push(' ');
        
        // Add newline every 16 bytes (8 hex pairs)
        if (i % 16 === 15) hexChunks.push('\n');
      }
      
      return hexChunks.join('');
    } catch (e) {
      console.error('Error generating hex preview:', e);
      return 'Error generating hex preview';
    }
  };

  const size = getContentSize();
  const hexPreview = getHexPreview();

  return (
    <div className="p-4 font-mono text-sm overflow-auto max-h-full bg-gray-50 rounded">
      <div className="mb-4">
        <span className="font-bold">Binary Data</span>
        <span className="ml-2 text-gray-500">({size} bytes)</span>
      </div>
      
      <div className="border border-gray-200 p-2 rounded bg-white">
        <pre className="whitespace-pre-wrap break-all text-xs">
          {hexPreview}
          {size > 500 && (
            <div className="mt-2 text-gray-500 italic">
              ... {size - 500} more bytes not shown
            </div>
          )}
        </pre>
      </div>
    </div>
  );
};

export default BinaryViewer;
