import React from 'react';
import { getSimpleContentType, contentTypeDisplayMap } from '../utils/contentTypeUtils';

/**
 * ListView component for displaying catalog items in a card-based list format
 */
const ListView = ({ 
  items, 
  isLoading, 
  error,
  pagination, 
  onSelectItem, 
  onDeleteItem,
  onPageChange,
  isSearchMode,
  searchTerm,
  searchError
}) => {
  if (isLoading) {
    return <div className="loading-indicator">Loading items...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (searchError) {
    return <div className="error-message">Search error: {searchError}</div>;
  }

  if (items.length === 0) {
    return (
      <div className="empty-state">
        {isSearchMode 
          ? <p>No results found for "{searchTerm}"</p>
          : <p>No items available. Add your first item to get started.</p>
        }
      </div>
    );
  }

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
    const displayType = simpleType && contentTypeDisplayMap[simpleType] 
      ? contentTypeDisplayMap[simpleType]
      : contentType || 'Unknown';
    
    return (
      <div className="image-placeholder">
        {displayType}
      </div>
    );
  };

  return (
    <>
      <div className="catalog-list-cards">
        {items.map(item => (
          <div key={item.id} className="list-card">
            <div className="list-card-inner" onClick={() => onSelectItem(item)}>
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
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination-controls">
          <button 
            className="btn btn-pagination" 
            disabled={pagination.currentPage <= 1}
            onClick={() => onPageChange(pagination.currentPage - 1)}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
            {pagination.totalItems && ` (${pagination.totalItems} total items)`}
          </span>
          <button 
            className="btn btn-pagination" 
            disabled={pagination.currentPage >= pagination.totalPages}
            onClick={() => onPageChange(pagination.currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
};

export default ListView;
