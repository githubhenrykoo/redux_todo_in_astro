import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { importCardFromDatabase, selectContent } from '../../features/contentSlice';
import { selectItem } from '../../features/selectedItemSlice';
import '../../styles/CatalogPanel.css';

// Import subcomponents from the catalog directory
import CatalogHeader from './catalog/CatalogHeader';
import GridView from './catalog/GridView';
import DetailView from './catalog/DetailView';
import AddItemForm from './catalog/AddItemForm';
import { getSimpleContentType } from './catalog/utils';

/**
 * CatalogPanel - Component for displaying and managing catalog items
 */
const CatalogPanel = () => {
  const dispatch = useDispatch();
  
  // Main state
  const [items, setItems] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // Default to grid view
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [itemError, setItemError] = useState(null);
  const [searchError, setSearchError] = useState(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [categories, setCategories] = useState(['all']);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1, totalPages: 1, totalItems: 0, pageSize: 20
  });
  const [searchResults, setSearchResults] = useState({
    items: [], currentPage: 1, totalPages: 1, totalItems: 0, searchTerm: ''
  });

  // Computed values
  const displayItems = isSearchMode ? searchResults.items : items;
  const paginationInfo = isSearchMode 
    ? { currentPage: searchResults.currentPage, totalPages: searchResults.totalPages, 
        totalItems: searchResults.totalItems, pageSize: 20 } 
    : pagination;
  const filteredItems = displayItems.filter(item => 
    isSearchMode || filter === 'all' || item.category === filter
  );
  const sortedItems = [...filteredItems].sort((a, b) => 
    sortBy === 'name' 
      ? a.name.localeCompare(b.name) 
      : new Date(b.timestamp) - new Date(a.timestamp)
  );

  // Initialize
  useEffect(() => {
    fetchCatalogItems();
  }, []);

  // Update categories whenever items change
  useEffect(() => {
    if (items.length > 0) {
      const catSet = new Set(items.map(item => item.category));
      setCategories(['all', ...Array.from(catSet)].filter(Boolean));
    }
  }, [items]);

  // API Handlers
  const fetchCatalogItems = () => {
    setLoading(true);
    fetch(`/api/card-collection?action=getPage&pageNumber=1&pageSize=${pagination.pageSize}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const transformedItems = processApiItems(data);
          setItems(transformedItems);
          updatePagination(data, transformedItems);
        } else {
          setError(data.error || 'Failed to fetch items');
        }
      })
      .catch(error => {
        console.error('Error fetching catalog items:', error);
        setError('Failed to fetch catalog items. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  const handlePageChange = (newPage) => {
    if (isSearchMode) {
      fetchSearchPage(newPage);
    } else {
      fetchItemsPage(newPage);
    }
  };

  const fetchItemsPage = (newPage) => {
    setLoading(true);
    fetch(`/api/card-collection?action=getPage&pageNumber=${newPage}&pageSize=${pagination.pageSize}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const transformedItems = processApiItems(data);
          setItems(transformedItems);
          updatePagination(data, transformedItems);
        } else {
          setError(data.error || 'Failed to fetch items');
        }
      })
      .catch(error => {
        console.error('Error fetching catalog items:', error);
        setError('Failed to fetch catalog items. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  const fetchSearchPage = (newPage) => {
    setSearchLoading(true);
    fetch(`/api/card-collection?action=searchByContent&searchTerm=${encodeURIComponent(searchResults.searchTerm)}&pageNumber=${newPage}&pageSize=${pagination.pageSize}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const transformedItems = processApiItems(data);
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
      .finally(() => setSearchLoading(false));
  };

  // Item Actions
  const handleSelectItem = (item) => {
    setItemLoading(true);
    setViewMode('detail');
    
    fetch(`/api/card-collection?action=get&hash=${item.id}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const cardData = data.card;
          const serverContentType = cardData.contentType;
          const simpleType = serverContentType?.extension || 
                         (serverContentType?.mimeType ? getSimpleContentType(serverContentType.mimeType) : null) || 
                         "txt";
          
          // Process content for display
          let description = processContentForDisplay(cardData.content);
          
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
          
          // Update Redux store
          dispatch(importCardFromDatabase({ 
            hash: cardData.hash,
            content: cardData.content,
            metadata: { contentType: serverContentType },
            relationships: { parentHash: null, childHashes: [], relatedHashes: [] }
          }));
          
          dispatch(selectContent(cardData.hash));
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
      .finally(() => setItemLoading(false));
  };

  const handleDeleteItem = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      fetch(`/api/card-collection?action=delete&hash=${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setItems(prevItems => prevItems.filter(item => item.id !== id));
            if (selectedItem && selectedItem.id === id) {
              setSelectedItem(null);
              setViewMode('grid');
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

  const handleAddItem = (newItemData) => {
    if (newItemData.file) {
      addFileItem(newItemData);
    } else if (newItemData.description) {
      addTextItem(newItemData);
    }
  };

  // UI Handlers
  const handleRefresh = () => {
    if (isSearchMode) clearSearch();
    fetchCatalogItems();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      clearSearch();
      return;
    }
    
    setIsSearchMode(true);
    setSearchLoading(true);
    
    fetch(`/api/card-collection?action=searchByContent&searchTerm=${encodeURIComponent(searchTerm)}&pageNumber=1&pageSize=${pagination.pageSize}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const transformedItems = processApiItems(data);
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
      .finally(() => setSearchLoading(false));
  };

  const clearSearch = () => {
    setIsSearchMode(false);
    setSearchResults({
      items: [], currentPage: 1, totalPages: 1, totalItems: 0, searchTerm: ''
    });
    setSearchTerm('');
  };

  // Helper functions
  const processApiItems = (data) => {
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

  const updatePagination = (data, items) => {
    setPagination({
      currentPage: data.currentPage || 1,
      totalPages: data.totalPages || Math.ceil((data.totalCards || data.totalItems || items.length) / pagination.pageSize),
      totalItems: data.totalCards || data.totalItems || items.length,
      pageSize: pagination.pageSize
    });
  };

  const processContentForDisplay = (content) => {
    let description = 'Binary content';
    
    if (typeof content === 'string') {
      description = content.substring(0, 200) + (content.length > 200 ? '...' : '');
    } else if (content && typeof content === 'object') {
      if (content.type === 'string') {
        description = content.data.substring(0, 200) + (content.data.length > 200 ? '...' : '');
      } else if (content.type === 'base64') {
        description = `Binary content (${content.originalType || 'unknown type'})`;
      }
    }
    
    return description;
  };

  const addFileItem = (newItemData) => {
    const formData = new FormData();
    formData.append('file', newItemData.file);
    
    const metadata = {
      fileName: newItemData.name,
      mimeType: newItemData.contentType || 'application/octet-stream',
      size: newItemData.file.size,
      description: newItemData.description || ''
    };
    
    formData.append('metadata', JSON.stringify(metadata));
    formData.append('action', 'add');
    
    setLoading(true);
    
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
          setViewMode('grid');
        } else {
          setError(data.error || 'Failed to add item');
        }
      })
      .catch(error => {
        console.error('Error adding catalog item:', error);
        setError(`Failed to add item: ${error.message}`);
      })
      .finally(() => setLoading(false));
  };

  const addTextItem = (newItemData) => {
    setLoading(true);
    
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
          setViewMode('grid');
        } else {
          setError(data.error || 'Failed to add item');
        }
      })
      .catch(error => {
        console.error('Error adding catalog item:', error);
        setError(`Failed to add item: ${error.message}`);
      })
      .finally(() => setLoading(false));
  };

  // Render main component
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
        handleClearSearch={clearSearch}
        handleRefresh={handleRefresh}
        searchResults={searchResults}
      />
      
      <div className="catalog-content" style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
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

export default CatalogPanel;

// Also export as a named export to support different import strategies
export { CatalogPanel };
