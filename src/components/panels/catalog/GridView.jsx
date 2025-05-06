import React, { useEffect, useState, useCallback } from 'react';
import GridItemPreview from './GridItemPreview';
import PaginationControls from './PaginationControls';
import { getSimpleContentType, getContentTypeDisplay, detectCLMContent } from './utils';
import './grid-item-preview.css';

// Import React Icons
import { FaFilePdf, FaImage, FaVideo, FaVolumeUp, FaPython, FaTable, 
         FaCode, FaGlobe, FaFileAlt, FaFile, FaCube } from 'react-icons/fa';

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
  const [hoveredItem, setHoveredItem] = useState(null);
  
  // Get content type display mapping
  const contentTypeMap = getContentTypeDisplay();

  // Memoize the detectViaImageLoading function to avoid recreating it on every render
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
  }, [sortedItems, detectViaImageLoading]);

  // Helper to check if an item is a CLM
  const isCLMItem = (item) => {
    const verifiedItem = verifiedItems[item.id];
    if (verifiedItem && verifiedItem.isVerified && verifiedItem.isCLM) {
      return { isClm: true, type: verifiedItem.clmType || 'dimension' };
    }
    return verifiedItem?.contentType?.mimeType === 'text/clm' 
      ? { isClm: true, type: 'dimension' } 
      : { isClm: false, type: null };
  };

  // Helper to check if an item is a main CLM
  const isMainCLM = (item) => {
    const clmInfo = isCLMItem(item);
    return clmInfo.isClm && clmInfo.type === 'main';
  };

  // Helper to check if an item is a dimension CLM
  const isDimensionCLM = (item) => {
    const clmInfo = isCLMItem(item);
    return clmInfo.isClm && clmInfo.type === 'dimension';
  };
  
  // Helper to get content type icon using React Icons
  const getContentTypeIcon = (item) => {
    // Check if it's a CLM first
    const clmInfo = isCLMItem(item);
    if (clmInfo.isClm) {
      if (clmInfo.type === 'main') {
        return <FaCube className="react-icon clm-icon" style={{ color: '#FFC107' }} />;
      } else {
        return <FaCube className="react-icon clm-icon" style={{ color: '#8E44AD' }} />;
      }
    }
    
    const verifiedItem = verifiedItems[item.id];
    const contentType = verifiedItem && verifiedItem.isVerified 
      ? verifiedItem.contentType 
      : item.contentType;
    
    if (!contentType || !contentType.mimeType) {
      return <FaFileAlt className="react-icon" />;
    }
    
    const mimeType = contentType.mimeType.toLowerCase();
    
    if (mimeType === 'text/clm') {
      return <FaCube className="react-icon clm-icon" style={{ color: '#8E44AD' }} />;
    } else if (mimeType === 'text/csv' && isMainCLM(item)) {
      return <FaCube className="react-icon clm-icon" style={{ color: '#FFC107' }} />;
    } else if (mimeType.startsWith('image/')) {
      return <FaImage className="react-icon image-icon" style={{ color: '#2196F3' }} />;
    } else if (mimeType.startsWith('video/')) {
      return <FaVideo className="react-icon video-icon" style={{ color: '#E91E63' }} />;
    } else if (mimeType.startsWith('audio/')) {
      return <FaVolumeUp className="react-icon audio-icon" style={{ color: '#673AB7' }} />;
    } else if (mimeType === 'application/pdf') {
      return <FaFilePdf className="react-icon pdf-icon" style={{ color: '#F44336' }} />;
    } else if (mimeType === 'text/x-python-script' || mimeType === 'text/x-python' || contentType.extension === 'py') {
      return <FaPython className="react-icon python-icon" style={{ color: '#3F51B5' }} />;
    } else if (mimeType === 'text/csv' || contentType.extension === 'csv') {
      return <FaTable className="react-icon table-icon" style={{ color: '#4CAF50' }} />;
    } else if (mimeType === 'application/json') {
      return <FaCode className="react-icon json-icon" style={{ color: '#FF9800' }} />;
    } else if (mimeType === 'text/html') {
      return <FaGlobe className="react-icon html-icon" style={{ color: '#FF5722' }} />;
    } else if (mimeType.includes('text/')) {
      return <FaFileAlt className="react-icon text-icon" style={{ color: '#795548' }} />;
    }
    
    return <FaFile className="react-icon" style={{ color: '#757575' }} />;
  };

  // Helper function to get proper content type display
  const getFormattedContentType = (item) => {
    // Special case for CLM
    const clmInfo = isCLMItem(item);
    if (clmInfo.isClm) {
      return `CLM (${clmInfo.type === 'main' ? 'Main' : 'Dimension'})`;
    }
    
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

  // Helper function to determine if an item is an image
  const isImageItem = (item) => {
    const verifiedItem = verifiedItems[item.id];
    if (verifiedItem && verifiedItem.isVerified) {
      return verifiedItem.contentType.mimeType?.startsWith('image/');
    }
    return item.contentType?.mimeType?.startsWith('image/');
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
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Main scrollable grid container */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: '50px', /* Space for pagination */
        overflowY: 'scroll',
        overflowX: 'hidden',
        padding: '16px 16px 0 16px'
      }}>
        {/* Grid layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '20px',
          width: '100%',
          paddingTop: '16px', /* Add padding to fix first row cards being cut off */
          paddingBottom: '70px'
        }}>
          {sortedItems.map(item => {
            // Use verified content type if available
            const verifiedItem = verifiedItems[item.id];
            const displayItem = verifiedItem && verifiedItem.isVerified
              ? { ...item, contentType: verifiedItem.contentType }
              : item;
            
            const isImage = isImageItem(displayItem);
            
            return (
              <div 
                key={item.id} 
                className={`grid-item ${isImage ? 'grid-item-image' : 'grid-item-other'}`}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div 
                  className={`grid-item-card ${hoveredItem === item.id ? 'hovered' : ''}`}
                  onClick={() => onSelectItem(item)}
                >
                  <div className={`grid-item-thumbnail ${isImage ? 'image-thumbnail' : ''}`}>
                    <GridItemPreview item={displayItem} />
                  </div>
                  <div className="grid-item-info">
                    <h3 className="grid-item-title" style={{ color: '#000000', fontWeight: 'bold' }}>
                      {item.id.substring(0, 8)}
                    </h3>
                    <div className="grid-item-meta">
                      <span className="grid-item-type" style={{ 
                        color: '#000000', 
                        fontWeight: 'bold',
                        backgroundColor: '#ffffff',
                        border: '1px solid #000000',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        <span style={{ fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                          {getContentTypeIcon(item)}
                        </span>
                        {getFormattedContentType(item)}
                      </span>
                      <span className="grid-item-date" style={{ color: '#000000', fontWeight: 'bold' }}>
                        {item.timestamp || 'No timestamp'}
                      </span>
                    </div>
                  </div>
                  <div className={`grid-item-actions ${hoveredItem === item.id ? 'visible' : ''}`}>
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

export default GridView;
