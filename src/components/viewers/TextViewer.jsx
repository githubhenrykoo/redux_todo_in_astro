// src/components/viewers/TextViewer.jsx
import React, { useState, useEffect } from 'react';
import { convertBufferToString } from '../../utils/bufferContentHelper';

/**
 * Viewer component that displays text content with syntax highlighting
 */
export default function TextViewer({ content, contentType }) {
  const [textContent, setTextContent] = useState('');
  const [error, setError] = useState(null);
  
  // Process content on component mount or when content changes
  useEffect(() => {
    try {
      console.log("TextViewer received content:", typeof content);
      
      // Convert any type of content to string using our utility
      const processedContent = convertBufferToString(content);
      
      if (processedContent) {
        setTextContent(processedContent);
        setError(null);
      } else {
        setTextContent('');
        setError('Failed to process content');
      }
    } catch (err) {
      console.error("Error in TextViewer:", err);
      setTextContent('');
      setError(`Error processing content: ${err.message}`);
    }
  }, [content]);

  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  return (
    <div className="font-mono whitespace-pre-wrap break-all text-sm overflow-auto max-w-full">
      {textContent || 'No content available'}
    </div>
  );
}
