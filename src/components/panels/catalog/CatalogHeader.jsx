import React from 'react';

/**
 * Header component for the catalog panel
 */
const CatalogHeader = ({ 
  viewMode, 
  setViewMode, 
  searchTerm, 
  setSearchTerm, 
  isSearchMode, 
  categories,
  filter,
  setFilter,
  handleSearchSubmit,
  handleClearSearch,
  handleRefresh,
  searchResults
}) => {
  return (
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
};

export default CatalogHeader;
