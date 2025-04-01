// src/components/viewers/JSONViewer.jsx
import React, { useState } from 'react';

/**
 * A component for displaying JSON data with expandable/collapsible nodes
 */
export const JSONViewer = ({ content }) => {
  const [expandedPaths, setExpandedPaths] = useState(new Set(['root']));
  
  // Parse JSON if it's a string
  const jsonData = typeof content === 'string' 
    ? JSON.parse(content) 
    : content;
  
  // Toggle a path's expanded state
  const togglePath = (path) => {
    const newExpandedPaths = new Set(expandedPaths);
    if (newExpandedPaths.has(path)) {
      newExpandedPaths.delete(path);
    } else {
      newExpandedPaths.add(path);
    }
    setExpandedPaths(newExpandedPaths);
  };
  
  // Render a property key
  const renderKey = (key) => {
    return <span className="text-blue-600">{`"${key}": `}</span>;
  };
  
  // Render a primitive value
  const renderValue = (value) => {
    if (value === null) {
      return <span className="text-gray-500">null</span>;
    }
    
    if (typeof value === 'string') {
      return <span className="text-green-600">{`"${value}"`}</span>;
    }
    
    if (typeof value === 'number') {
      return <span className="text-purple-600">{value}</span>;
    }
    
    if (typeof value === 'boolean') {
      return <span className="text-orange-600">{value ? 'true' : 'false'}</span>;
    }
    
    return <span>{String(value)}</span>;
  };
  
  // Recursively render a JSON node (object or array)
  const renderJSONNode = (node, path = 'root', depth = 0) => {
    const isExpanded = expandedPaths.has(path);
    const indent = '\u00A0'.repeat(depth * 2); // Non-breaking spaces for indentation
    
    if (node === null || node === undefined) {
      return renderValue(node);
    }
    
    if (typeof node !== 'object') {
      return renderValue(node);
    }
    
    const isArray = Array.isArray(node);
    const isEmpty = Object.keys(node).length === 0;
    
    if (isEmpty) {
      return <span>{isArray ? '[]' : '{}'}</span>;
    }
    
    // For collapsed nodes, just show a summary
    if (!isExpanded) {
      const count = Object.keys(node).length;
      const summary = isArray 
        ? `Array(${count})` 
        : `Object with ${count} properties`;
        
      return (
        <div>
          <span 
            className="cursor-pointer font-bold text-gray-800 hover:text-blue-500"
            onClick={() => togglePath(path)}
          >
            {isArray ? '[' : '{'} {summary} {isArray ? ']' : '}'}
          </span>
        </div>
      );
    }
    
    // For expanded nodes, render all children
    return (
      <div>
        <span 
          className="cursor-pointer font-bold text-gray-800 hover:text-blue-500"
          onClick={() => togglePath(path)}
        >
          {isArray ? '[' : '{'}
        </span>
        
        <div style={{ marginLeft: '1.5rem' }}>
          {Object.entries(node).map(([key, value], index, array) => {
            const childPath = `${path}.${key}`;
            const isLast = index === array.length - 1;
            
            return (
              <div key={childPath}>
                {isArray ? '' : renderKey(key)}
                {renderJSONNode(value, childPath, depth + 1)}
                {isLast ? '' : ','}
              </div>
            );
          })}
        </div>
        
        <div>
          <span>{isArray ? ']' : '}'}</span>
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-4 font-mono text-sm overflow-auto h-full bg-gray-50 rounded">
      <div className="json-tree">
        {renderJSONNode(jsonData)}
      </div>
    </div>
  );
};

export default JSONViewer;
