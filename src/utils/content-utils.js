/**
 * Content processing utilities for handling different content types
 * Standardizes how we process and display binary and text content
 */

/**
 * Process content based on its structure and content type
 * @param {any} content - Raw content from API (Buffer JSON, string, etc.)
 * @param {Object} contentType - Content type metadata with mimeType, extension
 * @returns {Object} Processed content with type information
 */
export function processContent(content, contentType) {
  // Handle null/undefined content
  if (content === null || content === undefined) {
    return { type: 'empty', data: null };
  }

  // Case 1: Buffer JSON format (most common for binary data)
  if (content && typeof content === 'object' && content.type === 'Buffer' && Array.isArray(content.data)) {
    return processBufferContent(content, contentType);
  }
  
  // Case 2: String content (possibly JSON)
  if (typeof content === 'string') {
    // Check if it's a Buffer JSON serialized as string
    if (content.startsWith('{') && (content.includes('"type":"Buffer"') || content.includes('"type": "Buffer"'))) {
      try {
        const parsed = JSON.parse(content);
        if (parsed.type === 'Buffer' && Array.isArray(parsed.data)) {
          return processBufferContent(parsed, contentType);
        }
      } catch (e) {
        // Not valid JSON, continue with string processing
        console.error('Failed to parse potential Buffer JSON:', e);
      }
    }

    // Check if content is a data URL
    if (content.startsWith('data:')) {
      return {
        type: 'dataUrl',
        url: content
      };
    }
    
    // Check if it's base64 encoded (for images, etc.)
    if (/^[A-Za-z0-9+/=]+$/.test(content) && content.length > 0) {
      if (contentType.mimeType?.startsWith('image/')) {
        return {
          type: 'dataUrl',
          url: `data:${contentType.mimeType};base64,${content}`
        };
      }
    }
    
    // Regular string content
    return { type: 'text', data: content };
  }
  
  // Case 3: Already processed content with type
  if (content && typeof content === 'object' && content.type && (content.data || content.url)) {
    return content; // Already in our format
  }
  
  // Default: return as unknown type
  return { type: 'unknown', data: content };
}

/**
 * Process a Buffer JSON object into appropriate format based on content type
 * @param {Object} buffer - Buffer JSON object {type: 'Buffer', data: [...]}
 * @param {Object} contentType - Content type metadata with mimeType
 * @returns {Object} Processed content in appropriate format
 */
export function processBufferContent(buffer, contentType) {
  if (!buffer || !Array.isArray(buffer.data)) {
    throw new Error('Invalid buffer object');
  }
  
  const mimeType = contentType?.mimeType || detectMimeTypeFromBuffer(buffer.data);
  
  // For image content types, create a data URL
  if (mimeType?.startsWith('image/')) {
    return createDataUrlFromBuffer(buffer.data, mimeType);
  }
  
  // For audio/video content
  if (mimeType?.startsWith('audio/') || mimeType?.startsWith('video/')) {
    return createDataUrlFromBuffer(buffer.data, mimeType);
  }
  
  // For text-based content types
  if (mimeType?.startsWith('text/') || 
      mimeType === 'application/json' ||
      mimeType === 'application/xml' ||
      mimeType === 'application/javascript') {
    return createTextFromBuffer(buffer.data);
  }
  
  // For other binary formats, return as binary data
  return {
    type: 'binary',
    data: new Uint8Array(buffer.data),
    mimeType: mimeType
  };
}

/**
 * Create a data URL from buffer data
 * @param {Array|Uint8Array} bufferData - Array of byte values
 * @param {string} mimeType - MIME type for the data URL
 * @returns {Object} Object with dataUrl type and url
 */
export function createDataUrlFromBuffer(bufferData, mimeType) {
  try {
    const bytes = Array.isArray(bufferData) ? bufferData : Array.from(bufferData);
    const binary = bytes.map(byte => String.fromCharCode(byte)).join('');
    const base64 = window.btoa(binary);
    
    return {
      type: 'dataUrl',
      url: `data:${mimeType};base64,${base64}`
    };
  } catch (error) {
    console.error('Failed to create data URL from buffer:', error);
    return { type: 'error', error: 'Failed to create data URL' };
  }
}

