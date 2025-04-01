// src/components/viewers/TextViewer.jsx
import React from 'react';

/**
 * A simple viewer for plain text content
 */
export const TextViewer = ({ content }) => {
  // Ensure content is a string
  const textContent = typeof content === 'string'
    ? content
    : typeof content === 'object'
      ? JSON.stringify(content, null, 2)
      : String(content);
  
  return (
    <div className="p-4 font-mono text-sm overflow-auto h-full bg-gray-50 rounded">
      <pre className="whitespace-pre-wrap break-words">
        {textContent}
      </pre>
    </div>
  );
};

export default TextViewer;
