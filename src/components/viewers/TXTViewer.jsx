// src/components/viewers/TXTViewer.jsx
import React, { useState, useEffect } from 'react';
import { TextViewer } from './TextViewer';
import { FiZoomIn, FiZoomOut, FiAlignLeft, FiList, FiToggleRight } from 'react-icons/fi';

/**
 * Enhanced viewer for plain text files with additional features:
 * - Line numbering (toggleable)
 * - Font size controls (xs, sm, base, lg)
 * - Word wrap toggle
 * - Basic syntax highlighting for URLs, emails, and dates
 */
export const TXTViewer = ({ content }) => {
  // Extract text content from various formats
  const [processedContent, setProcessedContent] = useState('');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [fontSize, setFontSize] = useState('base'); // xs, sm, base, lg
  const [wordWrap, setWordWrap] = useState(true);
  
  // Process the content once when component mounts or content changes
  useEffect(() => {
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
    
    setProcessedContent(textContent);
  }, [content]);
  
  // Function to apply syntax highlighting
  const highlightSyntax = (text) => {
    if (!text) return '';
    
    const lines = text.split('\n');
    
    // Apply basic syntax highlighting to each line
    return lines.map((line, index) => {
      // Highlight URLs
      let highlightedLine = line.replace(
        /(https?:\/\/[^\s]+)/g, 
        '<span class="text-blue-600 underline">$1</span>'
      );
      
      // Highlight email addresses
      highlightedLine = highlightedLine.replace(
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
        '<span class="text-green-600">$1</span>'
      );
      
      // Highlight dates (simple pattern - could be expanded)
      highlightedLine = highlightedLine.replace(
        /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/g,
        '<span class="text-purple-600">$1</span>'
      );
      
      return (
        <div key={index} className="flex">
          {showLineNumbers && (
            <div className="text-gray-400 text-right pr-4 select-none w-12 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
              {index + 1}
            </div>
          )}
          <div 
            dangerouslySetInnerHTML={{ __html: highlightedLine }} 
            className="flex-grow"
          />
        </div>
      );
    });
  };
  
  // Font size classes
  const fontSizeClasses = {
    'xs': 'text-xs',
    'sm': 'text-sm',
    'base': 'text-base',
    'lg': 'text-lg',
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Control toolbar */}
      <div className="flex items-center gap-4 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {/* Line number toggle */}
        <button 
          onClick={() => setShowLineNumbers(prev => !prev)} 
          className={`p-1 rounded ${showLineNumbers ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-200'}`}
          title={showLineNumbers ? "Hide line numbers" : "Show line numbers"}
        >
          <FiList />
        </button>
        
        {/* Word wrap toggle */}
        <button 
          onClick={() => setWordWrap(prev => !prev)} 
          className={`p-1 rounded ${wordWrap ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-200'}`}
          title={wordWrap ? "Disable word wrap" : "Enable word wrap"}
        >
          <FiAlignLeft />
        </button>
        
        {/* Font size controls */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setFontSize(prev => prev === 'xs' ? 'xs' : 
              prev === 'sm' ? 'xs' : 
              prev === 'base' ? 'sm' : 
              'base')} 
            className="p-1 rounded text-gray-600 hover:bg-gray-200"
            title="Decrease font size"
            disabled={fontSize === 'xs'}
          >
            <FiZoomOut />
          </button>
          
          <span className="text-xs text-gray-500 px-1">
            {fontSize.toUpperCase()}
          </span>
          
          <button 
            onClick={() => setFontSize(prev => prev === 'lg' ? 'lg' : 
              prev === 'base' ? 'lg' : 
              prev === 'sm' ? 'base' : 
              'sm')} 
            className="p-1 rounded text-gray-600 hover:bg-gray-200"
            title="Increase font size"
            disabled={fontSize === 'lg'}
          >
            <FiZoomIn />
          </button>
        </div>
      </div>
      
      {/* Text content */}
      <div 
        className={`font-mono ${fontSizeClasses[fontSize]} overflow-auto max-h-full bg-white dark:bg-gray-900 p-4 flex-1 ${wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'}`}
      >
        {highlightSyntax(processedContent)}
      </div>
    </div>
  );
};

export default TXTViewer;
