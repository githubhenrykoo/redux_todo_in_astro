import React, { useEffect, useState, useCallback } from 'react';
import GridItemPreview from './GridItemPreview';
import PaginationControls from './PaginationControls';
import { getSimpleContentType, getContentTypeDisplay } from './utils';
import './grid-item-preview.css';

/**
 * TypeGridView - Organizes catalog items by content type
 * This creates a grid layout similar to the cloud provider categorization example
 * with main cards for categories and sub-cards for items
 */
const TypeGridView = ({ 
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
  const [hoveredItem, setHoveredItem] = useState(null);
  const [groupedItems, setGroupedItems] = useState({});
  
  // Get content type display mapping
  const contentTypeMap = getContentTypeDisplay();

  // Helper function to determine if an item is an image
  const isImageItem = (item) => {
    if (!item || !item.contentType) return false;
    
    const contentType = typeof item.contentType === 'string' 
      ? item.contentType 
      : item.contentType.mimeType || '';
      
    return contentType.startsWith('image/');
  };

  // Helper function to get proper content type display
  const getFormattedContentType = (item) => {
    if (!item || !item.contentType) return 'Unknown';
    
    const contentType = typeof item.contentType === 'string'
      ? item.contentType
      : item.contentType.mimeType || '';
      
    const simpleType = getSimpleContentType(contentType);
    
    // Get pretty display from mapping or use fallback format
    return contentTypeMap[simpleType] || simpleType;
  };

  // Get the specific file type for an item (for more detailed grouping)
  const getFileType = (item) => {
    if (!item || !item.contentType) return 'Unknown';
    
    const contentType = typeof item.contentType === 'string'
      ? item.contentType
      : item.contentType.mimeType || '';
    
    // Extract the specific file type from the content type
    const simpleType = getSimpleContentType(contentType);
    
    // Map of specific file types for grouping
    const typeMap = {
      'text/csv': 'CSV',
      'text/x-python': 'Python',
      'text/x-python-script': 'Python',
      'application/python': 'Python',
      'application/octet-stream': 'Binary',
      'image/png': 'PNG',
      'image/jpeg': 'JPEG',
      'image/gif': 'GIF',
      'image/webp': 'WebP',
      'image/svg+xml': 'SVG',
      'video/mp4': 'MP4',
      'video/quicktime': 'QuickTime',
      'video/webm': 'WebM',
      'audio/mpeg': 'MP3',
      'audio/wav': 'WAV',
      'audio/ogg': 'OGG',
      'text/plain': 'Text',
      'text/html': 'HTML',
      'application/json': 'JSON',
      'application/javascript': 'JavaScript',
      'text/javascript': 'JavaScript',
      'application/pdf': 'PDF'
    };
    
    return typeMap[simpleType] || simpleType;
  };

  // Get a color for each category
  const getCategoryColor = (category) => {
    const colorMap = {
      'CSV': '#4CAF50',         // Green
      'Python': '#3F51B5',      // Indigo
      'Binary': '#607D8B',      // Blue Grey
      'JSON': '#FF9800',        // Orange
      'JavaScript': '#FFC107',  // Amber
      'Text': '#795548',        // Brown
      'HTML': '#FF5722',        // Deep Orange
      'PDF': '#F44336',         // Red
      'PNG': '#2196F3',         // Blue
      'JPEG': '#03A9F4',        // Light Blue
      'GIF': '#00BCD4',         // Cyan
      'SVG': '#009688',         // Teal
      'MP4': '#E91E63',         // Pink
      'QuickTime': '#9C27B0',   // Purple
      'MP3': '#673AB7',         // Deep Purple
      'WAV': '#3F51B5',         // Indigo
      'Unknown': '#757575'      // Grey
    };
    
    return colorMap[category] || '#757575';
  };

  // Memoize the detection function to avoid recreating it on every render
  const detectViaImageLoading = useCallback((item) => {
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
  }, []);

  // Group items by their specific file type
  useEffect(() => {
    const groups = {};
    
    sortedItems.forEach(item => {
      // Use verified content type if available
      const verifiedItem = verifiedItems[item.id];
      const displayItem = verifiedItem && verifiedItem.isVerified
        ? { ...item, contentType: verifiedItem.contentType }
        : item;
      
      const fileType = getFileType(displayItem);
      
      if (!groups[fileType]) {
        groups[fileType] = [];
      }
      
      groups[fileType].push(displayItem);
    });
    
    setGroupedItems(groups);
  }, [sortedItems, verifiedItems]);

  // Detect actual content types by fetching and examining item data
  useEffect(() => {
    if (!sortedItems || sortedItems.length === 0) return;
    
    // Create a new map of items to verify
    const itemsToVerify = sortedItems
      .filter(item => !verifiedItems[item.id] && !pendingVerifications[item.id])
      .slice(0, 5);
    
    if (itemsToVerify.length === 0) return;
    
    // Create a copy of the pending verifications
    const newPendingVerifications = { ...pendingVerifications };
    
    // Add each item to the pending list
    itemsToVerify.forEach(item => {
      newPendingVerifications[item.id] = true;
    });
    
    // Update the pending verifications state once
    setPendingVerifications(newPendingVerifications);
    
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
  }, [sortedItems, verifiedItems, pendingVerifications, detectViaImageLoading]);

  // Render loading state
  if (loading || (isSearchMode && searchLoading)) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading items...</p>
      </div>
    );
  }

  // Render errors
  if (error || (isSearchMode && searchError)) {
    return (
      <div className="error-container">
        <p className="error-message">
          {isSearchMode ? searchError || 'Error searching items' : error || 'Error loading items'}
        </p>
      </div>
    );
  }

  // Render empty state
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

  // Get an array of type categories
  const typeCategories = Object.keys(groupedItems).sort();

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Main scrollable container */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: '50px', /* Space for pagination */
        overflowY: 'scroll',
        overflowX: 'hidden',
        padding: '16px'
      }}>
        {/* Main grid for category cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px',
          width: '100%',
          padding: '16px 0'
        }}>
          {/* Render a main card for each category */}
          {typeCategories.map(category => (
            <div 
              key={category} 
              className="category-card" 
              style={{
                backgroundColor: 'var(--panel-bg, #1e1e1e)',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
                border: '1px solid var(--border-color, #3e3e3e)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: '350px'
              }}
            >
              {/* Category header */}
              <div style={{
                backgroundColor: getCategoryColor(category),
                color: 'white',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color, #3e3e3e)'
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}>
                  {category} Files
                </h2>
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {groupedItems[category].length}
                </div>
              </div>
              
              {/* Item grid within category */}
              <div style={{
                padding: '16px',
                overflowY: 'auto',
                flex: 1
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '16px'
                }}>
                  {groupedItems[category].map(item => {
                    // Use verified content type if available
                    const verifiedItem = verifiedItems[item.id];
                    const displayItem = verifiedItem && verifiedItem.isVerified
                      ? { ...item, contentType: verifiedItem.contentType }
                      : item;
                    
                    const isImage = isImageItem(displayItem);
                    
                    return (
                      <div 
                        key={item.id} 
                        className="sub-card"
                        style={{
                          backgroundColor: 'var(--item-bg, #262626)',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                          transition: 'all 0.2s ease',
                          transform: hoveredItem === item.id ? 'translateY(-3px)' : 'none',
                          border: '1px solid var(--border-color, #3e3e3e)',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={() => setHoveredItem(item.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                        onClick={() => onSelectItem(item)}
                      >
                        {/* Thumbnail */}
                        <div style={{
                          height: '100px',
                          overflow: 'hidden',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'var(--thumbnail-bg, #1a1a1a)'
                        }}>
                          <GridItemPreview item={displayItem} />
                          
                          {/* Delete button overlay */}
                          {hoveredItem === item.id && (
                            <div 
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                zIndex: 10
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteItem(item.id);
                              }}
                            >
                              <button 
                                className="btn btn-small btn-danger"
                                style={{
                                  minWidth: 'auto',
                                  padding: '3px 6px',
                                  fontSize: '10px'
                                }}
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Item info */}
                        <div style={{
                          padding: '8px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: 'var(--text-color, #e0e0e0)',
                            marginBottom: '4px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.id.substring(0, 8)}
                          </div>
                          <div style={{
                            fontSize: '10px',
                            color: 'var(--text-muted, #a0a0a0)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {getFormattedContentType(displayItem)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Fixed pagination at bottom */}
      <div style={{ 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        height: '50px',
        borderTop: '1px solid var(--border-color, #3e3e3e)',
        backgroundColor: 'var(--panel-subheader-bg, #262626)',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5
      }}>
        <PaginationControls 
          paginationInfo={paginationInfo} 
          onPageChange={onPageChange} 
        />
      </div>
    </div>
  );
};

export default TypeGridView;
