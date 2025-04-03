/**
 * Content detection utility
 * Implements robust content-based detection for various file types
 * Following the same principles as the file detection system mentioned in user's requirements
 */

/**
 * Get content type based on metadata and file information
 * Uses multi-stage detection similar to the enhanced detection system
 */
export const getContentType = (fileInfo, metadata) => {
  // Track detection method for logging
  let detectionMethod = 'unknown';
  
  // Stage 1: Try to get from metadata (from Redux store)
  if (metadata?.contentType && metadata.contentType !== 'null') {
    detectionMethod = 'metadata';
    console.log('Content detection - Using type from metadata:', metadata.contentType);
    return metadata.contentType;
  }
  
  // Stage 2: Try to get from fileInfo metadata
  if (fileInfo?.metadata?.contentType && fileInfo.metadata.contentType !== 'null') {
    detectionMethod = 'fileinfo_metadata';
    console.log('Content detection - Using type from fileInfo metadata:', fileInfo.metadata.contentType);
    return fileInfo.metadata.contentType;
  }
  
  // Stage 3: Fallback to extension-based detection
  if (fileInfo?.name) {
    const extension = getFileExtension(fileInfo.name).toLowerCase();
    const extensionMap = {
      'txt': 'text/plain',
      'csv': 'text/csv',
      'md': 'text/markdown',
      'json': 'application/json',
      'pdf': 'application/pdf',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'wav': 'audio/wav',
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4'
    };
    
    if (extensionMap[extension]) {
      detectionMethod = 'extension';
      console.log('Content detection - Detected type from extension:', extensionMap[extension]);
      return extensionMap[extension];
    }
  }
  
  // Stage 4: Default fallback
  detectionMethod = 'default';
  console.log('Content detection - Using default type');
  return 'application/octet-stream';
};

/**
 * Get file extension from a filename
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.split('.').pop() || '';
};
