import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { importCardFromDatabase, selectContent } from './contentSlice';
import { selectItem } from './selectedItemSlice';
import * as api from '../components/panels/catalog/api';
import { processApiItems, updatePagination, processContentForDisplay } from '../components/panels/catalog/dataHelpers';
import { getSimpleContentType } from '../components/panels/catalog/utils';

/**
 * Custom hook for catalog data management
 * @returns {Object} - Catalog data and functions
 */
const useCatalogData = () => {
  const dispatch = useDispatch();
  
  // Main state
  const [items, setItems] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
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

  // API Handlers
  const fetchCatalogItems = async () => {
    setLoading(true);
    try {
      const data = await api.fetchItemsPage(1, pagination.pageSize);
      if (data.success) {
        const transformedItems = processApiItems(data);
        setItems(transformedItems);
        setPagination(updatePagination(data, transformedItems, pagination.pageSize));
      } else {
        setError(data.error || 'Failed to fetch items');
      }
    } catch (error) {
      console.error('Error fetching catalog items:', error);
      setError('Failed to fetch catalog items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (isSearchMode) {
      fetchSearchPage(newPage);
    } else {
      fetchItemsPage(newPage);
    }
  };

  const fetchItemsPage = async (newPage) => {
    setLoading(true);
    try {
      const data = await api.fetchItemsPage(newPage, pagination.pageSize);
      if (data.success) {
        const transformedItems = processApiItems(data);
        setItems(transformedItems);
        setPagination(updatePagination(data, transformedItems, pagination.pageSize));
      } else {
        setError(data.error || 'Failed to fetch items');
      }
    } catch (error) {
      console.error('Error fetching catalog items:', error);
      setError('Failed to fetch catalog items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSearchPage = async (newPage) => {
    setSearchLoading(true);
    try {
      const data = await api.searchByContent(searchResults.searchTerm, newPage, pagination.pageSize);
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
    } catch (error) {
      console.error('Error searching catalog items:', error);
      setSearchError('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Item Actions
  const handleSelectItem = async (item) => {
    setItemLoading(true);
    setViewMode('detail');
    
    try {
      const data = await api.getItemByHash(item.id);
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
    } catch (error) {
      console.error('Error fetching card by ID:', error);
      setItemError('Failed to fetch card. Please try again.');
    } finally {
      setItemLoading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const data = await api.deleteItemByHash(id);
        if (data.success) {
          setItems(prevItems => prevItems.filter(item => item.id !== id));
          if (selectedItem && selectedItem.id === id) {
            setSelectedItem(null);
            setViewMode('grid');
          }
        } else {
          setError(data.error || 'Failed to delete item');
        }
      } catch (error) {
        console.error('Error deleting catalog item:', error);
        setError('Failed to delete item. Please try again.');
      }
    }
  };

  const handleAddItem = (newItemData) => {
    if (newItemData.file) {
      addFileItem(newItemData);
    } else if (newItemData.description) {
      addTextItem(newItemData);
    }
  };

  const addFileItem = async (newItemData) => {
    setLoading(true);
    try {
      const data = await api.addFileItem(newItemData);
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
    } catch (error) {
      console.error('Error adding catalog item:', error);
      setError(`Failed to add item: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addTextItem = async (newItemData) => {
    setLoading(true);
    try {
      const data = await api.addTextItem(newItemData);
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
    } catch (error) {
      console.error('Error adding catalog item:', error);
      setError(`Failed to add item: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // UI Handlers
  const handleRefresh = () => {
    if (isSearchMode) clearSearch();
    fetchCatalogItems();
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      clearSearch();
      return;
    }
    
    setIsSearchMode(true);
    setSearchLoading(true);
    
    try {
      const data = await api.searchByContent(searchTerm, 1, pagination.pageSize);
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
    } catch (error) {
      console.error('Error searching catalog items:', error);
      setSearchError('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setIsSearchMode(false);
    setSearchResults({
      items: [], currentPage: 1, totalPages: 1, totalItems: 0, searchTerm: ''
    });
    setSearchTerm('');
  };

  return {
    // State
    items,
    viewMode,
    setViewMode,
    selectedItem,
    loading,
    itemLoading,
    searchLoading,
    error,
    itemError,
    searchError,
    searchTerm,
    setSearchTerm,
    isSearchMode,
    categories,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    pagination,
    searchResults,
    sortedItems,
    paginationInfo,
    
    // Functions
    handleSelectItem,
    handleDeleteItem,
    handleAddItem,
    handleRefresh,
    handleSearchSubmit,
    clearSearch,
    handlePageChange
  };
};

export default useCatalogData;
