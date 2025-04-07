import React, { useState, useEffect } from 'react';
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

  // Initial fetch on component mount
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    fetch(`/api/card-collection?action=getPage&pageNumber=1&pageSize=${pagination.pageSize}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log('Fetched items:', data);
          // Transform cards into catalog items
          const transformedItems = data.cards.map(card => ({
            id: card.hash,
            name: card.hash.substring(0, 8), // Use first 8 chars of hash as name
            category: card.contentType?.mimeType || 'Unknown',
            description: 'Card content hash: ' + card.hash,
            timestamp: card.timestamp || new Date().toISOString(),
            hash: card.hash,
            contentType: card.contentType,
            metaData: card.metaData || {}
          }));
          
          setItems(transformedItems);
          setPagination({
            currentPage: data.currentPage,
            totalPages: data.totalPages,
            totalItems: data.totalCards,
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
            const transformedItems = data.cards.map(card => ({
              id: card.hash,
              name: card.hash.substring(0, 8),
              category: card.contentType?.mimeType || 'Unknown',
              description: 'Matching content: ' + (card.matchContext || ''),
              hash: card.hash,
              timestamp: card.timestamp || new Date().toISOString(),
              contentType: card.contentType
            }));
            
            setSearchResults({
              items: transformedItems,
              currentPage: data.currentPage,
              totalPages: data.totalPages,
              totalItems: data.totalResults,
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
            const transformedItems = data.cards.map(card => ({
              id: card.hash,
              name: card.hash.substring(0, 8),
              category: card.contentType?.mimeType || 'Unknown',
              description: 'Card content hash: ' + card.hash,
              timestamp: card.timestamp || new Date().toISOString(),
              hash: card.hash,
              contentType: card.contentType,
              metaData: card.metaData || {}
            }));
            
            setItems(transformedItems);
            setPagination({
              currentPage: data.currentPage,
              totalPages: data.totalPages,
              totalItems: data.totalCards,
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
          const transformedItems = (data.cards || []).map(card => ({
            id: card.hash,
            name: card.hash.substring(0, 8),
            category: card.contentType?.mimeType || 'Unknown',
            description: 'Matching content: ' + (card.matchContext || ''),
            hash: card.hash,
            timestamp: card.timestamp || new Date().toISOString(),
            contentType: card.contentType
          }));
          
          setSearchResults({
            items: transformedItems,
            currentPage: data.currentPage || 1,
            totalPages: data.totalPages || 1,
            totalItems: data.totalResults || transformedItems.length,
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
      formData.append('name', newItem.name);
      formData.append('description', newItem.description || '');
      
      setLoading(true);
      setError(null);
      
      fetch('/api/card-collection?action=add', {
        method: 'POST',
        body: formData
      })
        .then(response => response.json())
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
          setError('Failed to add item. Please try again.');
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
          name: newItem.name,
          content: newItem.description,
          contentType: { mimeType: newItem.contentType || 'text/plain' }
        })
      })
        .then(response => response.json())
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
          setError('Failed to add item. Please try again.');
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

  // Render list view
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
        <div className="catalog-list-view">
          <table className="catalog-table">
            <thead>
              <tr>
                <th onClick={() => setSortBy('name')}>
                  Name {sortBy === 'name' && '↓'}
                </th>
                <th>Type</th>
                <th onClick={() => setSortBy('timestamp')}>
                  Timestamp {sortBy === 'timestamp' && '↓'}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map(item => (
                <tr key={item.id}>
                  <td onClick={() => handleSelectItem(item)} className="item-name">
                    {item.name}
                  </td>
                  <td>
                    {item.contentType?.mimeType 
                      ? getSimpleContentType(item.contentType.mimeType) || item.contentType.mimeType 
                      : 'Unknown'}
                  </td>
                  <td>{new Date(item.timestamp).toLocaleString()}</td>
                  <td className="item-actions">
                    <button 
                      className="btn btn-small btn-info"
                      onClick={() => handleSelectItem(item)}
                    >
                      View
                    </button>
                    <button 
                      className="btn btn-small btn-danger"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <div 
              key={item.id} 
              className="catalog-card"
              onClick={() => handleSelectItem(item)}
            >
              <div className="catalog-card-image">
                {getCardThumbnail(item)}
              </div>
              <div className="catalog-card-content">
                <h3>{item.name}</h3>
                <p className="catalog-card-category">
                  {item.contentType?.mimeType 
                    ? getSimpleContentType(item.contentType.mimeType) || item.contentType.mimeType 
                    : 'Unknown'}
                </p>
                <p className="catalog-timestamp">{new Date(item.timestamp).toLocaleString()}</p>
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
    
    // Determine content display method based on content type
    const renderContent = () => {
      // If content is not loaded yet
      if (!selectedItem.content) {
        return <div className="content-placeholder">Content not available</div>;
      }
      
      const content = selectedItem.content;
      const contentType = selectedItem.contentType?.mimeType || 'text/plain';
      const simpleType = getSimpleContentType(contentType);
      
      // Handle string content directly
      if (typeof content === 'string') {
        // JSON formatting
        if (simpleType === 'json') {
          try {
            const json = JSON.parse(content);
            return (
              <pre className="content-json">
                {JSON.stringify(json, null, 2)}
              </pre>
            );
          } catch (e) {
            // If parsing fails, display as plain text
            console.error("Failed to parse JSON:", e);
          }
        }
        
        // HTML content
        if (simpleType === 'html') {
          return (
            <div className="html-content">
              <div dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          );
        }
        
        // Default text display
        return (
          <pre className="content-text">
            {content}
          </pre>
        );
      }
      
      // Handle base64 object format from the API
      if (typeof content === 'object' && content !== null) {
        // String data inside an object wrapper
        if (content.type === 'string' && content.data) {
          return (
            <pre className="content-text">
              {content.data}
            </pre>
          );
        }
        
        // Base64 encoded content
        if (content.type === 'base64' && content.data) {
          const mimeType = content.originalType || contentType;
          const simpleMimeType = getSimpleContentType(mimeType);
          
          // Images
          if (mimeType.startsWith('image/')) {
            return (
              <img 
                src={`data:${mimeType};base64,${content.data}`} 
                alt={selectedItem.name}
                className="content-image"
              />
            );
          }
          
          // Audio
          if (mimeType.startsWith('audio/')) {
            return (
              <audio controls className="content-audio">
                <source src={`data:${mimeType};base64,${content.data}`} type={mimeType} />
                Your browser does not support the audio element.
              </audio>
            );
          }
          
          // Video
          if (mimeType.startsWith('video/')) {
            return (
              <video controls className="content-video">
                <source src={`data:${mimeType};base64,${content.data}`} type={mimeType} />
                Your browser does not support the video element.
              </video>
            );
          }
          
          // PDF
          if (mimeType === 'application/pdf') {
            return (
              <div className="pdf-container">
                <iframe 
                  src={`data:${mimeType};base64,${content.data}`} 
                  className="pdf-frame"
                  title="PDF Document"
                />
              </div>
            );
          }
          
          // Binary file (download link)
          return (
            <div className="binary-content">
              <p>Binary content: {mimeType || 'unknown type'}</p>
              <p>Detection method: {content.detectionMethod || 'unknown'}</p>
              <a 
                href={`data:${mimeType};base64,${content.data}`}
                download={selectedItem.name || 'download'}
                className="btn btn-primary"
              >
                Download File
              </a>
            </div>
          );
        }
        
        // Buffer format
        if (content.type === 'Buffer' && Array.isArray(content.data)) {
          return (
            <div className="binary-content">
              <p>Binary Buffer Data</p>
              <p>Size: {content.data.length} bytes</p>
              <p>(Buffer preview not available)</p>
            </div>
          );
        }
      }
      
      // Fallback for unknown content
      return (
        <div className="content-unknown">
          <p>Content preview not available</p>
          <p>Content type: {contentType || 'unknown'}</p>
          <pre className="content-debug">
            {JSON.stringify(content, null, 2)}
          </pre>
        </div>
      );
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
              <p><strong>ID:</strong> {selectedItem.id}</p>
              <p><strong>Type:</strong> {
                selectedItem.contentType?.mimeType 
                  ? `${getSimpleContentType(selectedItem.contentType.mimeType) || selectedItem.contentType.mimeType} (${selectedItem.contentType.mimeType})` 
                  : 'Unknown'
              }</p>
              <p><strong>Created:</strong> {new Date(selectedItem.timestamp).toLocaleString()}</p>
              <p><strong>Description:</strong></p>
              <div className="catalog-description">{selectedItem.description}</div>
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
                onClick={() => handleDeleteItem(selectedItem.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Panel header with search and controls
  const renderHeader = () => (
    <>
      <div className="panel-header">
        <h2>Card Catalog</h2>
        <div className="panel-controls">
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
        
        <div className="form-group">
          <label htmlFor="file">Upload File (optional)</label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
          />
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
            Add Item
          </button>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => setViewMode('list')}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="catalog-panel">
      {renderHeader()}
      
      {viewMode === 'list' && renderListView()}
      {viewMode === 'grid' && renderGridView()}
      {viewMode === 'detail' && renderDetailView()}
      {viewMode === 'add' && renderAddForm()}
    </div>
  );
};

export default CatalogPanel;
