import React from 'react';
import CardThumbnail from './CardThumbnail';
import PaginationControls from './PaginationControls';
import { getSimpleContentType, getContentTypeDisplay } from './utils';

/**
 * List view component for catalog items
 */
const ListView = ({ 
  loading, 
  error, 
  searchError, 
  isSearchMode, 
  searchResults,
  sortedItems, 
  paginationInfo, 
  onSelectItem, 
  onDeleteItem,
  onPageChange 
}) => {
  // Get content type display mapping
  const contentTypeMap = getContentTypeDisplay();

  // Helper function to get proper content type display
  const getFormattedContentType = (mimeType) => {
    if (!mimeType) return 'Unknown';
    
    const simpleType = getSimpleContentType(mimeType);
    if (!simpleType) return mimeType;
    
    return contentTypeMap[simpleType] || simpleType.toUpperCase();
  };

  if (loading) {
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
            <div className="list-card-inner" onClick={() => onSelectItem(item)}>
              <div className="list-card-thumbnail">
                <CardThumbnail item={item} />
              </div>
              <div className="list-card-content">
                <h3 className="list-card-title">{item.name}</h3>
                <div className="list-card-meta">
                  <span className="list-card-type">
                    {item.contentType?.mimeType 
                      ? getFormattedContentType(item.contentType.mimeType)
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
                    onSelectItem(item);
                  }}
                >
                  View
                </button>
                <button 
                  className="btn btn-small btn-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem(item.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <PaginationControls 
        paginationInfo={paginationInfo} 
        onPageChange={onPageChange} 
      />
    </>
  );
};

export default ListView;
