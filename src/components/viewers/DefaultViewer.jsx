// src/components/viewers/DefaultViewer.jsx
import React from 'react';

/**
 * Default viewer for content when no specific viewer is available
 */
export const DefaultViewer = ({ content, contentType }) => {
  // Try to determine if content could be displayed nicely
  const formattedContent = React.useMemo(() => {
    if (typeof content === 'string') {
      return content;
    } 
    
    if (content === null) {
      return 'null';
    }
    
    if (typeof content === 'object') {
      try {
        return JSON.stringify(content, null, 2);
      } catch (e) {
        return 'Error formatting content: ' + e.message;
      }
    }
    
    return String(content);
  }, [content]);
  
  // Show some information about the content type
  const mimeType = contentType?.mimeType || 'unknown/unknown';
  const extension = contentType?.extension || '';
  
  return (
    <div className="p-4 bg-gray-100 rounded h-full overflow-auto">
      <div className="text-xs text-gray-500 mb-2 flex justify-between items-center">
        <span>
          <span className="font-medium">Type:</span> {mimeType}
          {extension && <span> (.{extension})</span>}
        </span>
        <span className="italic">Using default viewer</span>
      </div>
      
      <div className="text-sm font-mono text-gray-800 whitespace-pre-wrap border border-gray-200 p-3 rounded bg-white">
        {formattedContent}
      </div>
    </div>
  );
};

export default DefaultViewer;
