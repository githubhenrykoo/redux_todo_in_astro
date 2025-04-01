// src/components/viewers/TextViewer.jsx
import React from 'react';
import { SafeBuffer } from '../../utils/bufferPolyfill.js';

/**
 * A viewer for plain text content that handles various formats:
 * - Direct strings
 * - Base64 encoded content (from API)
 * - Buffer JSON format (for backward compatibility)
 */
export const TextViewer = ({ content }) => {
  // Process content based on format
  let textContent;
  
  if (typeof content === 'string') {
    // Direct string format - already text
    textContent = content;
  } 
  else if (content && typeof content === 'object') {
    if (content.type === 'base64' && content.data) {
      // New base64 format from API
      try {
        // Decode base64 to text
        const bytes = atob(content.data);
        const array = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
          array[i] = bytes.charCodeAt(i);
        }
        textContent = new TextDecoder().decode(array);
      } catch (e) {
        console.error('Error decoding base64 content:', e);
        textContent = `[Error decoding content: ${e.message}]`;
      }
    }
    else if (content.type === 'Buffer' && Array.isArray(content.data)) {
      // Legacy Buffer JSON format
      try {
        const array = new Uint8Array(content.data);
        textContent = new TextDecoder().decode(array);
      } catch (e) {
        console.error('Error decoding Buffer content:', e);
        textContent = `[Error decoding content: ${e.message}]`;
      }
    }
    else {
      // Other object types - stringify with formatting
      textContent = JSON.stringify(content, null, 2);
    }
  }
  else {
    // Fallback for other types
    textContent = String(content || '');
  }
  
  return (
    <div className="p-4 font-mono text-sm overflow-auto h-full bg-gray-50 rounded">
      <pre className="whitespace-pre-wrap break-words">
        {textContent}
      </pre>
    </div>
  );
};

export default TextViewer;
