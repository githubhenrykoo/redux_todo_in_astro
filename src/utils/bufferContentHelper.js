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
 * Get raw binary data from a Buffer-like object
 * @param {any} content - The content to extract binary data from
 * @returns {Uint8Array|null} Binary data as Uint8Array or null
 */
export const extractBinaryContent = (content) => {
  if (!content) return null;
  
  try {
    // Case 1: Direct Buffer JSON object
    if (typeof content === 'object' && content !== null && 
        content.type === 'Buffer' && Array.isArray(content.data)) {
      return new Uint8Array(content.data);
    }
    
    // Case 2: JSON string containing serialized Buffer
    if (typeof content === 'string') {
      if (content.includes('"type":"Buffer"') && content.includes('"data":[')) {
        try {
          const bufferObj = JSON.parse(content);
          if (bufferObj && bufferObj.type === 'Buffer' && Array.isArray(bufferObj.data)) {
            return new Uint8Array(bufferObj.data);
          }
        } catch (e) {
          // If parsing fails, can't extract binary
          return null;
        }
      }
      
      // Regular string as bytes
      return new TextEncoder().encode(content);
    }
    
    return null;
  } catch (e) {
    console.error("Error extracting binary content:", e);
    return null;
  }
};

/**
 * Detects the content type based on actual content analysis
 * 
 * @param {any} content - The content to analyze
 * @returns {string|null} Detected content type or null if undetectable
 */
