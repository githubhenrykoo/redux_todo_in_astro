import React, { useEffect, useState } from 'react';
import CardThumbnail from './CardThumbnail';
import PaginationControls from './PaginationControls';
import { getSimpleContentType, getContentTypeDisplay } from './utils';

/**
 * Grid view component for catalog items
 */
const GridView = ({ 
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
  const [itemsWithVerifiedTypes, setItemsWithVerifiedTypes] = useState({});
  
  // Get content type display mapping
  const contentTypeMap = getContentTypeDisplay();

  // Helper function to get proper content type display
  const getFormattedContentType = (item) => {
    // If we have already verified this item's content type, use that
    if (itemsWithVerifiedTypes[item.id]) {
      const verifiedType = itemsWithVerifiedTypes[item.id];
      return `${contentTypeMap[verifiedType] || verifiedType.toUpperCase()} (image/${verifiedType})`;
    }
    
    // Otherwise use the content type from the item data
    if (!item.contentType?.mimeType) return 'Unknown';
    
    const simpleType = getSimpleContentType(item.contentType.mimeType);
    if (!simpleType) return item.contentType.mimeType;
    
    return `${contentTypeMap[simpleType] || simpleType.toUpperCase()} (${item.contentType.mimeType})`;
  };

  // Verify content types by checking if images load
  useEffect(() => {
    if (!sortedItems || sortedItems.length === 0) return;
    
    // Check each item to see if it's actually an image
    sortedItems.forEach(item => {
      if (itemsWithVerifiedTypes[item.id]) return; // Skip if already verified
      
      // Try to load the item as an image
      const img = new Image();
      img.onload = () => {
        // If it loads, it's an image
        const imgType = img.src.includes('.gif') ? 'gif' : 'png';
        setItemsWithVerifiedTypes(prev => ({
          ...prev,
          [item.id]: imgType
        }));
      };
      img.onerror = () => {
        // If it fails to load, it's not an image - keep original type
      };
      img.src = `/api/card-collection?action=get&hash=${item.id}`;
    });
  }, [sortedItems]);

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
      <div className="catalog-grid-view">
        {sortedItems.map(item => (
          <div key={item.id} className="grid-item">
            <div 
              className="grid-item-card" 
              onClick={() => onSelectItem(item)}
            >
              <div className="grid-item-thumbnail">
                <CardThumbnail 
                  item={{
                    ...item,
                    contentType: itemsWithVerifiedTypes[item.id] 
                      ? { mimeType: `image/${itemsWithVerifiedTypes[item.id]}` } 
                      : item.contentType
                  }} 
                />
              </div>
              <div className="grid-item-info">
                <h3 className="grid-item-title">{item.name}</h3>
                <div className="grid-item-meta">
                  <span className="grid-item-type">
                    {getFormattedContentType(item)}
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

export default GridView;
