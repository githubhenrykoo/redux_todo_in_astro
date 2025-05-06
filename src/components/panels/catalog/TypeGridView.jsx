import React, { useEffect, useState, useCallback } from 'react';
import GridItemPreview from './GridItemPreview';
import PaginationControls from './PaginationControls';
import { getSimpleContentType, getContentTypeDisplay, detectCLMContent } from './utils';
import './grid-item-preview.css';

// Import React Icons
import { FaFilePdf, FaImage, FaVideo, FaVolumeUp, FaPython, FaTable, 
         FaCode, FaGlobe, FaFileAlt, FaFile, FaCube } from 'react-icons/fa';

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
    
    // Check if it's a CLM document by examining content
    if (item.content) {
      const clmDetection = detectCLMContent(item.content);
      if (clmDetection.isClm) {
        return clmDetection.type === 'main' ? 'CLM' : 'CLM Dimension';
      }
    }
    
    // Check for verified CLM
    const verifiedItem = verifiedItems[item.id];
    if (verifiedItem && verifiedItem.isVerified && verifiedItem.isCLM) {
      return verifiedItem.clmType === 'main' ? 'CLM' : 'CLM Dimension';
    }
    
    const contentType = typeof item.contentType === 'string'
      ? item.contentType
      : item.contentType.mimeType || '';
    
    // Special check for CLM files stored as CSV
    if (contentType === 'text/csv' || getSimpleContentType(contentType) === 'csv') {
      // CSV files that contain CLM data should be categorized as CLM
      const content = item.content || '';
      if (content) {
        const clmDetection = detectCLMContent(content);
        if (clmDetection.isClm) {
          return clmDetection.type === 'main' ? 'CLM' : 'CLM Dimension';
        }
      }
    }
    
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
      'application/pdf': 'PDF',
      'text/clm': 'CLM Dimension',
      'clm': 'CLM'
    };
    
    return typeMap[simpleType] || simpleType;
  };

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
          if (data.success && data.card) {
            // Check if it's a CLM by examining content
            let isCLM = false;
            let clmType = null;
            if (data.card.content) {
              const clmDetection = detectCLMContent(data.card.content);
              isCLM = clmDetection.isClm;
              clmType = clmDetection.type;
            }
            
            // Update with accurate content type from API
            setVerifiedItems(prev => ({
              ...prev,
              [item.id]: {
                contentType: isCLM 
                  ? { mimeType: clmType === 'main' ? 'text/csv' : 'text/clm' }
                  : data.card.contentType,
                isVerified: true,
                isCLM: isCLM,
                clmType: clmType
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
    
    // Ensure CLM category is first if it exists
    const typeOrder = Object.keys(groups).sort((a, b) => {
      if (a === 'CLM') return -1;  // CLM comes first
      if (b === 'CLM') return 1;   // CLM comes first
      return a.localeCompare(b);   // Alphabetical for the rest
    });
    
    const orderedGroups = {};
    typeOrder.forEach(type => {
      orderedGroups[type] = groups[type];
    });
    
    setGroupedItems(orderedGroups);
  }, [sortedItems, verifiedItems]);

  // Get a color for each category
  const getCategoryColor = (category) => {
    const colorMap = {
      'CLM': '#FFC107',              // Yellow for main CLM
      'CLM Dimension': '#8E44AD',    // Purple for CLM dimensions
      'CSV': '#4CAF50',              // Green
      'Python': '#3F51B5',           // Indigo
      'Binary': '#607D8B',           // Blue Grey
      'JSON': '#FF9800',             // Orange
      'JavaScript': '#FFC107',       // Amber
      'Text': '#795548',             // Brown
      'HTML': '#FF5722',             // Deep Orange
      'PDF': '#F44336',              // Red
      'PNG': '#2196F3',              // Blue
      'JPEG': '#03A9F4',             // Light Blue
      'GIF': '#00BCD4',              // Cyan
      'SVG': '#009688',              // Teal
      'MP4': '#E91E63',              // Pink
      'QuickTime': '#9C27B0',        // Purple
      'MP3': '#673AB7',              // Deep Purple
      'WAV': '#3F51B5',              // Indigo
      'Unknown': '#757575'           // Grey
    };
    
    return colorMap[category] || '#757575';
  };

  // Helper to get content type icon using React Icons
  const getContentTypeIcon = (category) => {
    switch(category) {
      case 'CLM':
        return <FaCube className="react-icon clm-icon" style={{ color: '#FFC107' }} />;
      case 'CLM Dimension':
        return <FaCube className="react-icon clm-icon" style={{ color: '#8E44AD' }} />;
      case 'CSV':
        return <FaTable className="react-icon table-icon" style={{ color: '#4CAF50' }} />;
      case 'Python':
        return <FaPython className="react-icon python-icon" style={{ color: '#3F51B5' }} />;
      case 'Binary':
        return <FaFile className="react-icon" style={{ color: '#607D8B' }} />;
      case 'JSON':
        return <FaCode className="react-icon json-icon" style={{ color: '#FF9800' }} />;
      case 'JavaScript':
        return <FaCode className="react-icon js-icon" style={{ color: '#FFC107' }} />;
      case 'Text':
        return <FaFileAlt className="react-icon text-icon" style={{ color: '#795548' }} />;
      case 'HTML':
        return <FaGlobe className="react-icon html-icon" style={{ color: '#FF5722' }} />;
      case 'PDF':
        return <FaFilePdf className="react-icon pdf-icon" style={{ color: '#F44336' }} />;
      case 'PNG':
      case 'JPEG':
      case 'GIF':
      case 'SVG':
        return <FaImage className="react-icon image-icon" style={{ color: '#2196F3' }} />;
      case 'MP4':
      case 'QuickTime':
      case 'WebM':
        return <FaVideo className="react-icon video-icon" style={{ color: '#E91E63' }} />;
      case 'MP3':
      case 'WAV':
      case 'OGG':
        return <FaVolumeUp className="react-icon audio-icon" style={{ color: '#673AB7' }} />;
      default:
        return <FaFile className="react-icon" style={{ color: '#757575' }} />;
    }
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
  const typeCategories = Object.keys(groupedItems);

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
        {/* Main column for category cards */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
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
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '22px', display: 'flex', alignItems: 'center' }}>
                    {getContentTypeIcon(category)}
                  </span>
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
                            textOverflow: 'ellipsis',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span style={{ fontSize: '10px', display: 'flex', alignItems: 'center' }}>
                              {category === 'CLM' && <FaCube style={{ marginRight: '2px' }} />}
                            </span>
                            {category === 'CLM' 
                              ? '📊 CLM Main Document' 
                              : category === 'CLM Dimension'
                                ? '📊 CLM Dimension' 
                                : getFormattedContentType(displayItem)}
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
