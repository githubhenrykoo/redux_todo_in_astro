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

// Format content type for display in the consistent "TYPE (mime/type)" format
export const getFormattedContentType = (mimeType) => {
  const simpleType = getSimpleContentType(mimeType);
  
  // Special case for quicktime - check if it's actually an MP4
  if (mimeType === 'video/quicktime' && simpleType === 'quicktime') {
    // Display MP4 for any quicktime content that looks like it should be MP4
    return `MP4 (video/mp4)`;
  }
  
  const typeDisplay = getContentTypeDisplay()[simpleType] || simpleType?.toUpperCase() || 'UNKNOWN';
  return `${typeDisplay} (${mimeType})`;
};

// Special function to determine the correct content type for display
// This handles special cases like MP4 files being mistakenly labeled as QuickTime
export const determineCorrectContentType = (item) => {
  if (!item?.contentType?.mimeType) {
    return 'Unknown';
  }
  
  const mimeType = item.contentType.mimeType;
  const filename = item.name || '';
  const hash = item.hash || '';
  
  // Special handling for QuickTime videos that are actually MP4s
  if (mimeType === 'video/quicktime') {
    // Check if filename suggests MP4
    if ((filename && filename.toLowerCase().includes('.mp4')) ||
        (hash && hash.toLowerCase().includes('mp4'))) {
      console.log(`Correcting content type from QuickTime to MP4 for item: ${filename || hash}`);
      return 'MP4 (video/mp4)';
    }
  }
  
  // If it's already MP4, ensure it displays as MP4
  if (mimeType === 'video/mp4' || 
      (filename && filename.toLowerCase().endsWith('.mp4'))) {
    return 'MP4 (video/mp4)';
  }
  
  // For all other content types, use the standard formatting
  return getFormattedContentType(mimeType);
};
