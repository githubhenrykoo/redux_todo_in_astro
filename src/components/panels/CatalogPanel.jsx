import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import '../../styles/CatalogPanel.css';

// Import subcomponents
import GridView from './catalog/GridView';
import ListView from './catalog/ListView';
import DetailView from './catalog/DetailView';
import CatalogHeader from './catalog/CatalogHeader';
import AddItemForm from './catalog/AddItemForm';

// Import specialized hooks
import { useItemActions } from './catalog/ItemActions';
import { useItemSubmission } from './catalog/ItemSubmission';
import { useSearchHandler } from './catalog/SearchHandler';
import { useDataFetcher } from './catalog/DataFetcher';

/**
 * CatalogPanel - Component for displaying and managing catalog items
 * Refactored into smaller, maintainable pieces
 */
const CatalogPanel = () => {
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

  // Initialize specialized hooks
  const { fetchCatalogItems, fetchItemsPage } = useDataFetcher({
    setLoading, setError, setItems, setPagination, pagination
  });
  
  const { handleSelectItem, handleDeleteItem } = useItemActions({
    setViewMode, setSelectedItem, setItemLoading, setItemError, setItems, selectedItem
  });
  
  const { handleAddItem } = useItemSubmission({
    setLoading, setError, setItems, setViewMode
  });
  
  const { handleSearchSubmit, clearSearch, fetchSearchPage, handleRefresh } = useSearchHandler({
    searchTerm, setSearchTerm, isSearchMode, setIsSearchMode, 
    searchResults, setSearchResults, setSearchLoading, setSearchError,
    pagination, fetchCatalogItems
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

  const handlePageChange = (newPage) => {
    if (isSearchMode) {
      fetchSearchPage(newPage);
    } else {
      fetchItemsPage(newPage);
    }
  };

  // Render main component
  return (
    <div className="catalog-panel" style={{ 
      height: '100%', 
      width: '100%', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Fixed header at top */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: 'var(--panel-header-bg, #2c2c2c)', /* Restore original header background */
        borderBottom: '1px solid var(--border-color, #3e3e3e)' /* Restore border */
      }}>
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
      </div>
      
      {/* Scrollable content area with offset for header */}
      <div style={{ 
        position: 'absolute',
        top: '110px', /* Increased from 60px to account for full header height including search */
        bottom: 0,
        left: 0,
        right: 0,
        overflowY: 'scroll',
        overflowX: 'hidden',
        padding: '0',
        backgroundColor: 'var(--bg-color, #1e1e1e)' /* Use CSS variable for background */
      }}>
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
