/**
 * Utility functions for content type handling in the catalog panel
 */

/**
 * Extract a simple content type from MIME type for display purposes
 * @param {string} mimeType - The MIME type (e.g., 'text/plain', 'image/jpeg')
 * @returns {string|null} - Simple type string or null if invalid
 */
export const getSimpleContentType = (mimeType) => {
  if (!mimeType) return null;
  
  // Extract the subtype from the MIME type
  const parts = mimeType.split('/');
  if (parts.length < 2) return null;
  
  const subtype = parts[1];
  
  // Handle special cases
  if (subtype.includes('json')) return 'json';
  if (subtype.includes('javascript')) return 'js';
  if (subtype === 'plain') return 'txt';
  if (subtype === 'html') return 'html';
  if (subtype === 'css') return 'css';
  if (subtype === 'svg+xml') return 'svg';
  
  // Return the subtype as-is for common formats (gif, png, jpg, etc.)
  return subtype;
};

/**
 * Get a display label for a content type
 * @param {object} contentType - Content type object with mimeType property
 * @returns {string} - Formatted display string 
 */
export const getContentTypeDisplay = (contentType) => {
  if (!contentType || !contentType.mimeType) return 'Unknown';
  
  const simpleType = getSimpleContentType(contentType.mimeType);
  return `${simpleType || contentType.mimeType} (${contentType.mimeType})`;
};

/**
 * Default content types used in the app
 */
export const DEFAULT_CONTENT_TYPES = {
  TEXT: 'text/plain',
  JSON: 'application/json',
  BINARY: 'application/octet-stream',
  HTML: 'text/html',
  CSV: 'text/csv'
};

/**
 * Get content type icon or display names for different formats
 */
export const contentTypeDisplayMap = {
  'json': 'JSON',
  'txt': 'TXT',
  'csv': 'CSV',
  'pdf': 'PDF',
  'mp3': '🎵 Audio',
  'wav': '🎵 Audio', 
  'mp4': '🎬 Video',
  'png': '🖼️ Image',
  'jpg': '🖼️ Image',
  'jpeg': '🖼️ Image',
  'gif': '🖼️ Image',
  'js': 'JS',
  'html': 'HTML',
  'xml': 'XML',
  'css': 'CSS',
  'svg': 'SVG'
};
