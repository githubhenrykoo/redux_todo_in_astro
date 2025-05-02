import React, { useState, useEffect } from 'react';
import './viewer-common.css';

/**
 * Python code viewer component with syntax highlighting
 */
const PythonViewer = ({ content, hash }) => {
  const [pythonCode, setPythonCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!content) {
      setIsLoading(false);
      setError('No content provided');
      return;
    }

    try {
      // Process content based on its format
      let processedCode = '';
      
      if (typeof content === 'object' && content.type === 'Buffer' && Array.isArray(content.data)) {
        // Handle Buffer JSON representation
        const array = new Uint8Array(content.data);
        processedCode = new TextDecoder().decode(array);
      } else if (Buffer.isBuffer(content)) {
        // Handle actual Buffer object
        processedCode = content.toString('utf8');
      } else if (typeof content === 'string') {
        // Already a string
        processedCode = content;
      } else {
        // Try to stringify any other format
        processedCode = JSON.stringify(content, null, 2);
      }

      setPythonCode(processedCode);
      setIsLoading(false);
    } catch (e) {
      console.error('Error processing Python content:', e);
      setError(`Failed to process Python content: ${e.message}`);
      setIsLoading(false);
    }
  }, [content, hash]);

  // Apply syntax highlighting to Python code
  const highlightPythonSyntax = (code) => {
    if (!code) return '';
    
    // Replace Python keywords with highlighted spans
    const pythonKeywords = [
      'def', 'class', 'return', 'import', 'from', 'as', 'if', 'elif', 'else', 'for', 
      'while', 'in', 'not', 'is', 'None', 'True', 'False', 'try', 'except', 'finally',
      'with', 'pass', 'break', 'continue', 'and', 'or', 'lambda', 'self', 'yield', 'async', 'await'
    ];
    
    // Create regex for keyword matching with word boundaries
    const keywordRegex = new RegExp(`\\b(${pythonKeywords.join('|')})\\b`, 'g');
    
    // Replace patterns with highlighted spans
    let highlighted = code
      // Escape HTML entities to prevent XSS
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Comments (# to end of line)
      .replace(/(#.*)$/gm, '<span class="py-comment">$1</span>')
      // Strings (both single and double quotes)
      .replace(/(['"])(.*?)\1/g, '<span class="py-string">$1$2$1</span>')
      // Keywords
      .replace(keywordRegex, '<span class="py-keyword">$1</span>')
      // Function definitions
      .replace(/\b(def\s+)([a-zA-Z_][a-zA-Z0-9_]*)/g, '$1<span class="py-function">$2</span>')
      // Class definitions
      .replace(/\b(class\s+)([a-zA-Z_][a-zA-Z0-9_]*)/g, '$1<span class="py-class">$2</span>')
      // Numbers
      .replace(/\b(\d+(\.\d+)?)\b/g, '<span class="py-number">$1</span>')
      // Decorators
      .replace(/(@[a-zA-Z_][a-zA-Z0-9_]*)/g, '<span class="py-decorator">$1</span>')
      // Line breaks
      .replace(/\n/g, '<br/>');
    
    return highlighted;
  };

  if (isLoading) {
    return <div className="viewer-loading">Loading Python code...</div>;
  }

  if (error) {
    return <div className="viewer-error">{error}</div>;
  }

  return (
    <div className="python-viewer-container">
      <div className="python-viewer-header">
        <div className="python-viewer-title">Python File</div>
        {hash && (
          <div className="python-viewer-hash">{hash.substring(0, 8)}</div>
        )}
      </div>
      <div className="python-viewer-content">
        <pre 
          className="python-code" 
          dangerouslySetInnerHTML={{ __html: highlightPythonSyntax(pythonCode) }}
        />
      </div>
    </div>
  );
};

export default PythonViewer;
