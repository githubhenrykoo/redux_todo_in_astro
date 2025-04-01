// src/components/viewers/ReduxStateViewer.jsx
import React, { useState } from 'react';

/**
 * A specialized viewer for Redux state objects
 */
export const ReduxStateViewer = ({ content }) => {
  const [expandedSections, setExpandedSections] = useState({});
  
  // Ensure we have a proper object to work with
  const parsedContent = React.useMemo(() => {
    if (!content) return null;
    
    try {
      // Already an object
      if (typeof content === 'object' && content !== null) {
        return content;
      }
      
      // Try to parse JSON string
      if (typeof content === 'string') {
        return JSON.parse(content);
      }
      
      // Handle Buffer JSON format
      if (typeof content === 'object' && content !== null && 
          content.type === 'Buffer' && Array.isArray(content.data)) {
        const array = new Uint8Array(content.data);
        const jsonString = new TextDecoder().decode(array);
        return JSON.parse(jsonString);
      }
    } catch (e) {
      console.error('Error parsing Redux state:', e);
      return null;
    }
    
    return null;
  }, [content]);

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!parsedContent) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded">
        Unable to parse Redux state content
      </div>
    );
  }

  return (
    <div className="p-4 overflow-auto max-h-full bg-gray-50 rounded">
      <h2 className="text-lg font-bold mb-4">Redux State Viewer</h2>
      
      <div className="space-y-4">
        {Object.entries(parsedContent).map(([key, value]) => (
          <div key={key} className="border border-gray-200 rounded bg-white">
            <div 
              className="p-2 bg-gray-100 font-semibold cursor-pointer flex justify-between items-center"
              onClick={() => toggleSection(key)}
            >
              <span>{key}</span>
              <span className="text-xs">{expandedSections[key] ? '▼' : '►'}</span>
            </div>
            
            {expandedSections[key] && (
              <div className="p-3 font-mono text-sm">
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReduxStateViewer;
