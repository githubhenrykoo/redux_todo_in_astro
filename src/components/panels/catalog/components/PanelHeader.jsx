import React, { useState } from 'react';

/**
 * PanelHeader component for the CatalogPanel
 * Provides search, view mode toggles, and refresh functionality
 */
const PanelHeader = ({ 
  viewMode, 
  onViewModeChange, 
  onRefresh,
  onSearch,
  onClearSearch,
  isSearchMode,
  categories,
  filter,
  onFilterChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      // Clear search if empty
      onClearSearch();
      return;
    }
    
    onSearch(searchTerm);
  };

  return (
    <>
      <div className="panel-header">
        <h2>Card Catalog</h2>
        <div className="panel-controls">
          <button 
            className="btn-refresh" 
            onClick={onRefresh}
            title="Refresh catalog"
          >
            ↻
          </button>
          <div className="view-toggles">
            <button
              className={`btn-toggle ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => onViewModeChange('list')}
            >
              List
            </button>
            <button
              className={`btn-toggle ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => onViewModeChange('grid')}
            >
              Grid
            </button>
          </div>
          {['list', 'grid'].includes(viewMode) && (
            <button
              className="btn btn-primary"
              onClick={() => onViewModeChange('add')}
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
                onClick={() => {
                  setSearchTerm('');
                  onClearSearch();
                }}
              >
                Clear
              </button>
            )}
          </form>
          
          {!isSearchMode && (
            <select 
              className="filter-select"
              value={filter}
              onChange={(e) => onFilterChange(e.target.value)}
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
    </>
  );
};

export default PanelHeader;
