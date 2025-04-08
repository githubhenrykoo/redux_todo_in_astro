/**
 * Catalog API Service
 * Handles all API interactions for the catalog panel
 */

/**
 * Fetch catalog items with pagination
 * @param {number} pageNumber - Page number to fetch
 * @param {number} pageSize - Number of items per page
 * @returns {Promise} - API response
 */
export const fetchCatalogItems = async (pageNumber = 1, pageSize = 20) => {
  try {
    const response = await fetch(`/api/card-collection?action=getPage&pageNumber=${pageNumber}&pageSize=${pageSize}`);
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        items: transformApiItems(data),
        pagination: {
          currentPage: data.currentPage || 1,
          totalPages: data.totalPages || Math.ceil((data.totalCards || data.totalItems || 0) / pageSize),
          totalItems: data.totalCards || data.totalItems || 0,
          pageSize
        }
      };
    }
    
    return {
      success: false,
      error: data.error || 'Failed to fetch items'
    };
  } catch (error) {
    console.error('Error fetching catalog items:', error);
    return {
      success: false,
      error: 'Failed to fetch catalog items. Please try again.'
    };
  }
};

/**
 * Search catalog items by content
 * @param {string} searchTerm - Text to search for
 * @param {number} pageNumber - Page number to fetch
 * @param {number} pageSize - Number of items per page
 * @returns {Promise} - API response
 */
export const searchCatalogItems = async (searchTerm, pageNumber = 1, pageSize = 20) => {
  try {
    const response = await fetch(
      `/api/card-collection?action=searchByContent&searchTerm=${encodeURIComponent(searchTerm)}&pageNumber=${pageNumber}&pageSize=${pageSize}`
    );
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        items: transformApiItems(data),
        pagination: {
          currentPage: data.currentPage || pageNumber,
          totalPages: data.totalPages || Math.ceil((data.totalResults || data.totalItems || 0) / pageSize),
          totalItems: data.totalResults || data.totalItems || 0,
          pageSize,
          searchTerm
        }
      };
    }
    
    return {
      success: false,
      error: data.error || 'Search failed'
    };
  } catch (error) {
    console.error('Error searching catalog items:', error);
    return {
      success: false,
      error: 'Search failed. Please try again.'
    };
  }
};

/**
 * Fetch catalog item by hash
 * @param {string} hash - Item hash
 * @returns {Promise} - API response
 */
export const fetchItemById = async (hash) => {
  try {
    const response = await fetch(`/api/card-collection?action=get&hash=${hash}`);
    const data = await response.json();
    
    if (data.success) {
      const cardData = data.card;
      
      let description = 'Binary content';
      const content = cardData.content;
      
      if (typeof content === 'string') {
        description = content.substring(0, 200) + (content.length > 200 ? '...' : '');
      } else if (content && typeof content === 'object') {
        if (content.type === 'string') {
          description = content.data.substring(0, 200) + (content.data.length > 200 ? '...' : '');
        } else if (content.type === 'base64') {
          description = `Binary content (${content.originalType || 'unknown type'})`;
        }
      }
      
      return {
        success: true,
        item: {
          id: cardData.hash,
          name: cardData.hash.substring(0, 8),
          category: cardData.contentType?.mimeType || 'Unknown',
          description,
          hash: cardData.hash,
          content: cardData.content,
          timestamp: cardData.timestamp || new Date().toISOString(),
          contentType: cardData.contentType
        }
      };
    }
    
    return {
      success: false,
      error: data.error || 'Failed to fetch card'
    };
  } catch (error) {
    console.error('Error fetching card by ID:', error);
    return {
      success: false,
      error: 'Failed to fetch card. Please try again.'
    };
  }
};

/**
 * Delete a catalog item
 * @param {string} hash - Item hash
 * @returns {Promise} - API response
 */
export const deleteItem = async (hash) => {
  try {
    const response = await fetch(`/api/card-collection?action=delete&hash=${hash}`, { 
      method: 'DELETE' 
    });
    
    const data = await response.json();
    
    return {
      success: data.success,
      error: data.success ? null : (data.error || 'Failed to delete item')
    };
  } catch (error) {
    console.error('Error deleting catalog item:', error);
    return {
      success: false,
      error: 'Failed to delete item. Please try again.'
    };
  }
};

/**
 * Add a file to the catalog
 * @param {Object} file - File to upload
 * @param {Object} metadata - Metadata for the file
 * @returns {Promise} - API response
 */
export const addFileItem = async (file, metadata) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));
    formData.append('action', 'add');
    
    const response = await fetch('/api/card-collection?action=add', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server responded with ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        hash: data.hash
      };
    }
    
    return {
      success: false,
      error: data.error || 'Failed to add item'
    };
  } catch (error) {
    console.error('Error adding file item:', error);
    return {
      success: false,
      error: `Failed to add item: ${error.message}`
    };
  }
};

/**
 * Add text content to the catalog
 * @param {Object} content - Text content and metadata
 * @returns {Promise} - API response
 */
export const addTextContent = async (content) => {
  try {
    const response = await fetch('/api/card-collection?action=add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        card: {
          content: content.text,
          hash_algorithm: 'sha256'
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server responded with ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        hash: data.hash
      };
    }
    
    return {
      success: false,
      error: data.error || 'Failed to add item'
    };
  } catch (error) {
    console.error('Error adding text content:', error);
    return {
      success: false,
      error: `Failed to add item: ${error.message}`
    };
  }
};

/**
 * Helper function to transform API response items into a consistent format
 * @param {Object} data - API response data
 * @returns {Array} - Transformed items
 */
const transformApiItems = (data) => {
  let transformedItems = [];
  
  if (data.cards && Array.isArray(data.cards)) {
    // Format from getPage endpoint
    transformedItems = data.cards.map(card => ({
      id: card.hash,
      name: card.hash.substring(0, 8), // Use first 8 chars of hash as name
      category: card.contentType?.mimeType || 'Unknown',
      description: 'Card content hash: ' + card.hash,
      timestamp: card.timestamp || new Date().toISOString(),
      hash: card.hash,
      contentType: card.contentType,
      metaData: card.metaData || {}
    }));
  } else if (data.items && Array.isArray(data.items)) {
    // Alternative format from list endpoint
    transformedItems = data.items.map(item => ({
      id: item.id || item.hash,
      name: item.name || (item.hash ? item.hash.substring(0, 8) : 'Unknown'),
      category: item.category || item.contentType?.mimeType || 'Unknown',
      description: item.description || 'No description available',
      timestamp: item.timestamp || new Date().toISOString(),
      hash: item.hash || item.id,
      contentType: item.contentType || { mimeType: 'text/plain' },
      metaData: item.metaData || {}
    }));
  } else {
    console.warn('Unexpected API response format:', data);
  }
  
  return transformedItems;
};