/**
 * Create text content from buffer data
 * @param {Array|Uint8Array} bufferData - Array of byte values
 * @returns {Object} Object with text type and data
 */
export function createTextFromBuffer(bufferData) {
  try {
    // Use TextDecoder for proper UTF-8 handling
    const textDecoder = new TextDecoder('utf-8');
    const data = textDecoder.decode(new Uint8Array(bufferData));
    
    return { type: 'text', data };
  } catch (error) {
    console.error('Failed to decode text from buffer:', error);
    return { type: 'error', error: 'Failed to decode text content' };
  }
}

/**
 * Attempt to detect MIME type from buffer content
 * Uses binary signatures/magic numbers
 * @param {Array|Uint8Array} bufferData - Buffer data to analyze
 * @returns {string|null} Detected MIME type or null if unknown
 */
export function detectMimeTypeFromBuffer(bufferData) {
  if (!bufferData || bufferData.length < 4) {
    return null;
  }
  
  const data = Array.isArray(bufferData) ? bufferData : Array.from(bufferData);
  
  // Check for PNG signature: 89 50 4E 47
  if (data[0] === 137 && data[1] === 80 && data[2] === 78 && data[3] === 71) {
    return 'image/png';
  }
  
  // Check for JPEG signature: FF D8 FF
  if (data[0] === 255 && data[1] === 216 && data[2] === 255) {
    return 'image/jpeg';
  }
  
  // Check for GIF signature: 'GIF87a' or 'GIF89a'
  if (data[0] === 71 && data[1] === 73 && data[2] === 70 && 
      data[3] === 56 && (data[4] === 55 || data[4] === 57) && data[5] === 97) {
    return 'image/gif';
  }
  
  // Check for WEBP signature: RIFF + filesize + WEBP
  if (data[0] === 82 && data[1] === 73 && data[2] === 70 && data[3] === 70 && 
      data[8] === 87 && data[9] === 69 && data[10] === 66 && data[11] === 80) {
    return 'image/webp';
  }
  
  // Check for SVG (text-based format)
  const potentialText = createTextFromBuffer(data.slice(0, Math.min(30, data.length)));
  if (potentialText.type === 'text' && 
      (potentialText.data.startsWith('<?xml') || potentialText.data.startsWith('<svg'))) {
    return 'image/svg+xml';
  }
  
  // Check for PDF signature: %PDF
  if (data[0] === 37 && data[1] === 80 && data[2] === 68 && data[3] === 70) {
    return 'application/pdf';
  }
  
  // Check for ZIP signature: PK
  if (data[0] === 80 && data[1] === 75) {
    return 'application/zip';
  }
  
  // Check for WAVE audio: 'RIFF' + filesize + 'WAVE'
  if (data[0] === 82 && data[1] === 73 && data[2] === 70 && data[3] === 70 && 
      data[8] === 87 && data[9] === 65 && data[10] === 86 && data[11] === 69) {
    return 'audio/wav';
  }
  
  // MP3 signature check
  if ((data[0] === 73 && data[1] === 68 && data[2] === 51) || // ID3v2
      (data[0] === 255 && (data[1] & 0xE0) === 0xE0)) { // MPEG sync
    return 'audio/mpeg';
  }
  
  // Default to octet-stream for unknown binary
  return 'application/octet-stream';
}

/**
 * Helper to determine if content is of type image
 * @param {Object} contentType - Content type with mimeType
 * @returns {boolean} True if content is an image
 */
export function isImageType(contentType) {
  return contentType?.mimeType?.startsWith('image/') || false;
}

/**
 * Get a formatted content type display string
 * @param {Object} contentType - Content type object
 * @returns {string} Formatted content type for display
 */
export function getContentTypeDisplay(contentType) {
  if (!contentType) return 'Unknown';
  
  const mimeType = contentType.mimeType || 'unknown';
  const extension = contentType.extension || '';
  
  // Get type name from extension or mime type
  let typeName = extension.toUpperCase();
  
  if (!typeName && mimeType) {
    // Extract type from MIME
    const mimeParts = mimeType.split('/');
    if (mimeParts.length > 1) {
      typeName = mimeParts[1].toUpperCase();
    } else {
      typeName = mimeParts[0].toUpperCase();
    }
  }
  
  return `${typeName} (${mimeType})`;
}
