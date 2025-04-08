/**
 * Utility functions for catalog components
 */

// Extract simple content type from MIME type
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

// Get content type display mapping for UI
export const getContentTypeDisplay = () => ({
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
});
