import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { importCardFromDatabase, selectContent } from '../../../features/contentSlice';
import { selectItem } from '../../../features/selectedItemSlice';
import CatalogHeader from './CatalogHeader';
import ListView from './ListView';
import GridView from './GridView';
import DetailView from './DetailView';
import AddItemForm from './AddItemForm';
import { getSimpleContentType } from './utils';

/**
 * CatalogContainer handles all the state management and API calls for the catalog panel
 */
const CatalogContainer = () => {
  const dispatch = useDispatch();
  
  // Component state
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [itemError, setItemError] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 20
  });
  const [searchResults, setSearchResults] = useState({
    items: [],
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    searchTerm: ''
  });
  
  // Default to grid view as specified in memory
  const [viewMode, setViewMode] = useState('grid'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  
  // Category list derived from items
  const [categories, setCategories] = useState(['all']);

  // Determine which items to display based on search mode
  const displayItems = isSearchMode ? searchResults.items : items;
  
  // Pagination info based on mode
  const paginationInfo = isSearchMode 
    ? { 
        currentPage: searchResults.currentPage, 
        totalPages: searchResults.totalPages, 
        totalItems: searchResults.totalItems,
        pageSize: 20
      } 
    : pagination;

  // Filter and sort items for the current view
  const filteredItems = displayItems.filter(item => {
    // Skip filtering in search mode
    if (isSearchMode) return true;
    
    const matchesFilter = filter === 'all' || item.category === filter;
    return matchesFilter;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch(sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'timestamp':
        return new Date(b.timestamp) - new Date(a.timestamp);
      default:
        return 0;
    }
  });

  // Update categories whenever items change
  useEffect(() => {
    if (items.length > 0) {
      const catSet = new Set(items.map(item => item.category));
      const categoryArray = ['all', ...Array.from(catSet)].filter(c => c);
      setCategories(categoryArray);
    }
  }, [items]);

  // Fetch catalog items
  const fetchCatalogItems = () => {
    setLoading(true);
    setError(null);
    
    fetch(`/api/card-collection?action=getPage&pageNumber=1&pageSize=${pagination.pageSize}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Check response format and transform accordingly
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
            
            // After setting initial items, fetch accurate content types
            fetchAccurateContentTypes(transformedItems);
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
            
            // After setting initial items, fetch accurate content types
            fetchAccurateContentTypes(transformedItems);
          } else {
            console.warn('Unexpected API response format:', data);
          }
          
          setItems(transformedItems);
          setPagination({
            currentPage: data.currentPage || 1,
            totalPages: data.totalPages || Math.ceil((data.totalCards || data.totalItems || transformedItems.length) / pagination.pageSize),
            totalItems: data.totalCards || data.totalItems || transformedItems.length,
            pageSize: pagination.pageSize
          });
        } else {
          setError(data.error || 'Failed to fetch items');
        }
      })
      .catch(error => {
        console.error('Error fetching catalog items:', error);
        setError('Failed to fetch catalog items. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  // Fetch accurate content types for all items
  const fetchAccurateContentTypes = (initialItems) => {
    // Process items in batches to avoid too many simultaneous requests
    const batchSize = 5;
    const itemBatches = [];
    
    for (let i = 0; i < initialItems.length; i += batchSize) {
      itemBatches.push(initialItems.slice(i, i + batchSize));
    }
    
    // Process each batch sequentially
    let currentBatch = 0;
    
    const processBatch = () => {
      if (currentBatch >= itemBatches.length) return;
      
      const batch = itemBatches[currentBatch];
      const batchPromises = batch.map(item => 
        fetch(`/api/card-collection?action=get&hash=${item.id}`)
          .then(response => response.json())
          .then(data => {
            if (data.success && data.card) {
              // Update the item with accurate content type
              setItems(prevItems => 
                prevItems.map(prevItem => 
                  prevItem.id === item.id 
                    ? {
                        ...prevItem,
                        contentType: data.card.contentType
                      }
                    : prevItem
                )
              );
            }
            return null;
          })
          .catch(error => {
            console.error(`Error fetching details for item ${item.id}:`, error);
            return null;
          })
      );
      
      Promise.all(batchPromises)
        .then(() => {
          currentBatch++;
          processBatch();
        });
    };
    
    // Start processing batches
    processBatch();
  };

  // Handle refresh button click
  const handleRefresh = () => {
    // Clear search if in search mode
    if (isSearchMode) {
      setIsSearchMode(false);
      setSearchResults({
        items: [],
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        searchTerm: ''
      });
      setSearchTerm('');
    }
    
    // Fetch items again
    fetchCatalogItems();
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchCatalogItems();
  }, []);

  // Handle pagination change
  const handlePageChange = (newPage) => {
    if (isSearchMode) {
      setSearchLoading(true);
      setSearchError(null);
      
      fetch(`/api/card-collection?action=searchByContent&searchTerm=${encodeURIComponent(searchResults.searchTerm)}&pageNumber=${newPage}&pageSize=${pagination.pageSize}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Transform cards into catalog items
            let transformedItems = [];
            
            if (data.cards && Array.isArray(data.cards)) {
              transformedItems = data.cards.map(card => ({
                id: card.hash,
                name: card.hash.substring(0, 8),
                category: card.contentType?.mimeType || 'Unknown',
                description: 'Matching content: ' + (card.matchContext || ''),
                hash: card.hash,
                timestamp: card.timestamp || new Date().toISOString(),
                contentType: card.contentType
              }));
            } else if (data.items && Array.isArray(data.items)) {
              transformedItems = data.items.map(item => ({
                id: item.id || item.hash,
                name: item.name || (item.hash ? item.hash.substring(0, 8) : 'Unknown'),
                category: item.category || item.contentType?.mimeType || 'Unknown',
                description: item.description || 'No description available',
                timestamp: item.timestamp || new Date().toISOString(),
                hash: item.hash || item.id,
                contentType: item.contentType || { mimeType: 'text/plain' }
              }));
            } else {
              console.warn('Unexpected API search response format:', data);
            }
            
            setSearchResults({
              items: transformedItems,
              currentPage: data.currentPage || newPage,
              totalPages: data.totalPages || Math.ceil((data.totalResults || data.totalItems || transformedItems.length) / pagination.pageSize),
              totalItems: data.totalResults || data.totalItems || transformedItems.length,
              searchTerm: searchResults.searchTerm
            });
          } else {
            setSearchError(data.error || 'Search failed');
          }
        })
        .catch(error => {
          console.error('Error searching catalog items:', error);
          setSearchError('Search failed. Please try again.');
        })
        .finally(() => {
          setSearchLoading(false);
        });
    } else {
      setLoading(true);
      setError(null);
      
      fetch(`/api/card-collection?action=getPage&pageNumber=${newPage}&pageSize=${pagination.pageSize}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Transform cards into catalog items
            let transformedItems = [];
            
            if (data.cards && Array.isArray(data.cards)) {
              transformedItems = data.cards.map(card => ({
                id: card.hash,
                name: card.hash.substring(0, 8),
                category: card.contentType?.mimeType || 'Unknown',
                description: 'Card content hash: ' + card.hash,
                timestamp: card.timestamp || new Date().toISOString(),
                hash: card.hash,
                contentType: card.contentType,
                metaData: card.metaData || {}
              }));
            } else if (data.items && Array.isArray(data.items)) {
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
            
            setItems(transformedItems);
            setPagination({
              currentPage: data.currentPage || newPage,
              totalPages: data.totalPages || Math.ceil((data.totalCards || data.totalItems || transformedItems.length) / pagination.pageSize),
              totalItems: data.totalCards || data.totalItems || transformedItems.length,
              pageSize: pagination.pageSize
            });
          } else {
            setError(data.error || 'Failed to fetch items');
          }
        })
        .catch(error => {
          console.error('Error fetching catalog items:', error);
          setError('Failed to fetch catalog items. Please try again.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  // Handle item selection
  const handleSelectItem = (item) => {
    setItemLoading(true);
    setItemError(null);
    setViewMode('detail');
    
    fetch(`/api/card-collection?action=get&hash=${item.id}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const cardData = data.card;
          
          // Get content type from server response
          const serverContentType = cardData.contentType;
          
          // Extract a simple content type string for the UI
          const simpleType = serverContentType?.extension || 
                         (serverContentType?.mimeType ? getSimpleContentType(serverContentType.mimeType) : null) || 
                         "txt";
          
          // Process the content based on its type
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
          
          // Set the selected item with all details
          setSelectedItem({
            id: cardData.hash,
            name: cardData.hash.substring(0, 8),
            category: cardData.contentType?.mimeType || 'Unknown',
            description: description,
            hash: cardData.hash,
            content: cardData.content,
            timestamp: cardData.timestamp || new Date().toISOString(),
            contentType: cardData.contentType
          });
          
          // Import the card to contentSlice Redux store for cross-panel integration
          dispatch(importCardFromDatabase({ 
            hash: cardData.hash,
            content: cardData.content,
            metadata: {
              contentType: serverContentType
            },
            relationships: {
              parentHash: null,
              childHashes: [],
              relatedHashes: []
            }
          }));
          
          // Select the card in Redux
          dispatch(selectContent(cardData.hash));
          
          // Update the selectedItem state with card details for selected item slice
          dispatch(selectItem({
            item: cardData.content,
            hash: cardData.hash,
            contentType: simpleType,
            gtime: cardData.timestamp
          }));
        } else {
          setItemError(data.error || 'Failed to fetch card');
        }
      })
      .catch(error => {
        console.error('Error fetching card by ID:', error);
        setItemError('Failed to fetch card. Please try again.');
      })
      .finally(() => {
        setItemLoading(false);
      });
  };

  // Handle item deletion
  const handleDeleteItem = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      fetch(`/api/card-collection?action=delete&hash=${id}`, { 
        method: 'DELETE' 
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Remove item from state
            setItems(prevItems => prevItems.filter(item => item.id !== id));
            // If we're viewing the item that was deleted, go back to list view
            if (selectedItem && selectedItem.id === id) {
              setSelectedItem(null);
              setViewMode('grid'); // Return to grid view after deletion
            }
          } else {
            setError(data.error || 'Failed to delete item');
          }
        })
        .catch(error => {
          console.error('Error deleting catalog item:', error);
          setError('Failed to delete item. Please try again.');
        });
    }
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      // Clear search if empty
      setIsSearchMode(false);
      setSearchResults({
        items: [],
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        searchTerm: ''
      });
      return;
    }
    
    setIsSearchMode(true);
    setSearchLoading(true);
    setSearchError(null);
    
    fetch(`/api/card-collection?action=searchByContent&searchTerm=${encodeURIComponent(searchTerm)}&pageNumber=1&pageSize=${pagination.pageSize}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Transform cards into catalog items
          let transformedItems = [];
          
          if (data.cards && Array.isArray(data.cards)) {
            transformedItems = data.cards.map(card => ({
              id: card.hash,
              name: card.hash.substring(0, 8),
              category: card.contentType?.mimeType || 'Unknown',
              description: 'Matching content: ' + (card.matchContext || ''),
              hash: card.hash,
              timestamp: card.timestamp || new Date().toISOString(),
              contentType: card.contentType
            }));
          } else if (data.items && Array.isArray(data.items)) {
            transformedItems = data.items.map(item => ({
              id: item.id || item.hash,
              name: item.name || (item.hash ? item.hash.substring(0, 8) : 'Unknown'),
              category: item.category || item.contentType?.mimeType || 'Unknown',
              description: item.description || 'No description available',
              timestamp: item.timestamp || new Date().toISOString(),
              hash: item.hash || item.id,
              contentType: item.contentType || { mimeType: 'text/plain' }
            }));
          } else {
            console.warn('Unexpected API search response format:', data);
          }
          
          setSearchResults({
            items: transformedItems,
            currentPage: data.currentPage || 1,
            totalPages: data.totalPages || Math.ceil((data.totalResults || data.totalItems || transformedItems.length) / pagination.pageSize),
            totalItems: data.totalResults || data.totalItems || transformedItems.length,
            searchTerm: searchTerm
          });
        } else {
          setSearchError(data.error || 'Search failed');
        }
      })
      .catch(error => {
        console.error('Error searching catalog items:', error);
        setSearchError('Search failed. Please try again.');
      })
      .finally(() => {
        setSearchLoading(false);
      });
  };

  // Handle adding a new item
  const handleAddItem = (newItemData) => {
    if (newItemData.file) {
      // File upload
      const formData = new FormData();
      formData.append('file', newItemData.file);
      
      // Create the metadata object as required by the API
      const metadata = {
        fileName: newItemData.name,
        mimeType: newItemData.contentType || 'application/octet-stream',
        size: newItemData.file.size,
        description: newItemData.description || ''
      };
      
      // Append metadata as a JSON string
      formData.append('metadata', JSON.stringify(metadata));
      // Append action to formData (since it's multipart form)
      formData.append('action', 'add');
      
      setLoading(true);
      setError(null);
      
      fetch('/api/card-collection?action=add', {
        method: 'POST',
        body: formData
      })
        .then(response => {
          if (!response.ok) {
            return response.json().then(data => {
              throw new Error(data.error || `Server responded with ${response.status}`);
            });
          }
          return response.json();
        })
        .then(data => {
          if (data.success) {
            // Add new item to the state
            const newCardItem = {
              id: data.hash,
              name: newItemData.name,
              description: newItemData.description || 'Added file',
              category: newItemData.contentType || 'application/octet-stream',
              hash: data.hash,
              timestamp: new Date().toISOString(),
              contentType: { mimeType: newItemData.contentType || 'application/octet-stream' }
            };
            
            setItems(prevItems => [...prevItems, newCardItem]);
            setViewMode('grid'); // Go back to grid view
          } else {
            setError(data.error || 'Failed to add item');
          }
        })
        .catch(error => {
          console.error('Error adding catalog item:', error);
          setError(`Failed to add item: ${error.message}`);
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (newItemData.description) {
      // Text content
      setLoading(true);
      setError(null);
      
      fetch('/api/card-collection?action=add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          card: {
            content: newItemData.description,
            hash_algorithm: 'sha256'
          }
        })
      })
        .then(response => {
          if (!response.ok) {
            return response.json().then(data => {
              throw new Error(data.error || `Server responded with ${response.status}`);
            });
          }
          return response.json();
        })
        .then(data => {
          if (data.success) {
            // Add new item to state
            const newCardItem = {
              id: data.hash,
              name: newItemData.name,
              description: newItemData.description.substring(0, 100) + (newItemData.description.length > 100 ? '...' : ''),
              category: newItemData.contentType || 'text/plain',
              hash: data.hash,
              timestamp: new Date().toISOString(),
              contentType: { mimeType: newItemData.contentType || 'text/plain' }
            };
            
            setItems(prevItems => [...prevItems, newCardItem]);
            setViewMode('grid'); // Go back to grid view
          } else {
            setError(data.error || 'Failed to add item');
          }
        })
        .catch(error => {
          console.error('Error adding catalog item:', error);
          setError(`Failed to add item: ${error.message}`);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  // Clear search and return to normal view
  const handleClearSearch = () => {
    setSearchTerm('');
    setIsSearchMode(false);
    setSearchResults({
      items: [],
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      searchTerm: ''
    });
  };

  return (
    <div className="catalog-panel" style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <CatalogHeader 
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isSearchMode={isSearchMode}
        categories={categories}
        filter={filter}
        setFilter={setFilter}
        handleSearchSubmit={handleSearchSubmit}
        handleClearSearch={handleClearSearch}
        handleRefresh={handleRefresh}
        searchResults={searchResults}
      />
      
      <div className="catalog-content" style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {viewMode === 'list' && (
          <ListView 
            loading={loading || searchLoading}
            error={error}
            searchError={searchError}
            isSearchMode={isSearchMode}
            searchResults={searchResults}
            sortedItems={sortedItems}
            paginationInfo={paginationInfo}
            onSelectItem={handleSelectItem}
            onDeleteItem={handleDeleteItem}
            onPageChange={handlePageChange}
          />
        )}
        
        {viewMode === 'grid' && (
          <GridView 
            loading={loading || searchLoading}
            error={error}
            searchError={searchError}
            isSearchMode={isSearchMode}
            searchResults={searchResults}
            sortedItems={sortedItems}
            paginationInfo={paginationInfo}
            onSelectItem={handleSelectItem}
            onDeleteItem={handleDeleteItem}
            onPageChange={handlePageChange}
          />
        )}
        
        {viewMode === 'detail' && (
          <DetailView 
            itemLoading={itemLoading}
            itemError={itemError}
            selectedItem={selectedItem}
            onBack={() => setViewMode('grid')}
            onDeleteItem={handleDeleteItem}
          />
        )}
        
        {viewMode === 'add' && (
          <AddItemForm 
            loading={loading}
            error={error}
            onSubmit={handleAddItem}
            onCancel={() => setViewMode('grid')}
          />
        )}
      </div>
    </div>
  );
};

export default CatalogContainer;
