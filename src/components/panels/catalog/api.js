/**
 * API service functions for the Catalog Panel
 */

/**
 * Fetch a page of catalog items
 * @param {number} pageNumber - The page number to fetch
 * @param {number} pageSize - The number of items per page
 * @returns {Promise} - The API response
 */
export const fetchItemsPage = async (pageNumber, pageSize) => {
  const response = await fetch(`/api/card-collection?action=getPage&pageNumber=${pageNumber}&pageSize=${pageSize}`);
  return response.json();
};

/**
 * Search for catalog items by content
 * @param {string} searchTerm - The search term
 * @param {number} pageNumber - The page number to fetch
 * @param {number} pageSize - The number of items per page
 * @returns {Promise} - The API response
 */
export const searchByContent = async (searchTerm, pageNumber, pageSize) => {
  const response = await fetch(
    `/api/card-collection?action=searchByContent&searchTerm=${encodeURIComponent(searchTerm)}&pageNumber=${pageNumber}&pageSize=${pageSize}`
  );
  return response.json();
};

/**
 * Get a catalog item by hash
 * @param {string} hash - The item hash
 * @returns {Promise} - The API response
 */
export const getItemByHash = async (hash) => {
  const response = await fetch(`/api/card-collection?action=get&hash=${hash}`);
  return response.json();
};

/**
 * Delete a catalog item by hash
 * @param {string} hash - The item hash
 * @returns {Promise} - The API response
 */
export const deleteItemByHash = async (hash) => {
  const response = await fetch(`/api/card-collection?action=delete&hash=${hash}`, { method: 'DELETE' });
  return response.json();
};

/**
 * Add a file item to the catalog
 * @param {Object} itemData - The item data to add
 * @returns {Promise} - The API response
 */
export const addFileItem = async (itemData) => {
  const formData = new FormData();
  formData.append('file', itemData.file);
  
  const metadata = {
    fileName: itemData.name,
    mimeType: itemData.contentType || 'application/octet-stream',
    size: itemData.file.size,
    description: itemData.description || ''
  };
  
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
  
  return response.json();
};

/**
 * Add a text item to the catalog
 * @param {Object} itemData - The item data to add
 * @returns {Promise} - The API response
 */
export const addTextItem = async (itemData) => {
  const response = await fetch('/api/card-collection?action=add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'add',
      card: {
        content: itemData.description,
        hash_algorithm: 'sha256'
      }
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Server responded with ${response.status}`);
  }
  
  return response.json();
};
