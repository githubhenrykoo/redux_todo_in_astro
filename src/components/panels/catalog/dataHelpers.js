/**
 * Helper functions for processing catalog data
 */

/**
 * Process API items from various response formats
 * @param {Object} data - API response data
 * @returns {Array} - Processed items array
 */
export const processApiItems = (data) => {
  if (data.cards && Array.isArray(data.cards)) {
    return data.cards.map(card => {
      // Ensure contentType is properly structured
      const contentType = card.contentType || { mimeType: 'text/plain' };
      
      return {
        id: card.hash,
        name: card.hash.substring(0, 8),
        category: contentType.mimeType || 'Unknown',
        description: 'Card content hash: ' + card.hash,
        timestamp: card.timestamp || new Date().toISOString(),
        hash: card.hash,
        contentType: contentType, // Preserve the full contentType object
        metaData: card.metaData || {}
      };
    });
  } 
  
  if (data.items && Array.isArray(data.items)) {
    return data.items.map(item => {
      // Ensure contentType is properly structured
      const contentType = item.contentType || { mimeType: 'text/plain' };
      
      return {
        id: item.id || item.hash,
        name: item.name || (item.hash ? item.hash.substring(0, 8) : 'Unknown'),
        category: item.category || contentType.mimeType || 'Unknown',
        description: item.description || 'No description available',
        timestamp: item.timestamp || new Date().toISOString(),
        hash: item.hash || item.id,
        contentType: contentType, // Preserve the full contentType object
        metaData: item.metaData || {}
      };
    });
  }
  
  console.warn('Unexpected API response format:', data);
  return [];
};

/**
 * Update pagination information based on API response
 * @param {Object} data - API response data
 * @param {Array} items - Processed items array
 * @param {number} pageSize - Current page size
 * @returns {Object} - Updated pagination information
 */
export const updatePagination = (data, items, pageSize) => {
  return {
    currentPage: data.currentPage || 1,
    totalPages: data.totalPages || Math.ceil((data.totalCards || data.totalItems || items.length) / pageSize),
    totalItems: data.totalCards || data.totalItems || items.length,
    pageSize: pageSize
  };
};

/**
 * Process content for display in UI
 * @param {any} content - Card content to process
 * @returns {string} - Processed display text
 */
export const processContentForDisplay = (content) => {
  let description = 'Binary content';
  
  if (typeof content === 'string') {
    description = content.substring(0, 200) + (content.length > 200 ? '...' : '');
  } else if (content && typeof content === 'object') {
    if (content.type === 'string') {
      description = content.data.substring(0, 200) + (content.data.length > 200 ? '...' : '');
    } else if (content.type === 'base64') {
      description = `Binary content (${content.originalType || 'unknown type'})`;
    } else if (content.type === 'Buffer' && Array.isArray(content.data)) {
      description = `Binary data (${content.data.length} bytes)`;
    }
  }
  
  return description;
};

/**
 * Get a simple content type from mime type
 * @param {string} mimeType - The mime type
 * @returns {string} - Simple content type
 */
export const getSimpleContentType = (mimeType) => {
  if (!mimeType) return 'txt';
  
  const mimeMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'text/plain': 'txt',
    'text/csv': 'csv',
    'application/json': 'json',
    'application/pdf': 'pdf',
    'application/xml': 'xml',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'audio/wav': 'wav',
    'audio/mpeg': 'mp3'
  };
  
  return mimeMap[mimeType] || mimeType.split('/').pop() || 'txt';
};