export const detectContentType = (content) => {
  // Early handling for direct Buffer format containing CSV data
  if (typeof content === 'object' && content !== null && 
      content.type === 'Buffer' && Array.isArray(content.data)) {
    
    // Get the decoded string for analysis
    const decodedStr = convertBufferToString(content);
    
    // Debug the decoded content
    console.log("Decoded Buffer content:", decodedStr ? decodedStr.substring(0, 100) : "null");
    
    // Simple CSV detection based on commas and line structure
    if (decodedStr && 
        decodedStr.includes(',') && 
        decodedStr.includes('\n') && 
        decodedStr.split('\n').length > 1 &&
        decodedStr.split('\n')[0].includes(',')) {
      
      console.log("Detected CSV pattern in buffer data");
      return 'csv';
    }
    
    // Check for TSV
    if (decodedStr && 
        decodedStr.includes('\t') && 
        decodedStr.includes('\n') && 
        decodedStr.split('\n').length > 1 &&
        decodedStr.split('\n')[0].includes('\t')) {
      
      console.log("Detected TSV pattern in buffer data");
      return 'tsv';
    }
    
    // Check for JSON
    if (decodedStr && 
        (decodedStr.trim().startsWith('{') || decodedStr.trim().startsWith('['))) {
      try {
        JSON.parse(decodedStr);
        console.log("Detected JSON pattern in buffer data");
        return 'json';
      } catch (e) {
        // Not valid JSON
      }
    }
  }
  
  // Early detection for Buffer JSON format by examining binary patterns
  const binaryData = extractBinaryContent(content);
  if (binaryData) {
    // Check for file signatures (magic numbers)
    const fileSignature = detectFileSignature(binaryData);
    if (fileSignature) {
      console.log("Detected file type from signature:", fileSignature);
      return fileSignature;
    }
  }
  
  const textContent = convertBufferToString(content);
  if (!textContent) return 'bin';
  
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
    
    // Check for CSV format - improved detection
    if (textContent.includes(',') && 
        textContent.includes('\n') && 
        textContent.split('\n').filter(line => line.trim()).length > 1) {
      
      // Count lines with commas
      const lines = textContent.split('\n').filter(line => line.trim());
      const linesWithCommas = lines.filter(line => line.includes(','));
      
      // If more than 50% of lines have commas, likely a CSV
      if (linesWithCommas.length / lines.length > 0.5) {
        console.log("Detected CSV pattern");
        return 'csv';
      }
    }
    
    // Check for TSV format
    if (textContent.includes('\t') && 
        textContent.includes('\n') && 
        textContent.split('\n').filter(line => line.trim()).length > 1) {
      
      // Count lines with tabs
      const lines = textContent.split('\n').filter(line => line.trim());
      const linesWithTabs = lines.filter(line => line.includes('\t'));
      
      // If more than 50% of lines have tabs, likely a TSV
      if (linesWithTabs.length / lines.length > 0.5) {
        return 'tsv';
      }
    }
    
    // Check for SQL
    if ((textContent.includes('SELECT ') || textContent.includes('INSERT INTO ') || 
         textContent.includes('CREATE TABLE ') || textContent.includes('UPDATE ')) &&
        /;/.test(textContent)) {
      return 'sql';
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
    
    // Check for YAML
    if ((/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:/.test(textContent) || 
         /^\s*-\s+[a-zA-Z_][a-zA-Z0-9_]*\s*:/.test(textContent)) &&
        !textContent.includes('{') && !textContent.includes('}')) {
      return 'yaml';
    }
    
    // Default to text if content is mostly text characters
    const textChars = textContent.replace(/[\n\r\t ]/g, '').length;
    const nonTextChars = /[^\x20-\x7E\n\r\t]/.test(textContent);
    
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
 * Detects file signatures (magic numbers) from binary data
 * @param {Uint8Array} data - Binary data to analyze
 * @returns {string|null} File type or null if unrecognized
 */
const detectFileSignature = (data) => {
  if (!data || data.length < 4) return null;
  
  // Common file signatures (magic numbers)
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47) {
    return 'png';
  }
  
  // JPEG: FF D8 FF
  if (data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF) {
    return 'jpg';
  }
  
  // GIF87a: 47 49 46 38 37 61
  // GIF89a: 47 49 46 38 39 61
  if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x38 &&
      (data[4] === 0x37 || data[4] === 0x39) && data[5] === 0x61) {
    return 'gif';
  }
  
  // PDF: 25 50 44 46
  if (data[0] === 0x25 && data[1] === 0x50 && data[2] === 0x44 && data[3] === 0x46) {
    return 'pdf';
  }
  
  // ZIP: 50 4B 03 04
  if (data[0] === 0x50 && data[1] === 0x4B && data[2] === 0x03 && data[3] === 0x04) {
    return 'zip';
  }
  
  // check for BMP: 42 4D
  if (data[0] === 0x42 && data[1] === 0x4D) {
    return 'bmp';
  }
  
  // Check for WEBP: 52 49 46 46 followed by WEBP
  if (data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 && 
      data.length > 11 && data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50) {
    return 'webp';
  }
  
  // Check if it looks like a text file (mostly ASCII characters)
  let textChars = 0;
  let totalChars = Math.min(data.length, 100); // Check first 100 bytes
  
  for (let i = 0; i < totalChars; i++) {
    if ((data[i] >= 32 && data[i] <= 126) || data[i] === 9 || data[i] === 10 || data[i] === 13) {
      textChars++;
    }
  }
  
  if (textChars / totalChars > 0.9) {
    // This is likely a text file
    return null; // Let the text content analysis take over
  }
  
  return 'bin'; // Default to binary if no specific format recognized
};

/**
 * Performs basic content type detection for very large files
 * Only looks at the first portion of the content
 */
const detectBasicContentType = (sample) => {
  if (!sample) return 'bin';
  
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
  const nonTextRatio = (sample.replace(/[\x20-\x7E\r\n\t]/g, '').length / sample.length);
  
  if (nonTextRatio < 0.1) {
    // Mostly text, try to detect format
    if (sample.includes('# ') || sample.includes('## ') || sample.includes('```')) {
      return 'md';
    }
    
    if (sample.includes(',') && sample.split(/\r?\n/).some(line => line.includes(','))) {
      return 'csv';
    }
    
    if (sample.includes('\t') && sample.split(/\r?\n/).some(line => line.includes('\t'))) {
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
  
  // Avoid generic "data" type
  if (simpleType === 'data') {
    return 'application/octet-stream';
  }
  
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
    'sql': 'application/sql',
    'bin': 'application/octet-stream',
    'zip': 'application/zip',
    'bmp': 'image/bmp',
    'webp': 'image/webp'
  };
  
  return mimeMap[simpleType] || `application/${simpleType}`;
};
