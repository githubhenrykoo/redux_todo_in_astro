/**
 * Utility functions for handling Buffer content stored in Node.js Buffer JSON format
 * Specifically handles the {"type":"Buffer","data":[...]} format
 */

/**
 * Converts a Buffer JSON object or string to a regular string
 * Works with all these formats:
 * - {"type":"Buffer","data":[...]} (object)
 * - '{"type":"Buffer","data":[...]}' (string)
 * - Regular string
 * - Regular objects
 * 
 * @param {any} content - The content to process
 * @returns {string|null} Decoded string or null if not convertible
 */
export const convertBufferToString = (content) => {
  if (!content) return null;
  
  try {
    // Case 1: Direct Buffer JSON object
    if (typeof content === 'object' && content !== null && 
        content.type === 'Buffer' && Array.isArray(content.data)) {
      const array = new Uint8Array(content.data);
      return new TextDecoder().decode(array);
    }
    
    // Case 2: JSON string containing serialized Buffer
    if (typeof content === 'string') {
      if (content.includes('"type":"Buffer"') && content.includes('"data":[')) {
        try {
          const bufferObj = JSON.parse(content);
          if (bufferObj && bufferObj.type === 'Buffer' && Array.isArray(bufferObj.data)) {
            const array = new Uint8Array(bufferObj.data);
            return new TextDecoder().decode(array);
          }
        } catch (e) {
          // If parsing fails, treat as regular string
          console.log("Failed to parse as Buffer JSON:", e);
        }
      }
      
      // Regular string, just return it
      return content;
    }
    
    // Case 3: Other object, convert to JSON string
    if (typeof content === 'object' && content !== null) {
      return JSON.stringify(content, null, 2);
    }
    
    // Case 4: Primitives, convert to string
    return String(content);
  } catch (e) {
    console.error("Error converting buffer to string:", e);
    return typeof content === 'string' ? content : null;
  }
};

/**
 * Detects the content type based on actual content analysis
 * 
 * @param {any} content - The content to analyze
 * @returns {string|null} Detected content type or null if undetectable
 */
export const detectContentType = (content) => {
  const textContent = convertBufferToString(content);
  if (!textContent) return null;
  
  // Size check to avoid processing very large content
  if (textContent.length > 1000000) {
    console.log("Content too large for detailed analysis, using basic checks");
    return detectBasicContentType(textContent.slice(0, 1000));
  }
  
  // Debug logging
  console.log("Analyzing content for type detection:", textContent.slice(0, 100) + "...");
  
  try {
    // Check if it's valid JSON first
    try {
      JSON.parse(textContent);
      if (textContent.trim().startsWith('{') || textContent.trim().startsWith('[')) {
        return 'json';
      }
    } catch (e) {
      // Not JSON, continue with other checks
    }
    
    // Check for XML
    if ((textContent.trim().startsWith('<?xml') || textContent.trim().startsWith('<')) && 
         textContent.includes('</') && textContent.includes('>')) {
      return 'xml';
    }
    
    // Check for HTML
    if (textContent.includes('<html') || textContent.includes('<body') || 
        textContent.includes('<head') || textContent.includes('<!DOCTYPE html')) {
      return 'html';
    }
    
    // Check for CSV format
    if (textContent.includes(',') && 
        /\\r?\\n/.test(textContent) && 
        textContent.split(/\\r?\\n/).filter(line => line.trim()).length > 1 &&
        textContent.split(/\\r?\\n/).filter(line => line.trim())
          .some(line => (line.match(/,/g) || []).length >= 1)) {
      return 'csv';
    }
    
    // Check for TSV format
    if (textContent.includes('\\t') && 
        /\\r?\\n/.test(textContent) && 
        textContent.split(/\\r?\\n/).filter(line => line.trim()).length > 1) {
      return 'tsv';
    }
    
    // Check for Markdown
    if ((textContent.includes('# ') || textContent.includes('## ') || 
         textContent.includes('```') || textContent.includes('**')) &&
        !textContent.includes('<html') && !textContent.includes('<body')) {
      return 'md';
    }
    
    // Check for CSS
    if ((textContent.includes('{') && textContent.includes('}') && 
         textContent.includes(':') && textContent.includes(';')) &&
        /[.#]?[a-zA-Z][a-zA-Z0-9_-]*\s*\{/.test(textContent)) {
      return 'css';
    }
    
    // Check for JavaScript
    if ((textContent.includes('function') || textContent.includes('=>') || 
         textContent.includes('var ') || textContent.includes('let ') || 
         textContent.includes('const ') || textContent.includes('import ')) &&
        /[;{}()]/.test(textContent)) {
      return 'js';
    }
    
    // Default to text if content is mostly text characters
    const textChars = textContent.replace(/[\\n\\r\\t ]/g, '').length;
    const nonTextChars = /[^\\x20-\\x7E\\n\\r\\t]/.test(textContent);
    
    if (textChars > 0 && !nonTextChars) {
      return 'txt';
    }
    
    // Last resort: binary
    return 'bin';
  } catch (e) {
    console.error("Error during content type detection:", e);
    return 'bin';
  }
};

/**
 * Performs basic content type detection for very large files
 * Only looks at the first portion of the content
 */
const detectBasicContentType = (sample) => {
  if (!sample) return null;
  
  // Quick check for common formats based on initial characters
  if (sample.trim().startsWith('{') || sample.trim().startsWith('[')) {
    try {
      JSON.parse(sample);
      return 'json';
    } catch (e) {
      // Not valid JSON
    }
  }
  
  if (sample.trim().startsWith('<?xml') || 
      (sample.trim().startsWith('<') && sample.includes('</') && sample.includes('>'))) {
    return 'xml';
  }
  
  if (sample.includes('<html') || sample.includes('<!DOCTYPE html')) {
    return 'html';
  }
  
  // Check if it's mostly text
  const nonTextRatio = (sample.replace(/[\\x20-\\x7E\\r\\n\\t]/g, '').length / sample.length);
  
  if (nonTextRatio < 0.1) {
    // Mostly text, try to detect format
    if (sample.includes('# ') || sample.includes('## ') || sample.includes('```')) {
      return 'md';
    }
    
    if (sample.includes(',') && sample.split(/\\r?\\n/).some(line => line.includes(','))) {
      return 'csv';
    }
    
    if (sample.includes('\\t') && sample.split(/\\r?\\n/).some(line => line.includes('\\t'))) {
      return 'tsv';
    }
    
    return 'txt';
  }
  
  return 'bin';
};

/**
 * Gets the MIME type from a simplified content type extension
 * 
 * @param {string} simpleType - Simple content type like 'json', 'csv', etc.
 * @returns {string} The corresponding MIME type
 */
export const getMimeType = (simpleType) => {
  if (!simpleType) return 'application/octet-stream';
  
  const mimeMap = {
    'json': 'application/json',
    'js': 'application/javascript',
    'txt': 'text/plain',
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'svg': 'image/svg+xml',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'pdf': 'application/pdf',
    'csv': 'text/csv',
    'tsv': 'text/tab-separated-values',
    'xml': 'application/xml',
    'md': 'text/markdown',
    'yaml': 'application/yaml',
    'yml': 'application/yaml',
    'sql': 'application/sql'
  };
  
  return mimeMap[simpleType] || `application/${simpleType}`;
};
