// src/components/viewers/ReduxStateViewer.jsx
import React, { useState } from 'react';

/**
 * A specialized viewer for Redux state data
 * This provides specialized functionality for viewing
 * the specific structure of Redux state as used in this application
 */
export const ReduxStateViewer = ({ content }) => {
  const [expandedPaths, setExpandedPaths] = useState(new Set(['root']));
  const [selectedTab, setSelectedTab] = useState('full'); // 'full', 'todos', 'cards', 'clm', etc.
  
  // Parse JSON if it's a string
  const stateData = typeof content === 'string' 
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
  
  // Get the data for the current tab
  const getTabData = () => {
    if (!stateData) return null;
    
    switch (selectedTab) {
      case 'todos':
        return stateData.todos || (stateData.state?.todos) || null;
      case 'cards':
        return stateData.cards || null;
      case 'clm':
        return stateData.clm || null;
      case 'full':
      default:
        return stateData;
    }
  };
  
  // Generate tabs based on available sections in the Redux state
  const generateTabs = () => {
    const tabs = [
      { id: 'full', label: 'Full State', always: true }
    ];
    
    // Add conditional tabs
    if (stateData.todos || (stateData.state?.todos)) {
      tabs.push({ id: 'todos', label: 'Todos' });
    }
    
    if (stateData.cards) {
      tabs.push({ id: 'cards', label: 'Cards' });
    }
    
    if (stateData.clm) {
      tabs.push({ id: 'clm', label: 'CLM' });
    }
    
    // Add any additional tabs based on state content
    
    return tabs;
  };
  
  const tabs = generateTabs();
  const tabData = getTabData();
  
  return (
    <div className="h-full flex flex-col bg-white rounded shadow overflow-hidden">
      {/* Tab navigation */}
      <div className="flex border-b bg-gray-100">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-2 text-sm font-medium focus:outline-none ${
              selectedTab === tab.id 
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setSelectedTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab content */}
      <div className="flex-1 overflow-auto p-4 font-mono text-sm bg-gray-50">
        <div className="json-tree">
          {tabData ? renderJSONNode(tabData) : <div>No data available</div>}
        </div>
      </div>
    </div>
  );
};

export default ReduxStateViewer;
