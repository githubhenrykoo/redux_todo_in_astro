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
  const [verifiedItems, setVerifiedItems] = useState({});
  const [pendingVerifications, setPendingVerifications] = useState({});
  
  // Get content type display mapping
  const contentTypeMap = getContentTypeDisplay();

  // Detect actual content types by fetching and examining item data
  useEffect(() => {
    if (!sortedItems || sortedItems.length === 0) return;
    
    // Track which items are pending verification to avoid duplicates
    const updatedPending = { ...pendingVerifications };
    
    // Process a few items at a time to avoid overwhelming the network
    const itemsToVerify = sortedItems.filter(item => 
      !verifiedItems[item.id] && !pendingVerifications[item.id]
    ).slice(0, 5);
    
    // Mark these items as pending verification
    itemsToVerify.forEach(item => {
      updatedPending[item.id] = true;
    });
    
    setPendingVerifications(updatedPending);
    
    // Process each item
    itemsToVerify.forEach(item => {
      // Fetch the detailed item info with accurate content type
      fetch(`/api/card-collection?action=get&hash=${item.id}`)
        .then(response => response.json())
        .then(data => {
          if (data.success && data.card && data.card.contentType) {
            // Update with accurate content type from API
            setVerifiedItems(prev => ({
              ...prev,
              [item.id]: {
                contentType: data.card.contentType,
                isVerified: true
              }
            }));
          } else {
            // Fallback to type detection via image loading if API doesn't return contentType
            detectViaImageLoading(item);
          }
          
          // Remove from pending status
          setPendingVerifications(prev => {
            const updated = { ...prev };
            delete updated[item.id];
            return updated;
          });
        })
        .catch(error => {
          console.error(`Error fetching details for item ${item.id}:`, error);
          // Fallback to type detection via image loading if API fails
          detectViaImageLoading(item);
          
          // Remove from pending status
          setPendingVerifications(prev => {
            const updated = { ...prev };
            delete updated[item.id];
            return updated;
          });
        });
    });
  }, [sortedItems, verifiedItems, pendingVerifications]);
  
  // Helper function to detect content type via image loading
  const detectViaImageLoading = (item) => {
    const img = new Image();
    
    img.onload = () => {
      // If it loads, it's an image - try to determine specific type
      let imgType = 'image/png'; // Default
      
      // Try to infer specific type from URL or response
      if (img.src.includes('.gif')) {
        imgType = 'image/gif';
      } else if (img.src.includes('.jpg') || img.src.includes('.jpeg')) {
        imgType = 'image/jpeg';
      }
      
      setVerifiedItems(prev => ({
        ...prev,
        [item.id]: {
          contentType: { mimeType: imgType },
          isVerified: true
        }
      }));
    };
    
    img.onerror = () => {
      // If it fails to load as an image, keep original content type
      setVerifiedItems(prev => ({
        ...prev,
        [item.id]: {
          contentType: item.contentType,
          isVerified: true
        }
      }));
    };
    
    // Try to load the item as an image
    img.src = `/api/card-collection?action=get&hash=${item.id}`;
  };

  // Helper function to get proper content type display
  const getFormattedContentType = (item) => {
    // If we've verified this item's content type, use that instead
    const verifiedItem = verifiedItems[item.id];
    if (verifiedItem && verifiedItem.isVerified) {
      const mimeType = verifiedItem.contentType.mimeType;
      const simpleType = getSimpleContentType(mimeType);
      return `${contentTypeMap[simpleType] || simpleType.toUpperCase()} (${mimeType})`;
    }
    
    // Otherwise use the original content type
    if (!item.contentType?.mimeType) return 'Unknown';
    
    const simpleType = getSimpleContentType(item.contentType.mimeType);
    if (!simpleType) return item.contentType.mimeType;
    
    return `${contentTypeMap[simpleType] || simpleType.toUpperCase()} (${item.contentType.mimeType})`;
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
      <div className="catalog-grid-view">
        {sortedItems.map(item => {
          // Use verified content type if available
          const verifiedItem = verifiedItems[item.id];
          const displayItem = verifiedItem && verifiedItem.isVerified
            ? { ...item, contentType: verifiedItem.contentType }
            : item;
          
          return (
            <div key={item.id} className="grid-item">
              <div 
                className="grid-item-card" 
                onClick={() => onSelectItem(item)}
              >
                <div className="grid-item-thumbnail">
                  <CardThumbnail item={displayItem} />
                </div>
                <div className="grid-item-info">
                  <h3 className="grid-item-title">{item.name}</h3>
                  <div className="grid-item-meta">
                    <span className="grid-item-type">
                      {getFormattedContentType(displayItem)}
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
          );
        })}
      </div>
      
      <PaginationControls 
        paginationInfo={paginationInfo} 
        onPageChange={onPageChange} 
      />
    </>
  );
};

export default GridView;
