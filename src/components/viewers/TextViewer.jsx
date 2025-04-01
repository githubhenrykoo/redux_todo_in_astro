// src/components/viewers/TextViewer.jsx
import React from 'react';

/**
 * A viewer for plain text content that handles various formats:
 * - Direct strings
 * - Base64 encoded content (from API)
 * - Buffer JSON format (for backward compatibility)
 */
export const TextViewer = ({ content }) => {
  let textContent = '';
  
  // First, check if we already have a plain string (from server-side processing)
  if (typeof content === 'string') {
    textContent = content;
  } 
  // If we get a Buffer JSON format, decode it
  else if (content && typeof content === 'object') {
    if (content.type === 'base64' && content.data) {
      // Base64 format from API
      try {
        // Convert base64 to string
        const binary = atob(content.data);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
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
    <div className="whitespace-pre-wrap font-mono text-sm p-2 overflow-auto max-h-full">
      {textContent}
    </div>
  );
};

export default TextViewer;
