import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { importCardFromDatabase, selectContent } from '../../features/contentSlice';
import { selectItem } from '../../features/selectedItemSlice';
import '../../styles/CatalogPanel.css';

/**
 * CatalogPanel - A component for displaying and managing catalog items
 * 
 * Features:
 * - List view with search/filter capabilities
 * - Grid view with thumbnail support
 * - Item categorization
 * - Add/edit/remove operations
 * - Detail view for individual items
 * - Integration with card-collection API
 */
const CatalogPanel = () => {
  const dispatch = useDispatch();
  
  // Component state (previously from Redux store)
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
  
  const [viewMode, setViewMode] = useState('list'); // 'list', 'grid', 'detail', 'add'
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [fileInput, setFileInput] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    contentType: 'text/plain',
    file: null
  });
  
  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef(null);
  
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
          console.log('Fetched items:', data);
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

  // Helper function to extract a simple content type from MIME type
  const getSimpleContentType = (mimeType) => {
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
          console.log("Server-provided content type:", serverContentType);
          
          // Extract a simple content type string for the UI
          const simpleType = serverContentType?.extension || 
                         (serverContentType?.mimeType ? getSimpleContentType(serverContentType.mimeType) : null) || 
                         "txt";
          
          console.log("Using content type:", simpleType);
          
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
              setViewMode('list');
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

  // Handle new item submission
  const handleAddItem = (e) => {
    e.preventDefault();
    
    if (!newItem.name) {
      alert('Please provide a name for the new item');
      return;
    }
    
    if (newItem.file) {
      // File upload
      const formData = new FormData();
      formData.append('file', newItem.file);
      
      // Create the metadata object as required by the API
      const metadata = {
        fileName: newItem.name,
        mimeType: newItem.contentType || 'application/octet-stream',
        size: newItem.file.size,
        description: newItem.description || ''
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
              name: newItem.name,
              description: newItem.description || 'Added file',
              category: newItem.contentType || 'application/octet-stream',
              hash: data.hash,
              timestamp: new Date().toISOString(),
              contentType: { mimeType: newItem.contentType || 'application/octet-stream' }
            };
            
            setItems(prevItems => [...prevItems, newCardItem]);
            
            // Reset form
            setNewItem({
              name: '',
              description: '',
              contentType: 'text/plain',
              file: null
            });
            setFileInput(null);
            setViewMode('list');
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
    } else if (newItem.description) {
      // Text content
      setLoading(true);
      setError(null);
      
      fetch('/api/card-collection?action=add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          card: {
            content: newItem.description,
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
              name: newItem.name,
              description: newItem.description.substring(0, 100) + (newItem.description.length > 100 ? '...' : ''),
              category: newItem.contentType || 'text/plain',
              hash: data.hash,
              timestamp: new Date().toISOString(),
              contentType: { mimeType: newItem.contentType || 'text/plain' }
            };
            
            setItems(prevItems => [...prevItems, newCardItem]);
            
            // Reset form
            setNewItem({
              name: '',
              description: '',
              contentType: 'text/plain',
              file: null
            });
            setViewMode('list');
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
    } else {
      alert('Please provide content to add');
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

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileInput(file);
      setNewItem({
        ...newItem,
        name: file.name,
        contentType: file.type || 'application/octet-stream',
        file: file
      });
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragging to false if leaving the drop zone itself, not its children
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0]; // Take only the first file if multiple are dropped
      setFileInput(file);
      setNewItem({
        ...newItem,
        name: file.name,
        contentType: file.type || 'application/octet-stream',
        file: file
      });
      
      // If not in the add view mode, switch to it
      if (viewMode !== 'add') {
        setViewMode('add');
      }
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem({
      ...newItem,
      [name]: value
    });
  };

  // Get thumbnail for different content types
  const getCardThumbnail = (item) => {
    const contentType = item.contentType?.mimeType || 'unknown';
    const simpleType = getSimpleContentType(contentType);
    
    // Image thumbnails for image types
    if (contentType.startsWith('image/')) {
      return (
        <img 
          src={`/api/card-collection?action=get&hash=${item.id}`} 
          alt={item.name} 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://placehold.co/300x300?text=No+Preview";
          }}
        />
      );
    }
    
    // Icons or placeholders for other content types
    const contentTypeDisplay = {
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
    
    // Use the simple type for display if available
    const displayType = simpleType && contentTypeDisplay[simpleType] 
      ? contentTypeDisplay[simpleType]
      : contentType || 'Unknown';
    
    return (
      <div className="image-placeholder">
        {displayType}
      </div>
    );
  };

  // Render list view with card-based layout
  const renderListView = () => {
    if (loading || searchLoading) {
      return <div className="loading-indicator">Loading items...</div>;
    }

    if (error) {
      return <div className="error-message">Error: {error}</div>;
    }

    if (searchError) {
      return <div className="error-message">Search error: {searchError}</div>;
    }

    if (sortedItems.length === 0) {
      return (
        <div className="empty-state">
          {isSearchMode 
            ? <p>No results found for "{searchResults.searchTerm}"</p>
            : <p>No items available. Add your first item to get started.</p>
          }
        </div>
      );
    }

    return (
      <>
        <div className="catalog-list-cards">
          {sortedItems.map(item => (
            <div key={item.id} className="list-card">
              <div className="list-card-inner" onClick={() => handleSelectItem(item)}>
                <div className="list-card-thumbnail">
                  {getCardThumbnail(item)}
                </div>
                <div className="list-card-content">
                  <h3 className="list-card-title">{item.name}</h3>
                  <div className="list-card-meta">
                    <span className="list-card-type">
                      {item.contentType?.mimeType 
                        ? getSimpleContentType(item.contentType.mimeType) || item.contentType.mimeType 
                        : 'Unknown'}
                    </span>
                    <span className="list-card-date">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="list-card-description">{item.description}</p>
                </div>
                <div className="list-card-actions">
                  <button 
                    className="btn btn-small btn-info"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectItem(item);
                    }}
                  >
                    View
                  </button>
                  <button 
                    className="btn btn-small btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination */}
        {paginationInfo.totalPages > 1 && (
          <div className="pagination-controls">
            <button 
              className="btn btn-pagination" 
              disabled={paginationInfo.currentPage <= 1}
              onClick={() => handlePageChange(paginationInfo.currentPage - 1)}
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
              {paginationInfo.totalItems && ` (${paginationInfo.totalItems} total items)`}
            </span>
            <button 
              className="btn btn-pagination" 
              disabled={paginationInfo.currentPage >= paginationInfo.totalPages}
              onClick={() => handlePageChange(paginationInfo.currentPage + 1)}
            >
              Next
            </button>
          </div>
        )}
      </>
    );
  };

  // Render grid view
  const renderGridView = () => {
    if (loading || searchLoading) {
      return <div className="loading-indicator">Loading items...</div>;
    }

    if (error) {
      return <div className="error-message">Error: {error}</div>;
    }

    if (searchError) {
      return <div className="error-message">Search error: {searchError}</div>;
    }

    if (sortedItems.length === 0) {
      return (
        <div className="empty-state">
          {isSearchMode 
            ? <p>No results found for "{searchResults.searchTerm}"</p>
            : <p>No items available. Add your first item to get started.</p>
          }
        </div>
      );
    }

    return (
      <>
        <div className="catalog-grid-view">
          {sortedItems.map(item => (
            <div key={item.id} className="grid-item">
              <div 
                className="grid-item-card" 
                onClick={() => handleSelectItem(item)}
              >
                <div className="grid-item-thumbnail">
                  {getCardThumbnail(item)}
                </div>
                <div className="grid-item-info">
                  <h3 className="grid-item-title">{item.name}</h3>
                  <div className="grid-item-meta">
                    <span className="grid-item-type">
                      {item.contentType?.mimeType 
                        ? getSimpleContentType(item.contentType.mimeType) || item.contentType.mimeType 
                        : 'Unknown'}
                    </span>
                    <span className="grid-item-date">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="grid-item-description">{item.description}</p>
                </div>
                <div className="grid-item-actions">
                  <button 
                    className="btn btn-small btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination */}
        {paginationInfo.totalPages > 1 && (
          <div className="pagination-controls">
            <button 
              className="btn btn-pagination" 
              disabled={paginationInfo.currentPage <= 1}
              onClick={() => handlePageChange(paginationInfo.currentPage - 1)}
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
              {paginationInfo.totalItems && ` (${paginationInfo.totalItems} total items)`}
            </span>
            <button 
              className="btn btn-pagination" 
              disabled={paginationInfo.currentPage >= paginationInfo.totalPages}
              onClick={() => handlePageChange(paginationInfo.currentPage + 1)}
            >
              Next
            </button>
          </div>
        )}
      </>
    );
  };

  // Render detail view
  const renderDetailView = () => {
    if (itemLoading) {
      return <div className="loading-indicator">Loading item details...</div>;
    }

    if (itemError) {
      return <div className="error-message">Error: {itemError}</div>;
    }

    if (!selectedItem) {
      return <div className="error-message">Item not found</div>;
    }
    
    // Process and display content based on type
    const renderContent = () => {
      if (!selectedItem?.content) {
        return <div className="empty-content">No content available</div>;
      }
      
      const contentType = selectedItem.contentType || { mimeType: 'text/plain' };
      
      // Universal content wrapper to enforce containment
      const ContentWrapper = ({ children, className = '' }) => (
        <div className={`universal-content-wrapper ${className}`}>
          {children}
        </div>
      );
      
      // Handle different content types
      if (contentType.mimeType?.startsWith('image/')) {
        return (
          <ContentWrapper className="image-wrapper">
            <img src={`data:${contentType.mimeType};base64,${selectedItem.content}`} alt="Content Preview" className="content-image" />
          </ContentWrapper>
        );
      } else if (contentType.mimeType === 'application/pdf') {
        return (
          <ContentWrapper className="pdf-wrapper">
            <div className="pdf-container">
              <iframe src={`data:${contentType.mimeType};base64,${selectedItem.content}`} className="pdf-frame" title="PDF Viewer"></iframe>
            </div>
          </ContentWrapper>
        );
      } else if (contentType.mimeType?.startsWith('audio/')) {
        return (
          <ContentWrapper className="audio-wrapper">
            <audio controls className="content-audio">
              <source src={`data:${contentType.mimeType};base64,${selectedItem.content}`} type={contentType.mimeType} />
              Your browser does not support the audio element.
            </audio>
          </ContentWrapper>
        );
      } else if (contentType.mimeType?.startsWith('video/')) {
        return (
          <ContentWrapper className="video-wrapper">
            <video controls className="content-video">
              <source src={`data:${contentType.mimeType};base64,${selectedItem.content}`} type={contentType.mimeType} />
              Your browser does not support the video element.
            </video>
          </ContentWrapper>
        );
      } else if (contentType.mimeType === 'text/html') {
        return (
          <ContentWrapper className="html-wrapper">
            <div className="html-content" dangerouslySetInnerHTML={{ __html: selectedItem.content }}></div>
          </ContentWrapper>
        );
      } else if (contentType.mimeType === 'application/json' || 
                 (typeof selectedItem.content === 'string' && selectedItem.content.trim().startsWith('{'))) {
        // Parse JSON if it's not already an object
        let jsonContent;
        try {
          jsonContent = typeof selectedItem.content === 'string' 
            ? JSON.parse(selectedItem.content) 
            : selectedItem.content;
        } catch (e) {
          console.error('Error parsing JSON:', e);
          return (
            <ContentWrapper className="text-wrapper">
              <pre className="content-text">
                {typeof selectedItem.content === 'string' 
                  ? selectedItem.content 
                  : JSON.stringify(selectedItem.content, null, 2)}
              </pre>
            </ContentWrapper>
          );
        }
        
        return (
          <ContentWrapper className="json-wrapper">
            {renderJsonWithHighlighting(jsonContent)}
          </ContentWrapper>
        );
      } else if (contentType.mimeType === 'text/csv' || contentType.extension === 'csv') {
        return (
          <ContentWrapper className="csv-wrapper">
            <div className="csv-content">
              <table className="csv-table">
                <tbody>
                  {typeof selectedItem.content === 'string' && 
                    selectedItem.content.split('\n').map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.split(',').map((cell, cellIndex) => (
                          <td key={cellIndex} className="csv-cell">
                            {cell.length > 50 ? cell.substring(0, 47) + '...' : cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </ContentWrapper>
        );
      } else {
        // Default text display
        return (
          <ContentWrapper className="text-wrapper">
            <div className="content-controls">
              <div className="text-content-options">
                <label>
                  <input 
                    type="checkbox" 
                    checked={!wordWrap} 
                    onChange={() => setWordWrap(!wordWrap)} 
                  />
                  Disable word wrap
                </label>
              </div>
              <pre className={`content-text ${!wordWrap ? 'wrap-text' : 'nowrap-text'}`}>
                {typeof selectedItem.content === 'string' 
                  ? selectedItem.content 
                  : JSON.stringify(selectedItem.content, null, 2)}
              </pre>
            </div>
          </ContentWrapper>
        );
      }
    };
    
    return (
      <div className="catalog-detail-view">
        <div className="catalog-detail-header">
          <button 
            className="btn btn-back"
            onClick={() => setViewMode('list')}
          >
            Back
          </button>
          <h2>{selectedItem.name}</h2>
        </div>
        
        <div className="catalog-detail-content">
          <div className="catalog-detail-info">
            <div className="info-section">
              <p><strong>Hash:</strong> {selectedItem.hash}</p>
              <p><strong>Type:</strong> {
                selectedItem.contentType?.mimeType 
                  ? `${getSimpleContentType(selectedItem.contentType.mimeType) || selectedItem.contentType.mimeType} (${selectedItem.contentType.mimeType})` 
                  : 'Unknown'
              }</p>
              <p><strong>gtime:</strong> {new Date(selectedItem.timestamp).toLocaleString()}</p>
            </div>
            
            <div className="content-section">
              <h3>Content</h3>
              <div className="content-container">
                {renderContent()}
              </div>
            </div>
            
            <div className="catalog-detail-actions">
              <button 
                className="btn btn-danger"
                onClick={() => handleDeleteItem(selectedItem.hash)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper function to render JSON with syntax highlighting and guaranteed wrapping
  const renderJsonWithHighlighting = (jsonObj) => {
    // Convert JSON to a vertical display format that won't overflow
    const renderJsonAsTable = (obj, depth = 0) => {
      // For primitive values, just return them formatted
      if (typeof obj !== 'object' || obj === null) {
        return renderPrimitiveValue(obj);
      }
      
      // Recursive table builder
      const rows = [];
      
      // Handle arrays or objects
      const isArray = Array.isArray(obj);
      
      // For each key/index in the object/array
      Object.entries(obj).forEach(([key, value], index) => {
        // Create indentation based on depth
        const indent = '  '.repeat(depth);
        const displayKey = isArray ? `[${key}]` : key;
        
        // If value is an object, recurse, otherwise format the primitive
        if (typeof value === 'object' && value !== null) {
          // For objects/arrays, create a row with the key and a placeholder
          rows.push(
            `<tr>
              <td class="json-key-cell">${indent}${displayKey}:</td>
              <td class="json-value-cell">${isArray ? '[]' : '{'}...</td>
            </tr>`
          );
          
          // Add the nested object as indented rows
          rows.push(renderJsonAsTable(value, depth + 1));
          
          // Close the object
          rows.push(
            `<tr>
              <td class="json-key-cell">${indent}</td>
              <td class="json-value-cell">${isArray ? ']' : '}'}</td>
            </tr>`
          );
        } else {
          // For primitive values, just add a row with the key and value
          rows.push(
            `<tr>
              <td class="json-key-cell">${indent}${displayKey}:</td>
              <td class="json-value-cell">${renderPrimitiveValue(value)}</td>
            </tr>`
          );
        }
      });
      
      return rows.join('');
    };
    
    // Helper to format primitive values with truncation and highlighting
    const renderPrimitiveValue = (value) => {
      // Format and truncate based on type
      if (typeof value === 'string') {
        // Truncate long strings
        const displayValue = value.length > 30 
          ? `"${value.substring(0, 30)}..."` 
          : `"${value}"`;
        return `<span class="json-string">${displayValue}</span>`;
      } else if (typeof value === 'number') {
        return `<span class="json-number">${value}</span>`;
      } else if (typeof value === 'boolean') {
        return `<span class="json-boolean">${value}</span>`;
      } else if (value === null) {
        return `<span class="json-null">null</span>`;
      } else {
        return `<span>${String(value)}</span>`;
      }
    };
    
    // Create the table HTML
    const tableHtml = `
      <table class="json-table">
        <tbody>
          ${renderJsonAsTable(jsonObj)}
        </tbody>
      </table>
    `;
    
    // Return the HTML table with inline styles for containment
    return (
      <div 
        className="content-json-container" 
        dangerouslySetInnerHTML={{ __html: tableHtml }}
      />
    );
  };

  // Panel header with search and controls
  const renderHeader = () => (
    <>
      <div className="panel-header">
        <h2>Card Catalog</h2>
        <div className="panel-controls">
          <button 
            className="btn-refresh" 
            onClick={handleRefresh}
            title="Refresh catalog"
          >
            ↻
          </button>
          <div className="view-toggles">
            <button
              className={`btn-toggle ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button
              className={`btn-toggle ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
          </div>
          {['list', 'grid'].includes(viewMode) && (
            <button
              className="btn btn-primary"
              onClick={() => setViewMode('add')}
            >
              Add New Item
            </button>
          )}
        </div>
      </div>
      
      {['list', 'grid'].includes(viewMode) && (
        <div className="catalog-controls">
          <form className="search-container" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              className="search-input"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn btn-info search-button">
              Search
            </button>
            {isSearchMode && (
              <button
                type="button"
                className="btn btn-secondary search-button"
                onClick={handleClearSearch}
              >
                Clear
              </button>
            )}
          </form>
          
          {!isSearchMode && (
            <select 
              className="filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Types' : category}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
      
      {isSearchMode && searchResults.searchTerm && (
        <div className="search-status">
          Showing results for "{searchResults.searchTerm}" ({searchResults.totalItems || 0} items found)
        </div>
      )}
    </>
  );

  // Render form for adding new content
  const renderAddForm = () => {
    return (
      <form onSubmit={handleAddItem} className="catalog-form">
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={newItem.name}
            onChange={handleInputChange}
            placeholder="Item name (optional for text content)"
          />
        </div>
        
        <div 
          className={`form-group drop-zone ${isDragging ? 'dropping' : ''}`}
          ref={dropZoneRef}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <label htmlFor="file">
            {isDragging 
              ? "Drop file here" 
              : (newItem.file 
                ? `Selected: ${newItem.file.name}` 
                : "Drag & drop a file here, or click to browse")}
          </label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            style={{ opacity: newItem.file ? 0 : 0.01 }}
          />
          {!newItem.file && <div className="drop-icon">📁</div>}
          {newItem.file && (
            <div className="file-info">
              <span className="file-name">{newItem.file.name}</span>
              <span className="file-size">({Math.round(newItem.file.size / 1024)} KB)</span>
              <button 
                type="button" 
                className="btn-clear-file"
                onClick={() => {
                  setFileInput(null);
                  setNewItem({...newItem, file: null});
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Text Content (if not uploading a file)</label>
          <textarea
            id="description"
            name="description"
            value={newItem.description}
            onChange={handleInputChange}
            rows="6"
            placeholder="Enter text content here"
            disabled={!!newItem.file}
          />
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {newItem.file ? 'Upload File' : 'Add Content'}
          </button>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => {
              // Reset form
              setNewItem({
                name: '',
                description: '',
                contentType: 'text/plain',
                file: null
              });
              setFileInput(null);
              setViewMode('list');
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="catalog-panel" style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {renderHeader()}
      
      <div className="catalog-content" style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {viewMode === 'list' && renderListView()}
        {viewMode === 'grid' && renderGridView()}
        {viewMode === 'detail' && renderDetailView()}
        {viewMode === 'add' && renderAddForm()}
      </div>
    </div>
  );
};

export default CatalogPanel;
