import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { importCardFromDatabase, selectContent } from '../../../features/contentSlice';
import { selectItem } from '../../../features/selectedItemSlice';

// Import API services
import { 
  fetchCatalogItems, 
  searchCatalogItems, 
  fetchItemById,
  deleteItem,
  addFileItem,
  addTextContent 
} from './api/catalogService';

// Import components
import PanelHeader from './components/PanelHeader';
import ListView from './views/ListView';
import GridView from './views/GridView';
import DetailView from './views/DetailView';
import AddItemForm from './views/AddItemForm';

// Import utilities
import { DEFAULT_CONTENT_TYPES, getSimpleContentType } from './utils/contentTypeUtils';

// Import styles
import '../../../styles/CatalogPanel.css';

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
  
  const [viewMode, setViewMode] = useState('list'); // 'list', 'grid', 'detail', 'add'
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [addItemError, setAddItemError] = useState(null);
  const [addItemLoading, setAddItemLoading] = useState(false);
  
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
  const loadCatalogItems = async () => {
    setLoading(true);
    setError(null);
    
    const result = await fetchCatalogItems(pagination.currentPage, pagination.pageSize);
    
    if (result.success) {
      setItems(result.items);
      setPagination(result.pagination);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  // Initial fetch on component mount
  useEffect(() => {
    loadCatalogItems();
  }, []);

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
    }
    
    // Fetch items again
    loadCatalogItems();
  };

  // Handle pagination change
  const handlePageChange = async (newPage) => {
    if (isSearchMode) {
      setSearchLoading(true);
      setSearchError(null);
      
      const result = await searchCatalogItems(
        searchResults.searchTerm, 
        newPage, 
        pagination.pageSize
      );
      
      if (result.success) {
        setSearchResults({
          items: result.items,
          currentPage: result.pagination.currentPage,
          totalPages: result.pagination.totalPages,
          totalItems: result.pagination.totalItems,
          searchTerm: searchResults.searchTerm
        });
      } else {
        setSearchError(result.error);
      }
      
      setSearchLoading(false);
    } else {
      setLoading(true);
      setError(null);
      
      const result = await fetchCatalogItems(newPage, pagination.pageSize);
      
      if (result.success) {
        setItems(result.items);
        setPagination(result.pagination);
      } else {
        setError(result.error);
      }
      
      setLoading(false);
    }
  };

  // Handle item selection
  const handleSelectItem = async (item) => {
    setItemLoading(true);
    setItemError(null);
    setViewMode('detail');
    
    const result = await fetchItemById(item.id);
    
    if (result.success) {
      setSelectedItem(result.item);
      
      // Get content type from server response
      const serverContentType = result.item.contentType;
      
      // Extract a simple content type string for the UI
      const simpleType = serverContentType?.extension || 
                     (serverContentType?.mimeType ? getSimpleContentType(serverContentType.mimeType) : null) || 
                     "txt";
      
      // Import the card to contentSlice Redux store for cross-panel integration
      dispatch(importCardFromDatabase({ 
        hash: result.item.hash,
        content: result.item.content,
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
      dispatch(selectContent(result.item.hash));
      
      // Update the selectedItem state with card details for selected item slice
      dispatch(selectItem({
        item: result.item.content,
        hash: result.item.hash,
        contentType: simpleType,
        gtime: result.item.timestamp
      }));
    } else {
      setItemError(result.error);
    }
    
    setItemLoading(false);
  };

  // Handle item deletion
  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const result = await deleteItem(id);
      
      if (result.success) {
        // Remove item from state
        setItems(prevItems => prevItems.filter(item => item.id !== id));
        // If we're viewing the item that was deleted, go back to list view
        if (selectedItem && selectedItem.id === id) {
          setSelectedItem(null);
          setViewMode('list');
        }
      } else {
        setError(result.error);
      }
    }
  };

  // Handle search submission
  const handleSearch = async (searchTerm) => {
    if (!searchTerm.trim()) {
      // Clear search if empty
      handleClearSearch();
      return;
    }
    
    setIsSearchMode(true);
    setSearchLoading(true);
    setSearchError(null);
    
    const result = await searchCatalogItems(searchTerm, 1, pagination.pageSize);
    
    if (result.success) {
      setSearchResults({
        items: result.items,
        currentPage: result.pagination.currentPage,
        totalPages: result.pagination.totalPages,
        totalItems: result.pagination.totalItems,
        searchTerm: searchTerm
      });
    } else {
      setSearchError(result.error);
    }
    
    setSearchLoading(false);
  };

  // Clear search and return to normal view
  const handleClearSearch = () => {
    setIsSearchMode(false);
    setSearchResults({
      items: [],
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      searchTerm: ''
    });
  };

  // Handle new item submission from the AddItemForm
  const handleAddItem = async (formData) => {
    setAddItemLoading(true);
    setAddItemError(null);
    
    let result;
    
    if (formData.file) {
      // File upload
      const metadata = {
        fileName: formData.name,
        mimeType: formData.contentType || DEFAULT_CONTENT_TYPES.BINARY,
        size: formData.file.size,
        description: formData.description || ''
      };
      
      result = await addFileItem(formData.file, metadata);
    } else if (formData.description) {
      // Text content
      result = await addTextContent({
        text: formData.description,
        name: formData.name,
        contentType: formData.contentType || DEFAULT_CONTENT_TYPES.TEXT
      });
    } else {
      setAddItemError('Please provide content to add');
      setAddItemLoading(false);
      return;
    }
    
    if (result.success) {
      // Successfully added, refresh the catalog and reset the form
      loadCatalogItems();
      setViewMode('list');
    } else {
      setAddItemError(result.error);
    }
    
    setAddItemLoading(false);
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  // Handle view mode change
  const handleViewModeChange = (newMode) => {
    setViewMode(newMode);
  };

  return (
    <div className="catalog-panel" style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <PanelHeader 
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onRefresh={handleRefresh}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        isSearchMode={isSearchMode}
        categories={categories}
        filter={filter}
        onFilterChange={handleFilterChange}
      />
      
      {isSearchMode && searchResults.searchTerm && (
        <div className="search-status">
          Showing results for "{searchResults.searchTerm}" ({searchResults.totalItems || 0} items found)
        </div>
      )}
      
      <div className="catalog-content" style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {viewMode === 'list' && (
          <ListView 
            items={sortedItems}
            isLoading={loading || searchLoading}
            error={error}
            pagination={paginationInfo}
            onSelectItem={handleSelectItem}
            onDeleteItem={handleDeleteItem}
            onPageChange={handlePageChange}
            isSearchMode={isSearchMode}
            searchTerm={searchResults.searchTerm}
            searchError={searchError}
          />
        )}
        
        {viewMode === 'grid' && (
          <GridView 
            items={sortedItems}
            isLoading={loading || searchLoading}
            error={error}
            pagination={paginationInfo}
            onSelectItem={handleSelectItem}
            onDeleteItem={handleDeleteItem}
            onPageChange={handlePageChange}
            isSearchMode={isSearchMode}
            searchTerm={searchResults.searchTerm}
            searchError={searchError}
          />
        )}
        
        {viewMode === 'detail' && (
          <DetailView 
            item={selectedItem}
            isLoading={itemLoading}
            error={itemError}
            onBack={() => setViewMode('list')}
            onDelete={handleDeleteItem}
          />
        )}
        
        {viewMode === 'add' && (
          <AddItemForm 
            onSubmit={handleAddItem}
            onCancel={() => setViewMode('list')}
            isLoading={addItemLoading}
            error={addItemError}
          />
        )}
      </div>
    </div>
  );
};

export default CatalogPanel;
