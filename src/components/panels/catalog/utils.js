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
  if (subtype === 'csv' && mimeType.includes('clm')) return 'clm';  // CLM often stored as CSV
  
  // Return the subtype as-is for common formats (gif, png, jpg, etc.)
  return subtype;
};

// Get content type display mapping for UI
export const getContentTypeDisplay = () => ({
  'json': 'JSON',
  'txt': 'TXT',
  'csv': 'CSV',
  'clm': '📊 CLM',  // Added CLM type
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
  const content = item.content || '';
  
  // CLM detection - inspect content for CLM-specific patterns
  if (typeof content === 'string' || content?.data) {
    const contentStr = typeof content === 'string' 
      ? content 
      : (content.data && Array.isArray(content.data)) 
        ? String.fromCharCode.apply(null, content.data) 
        : '';
        
    // Check for CLM indicators in content
    const detectedCLM = detectCLMContent(contentStr);
    if (detectedCLM.isClm) {
      return `CLM (${detectedCLM.type === 'main' ? 'text/csv' : 'text/clm-dimension'})`;
    }
  }
  
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

/**
 * Detect CLM (Cubical Logic Model) content based on patterns and keywords
 * @param {string} content - The content to analyze
 * @returns {object} - Object with isClm flag and type (main or dimension)
 */
export const detectCLMContent = (content) => {
  if (!content) {
    return { isClm: false, type: null };
  }
  
  // Convert binary or Buffer to string if needed
  let contentStr = '';
  try {
    if (typeof content === 'string') {
      contentStr = content;
    } else if (content.type === 'Buffer' && Array.isArray(content.data)) {
      // Handle JSON Buffer representation
      // Use a safe approach to avoid stack overflow
      contentStr = content.data.map(c => String.fromCharCode(c)).join('');
    } else if (typeof content.toString === 'function') {
      contentStr = content.toString();
    } else {
      contentStr = String(content);
    }
  } catch (e) {
    console.warn('Error converting content:', e);
    return { isClm: false, type: null };
  }
  
  // Try parsing as JSON if it looks like JSON
  let jsonData = null;
  if (contentStr.trim().startsWith('{') && contentStr.trim().endsWith('}')) {
    try {
      jsonData = JSON.parse(contentStr);
    } catch (e) {
      // Not valid JSON, continue with string analysis
    }
  }
  
  // Check for the root CLM structure (main CLM) in JSON
  if (jsonData) {
    if (jsonData.dimensions && 
        (jsonData.dimensions.abstractSpecification || 
         jsonData.dimensions.concreteImplementation)) {
      return { isClm: true, type: 'main' };
    }
    
    if (jsonData.dimensionType) {
      return { isClm: true, type: 'dimension' };
    }
  }
  
  // Check for the root CLM structure (main CLM) in string
  const isMainClm = contentStr.includes('"dimensions"') && 
    (contentStr.includes('"abstractSpecification"') || contentStr.includes('"concreteImplementation"'));
  
  // Check for dimension CLM patterns
  const isDimensionClm = 
    (contentStr.includes('"dimensionType"') && 
     (contentStr.includes('"abstractSpecification"') || 
      contentStr.includes('"concreteImplementation"'))) ||
    (contentStr.includes('Abstract Specification') && 
     contentStr.includes('Concrete Implementation')) ||
    (contentStr.includes('Context') && 
     contentStr.includes('Goal') && 
     contentStr.includes('Success Criteria') &&
     contentStr.includes('Inputs') &&
     contentStr.includes('Activities') &&
     contentStr.includes('Outputs'));
  
  // Return appropriate type
  if (isMainClm) {
    return { isClm: true, type: 'main' };
  } else if (isDimensionClm) {
    return { isClm: true, type: 'dimension' };
  }
  
  return { isClm: false, type: null };
};
