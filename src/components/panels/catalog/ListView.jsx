import React, { useState, useEffect, useCallback } from 'react';
import PaginationControls from './PaginationControls';
import { getSimpleContentType, getContentTypeDisplay, determineCorrectContentType, detectCLMContent } from './utils';
import './list-view.css';

// Import React Icons
import { FaFilePdf, FaImage, FaVideo, FaVolumeUp, FaPython, FaTable, 
         FaCode, FaGlobe, FaFileAlt, FaFile, FaCube, FaChevronRight, FaChevronDown } from 'react-icons/fa';

/**
 * List view component for catalog items
 * Features a collapsible file-system-like view organized by content type
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
  const [verifiedItems, setVerifiedItems] = useState({});
  const [pendingVerifications, setPendingVerifications] = useState({});
  const [groupedItems, setGroupedItems] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  
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
        [item.hash || item.id]: {
          contentType: { mimeType: imgType },
          isVerified: true
        }
      }));
    };
    
    img.onerror = () => {
      // If it fails to load as an image, keep original content type
      setVerifiedItems(prev => ({
        ...prev,
        [item.hash || item.id]: {
          contentType: item.contentType,
          isVerified: true
        }
      }));
    };
    
    // Try to load the item as an image
    img.src = `/api/card-collection?action=get&hash=${item.hash || item.id}`;
  }, []);

  // Detect actual content types by fetching and examining item data
  useEffect(() => {
    if (!sortedItems || sortedItems.length === 0) return;
    
    // Create a new map of items to verify
    const itemsToVerify = sortedItems
      .filter(item => !verifiedItems[item.hash || item.id] && !pendingVerifications[item.hash || item.id])
      .slice(0, 5);
    
    if (itemsToVerify.length === 0) return;
    
    // Create a copy of the pending verifications
    const newPendingVerifications = { ...pendingVerifications };
    
    // Add each item to the pending list
    itemsToVerify.forEach(item => {
      newPendingVerifications[item.hash || item.id] = true;
    });
    
    // Update the pending verifications state once
    setPendingVerifications(newPendingVerifications);
    
    // Process each item
    itemsToVerify.forEach(item => {
      // Fetch the detailed item info with accurate content type
      fetch(`/api/card-collection?action=get&hash=${item.hash || item.id}`)
        .then(response => response.json())
        .then(data => {
          if (data.success && data.card) {
            // Check if it's a CLM by examining content
            let isCLM = false;
            if (data.card.content) {
              isCLM = detectCLMContent(data.card.content);
            }
            
            // Update with accurate content type from API
            setVerifiedItems(prev => ({
              ...prev,
              [item.hash || item.id]: {
                contentType: isCLM 
                  ? { mimeType: 'text/clm' }  // Use custom CLM MIME type 
                  : data.card.contentType,
                isVerified: true,
                isCLM: isCLM
              }
            }));
          } else {
            // Fallback to type detection via image loading if API doesn't return contentType
            detectViaImageLoading(item);
          }
          
          // Remove from pending status
          setPendingVerifications(prev => {
            const updated = { ...prev };
            delete updated[item.hash || item.id];
            return updated;
          });
        })
        .catch(error => {
          console.error(`Error fetching details for item ${item.hash || item.id}:`, error);
          // Fallback to type detection via image loading if API fails
          detectViaImageLoading(item);
          
          // Remove from pending status
          setPendingVerifications(prev => {
            const updated = { ...prev };
            delete updated[item.hash || item.id];
            return updated;
          });
        });
    });
  }, [sortedItems, verifiedItems, pendingVerifications, detectViaImageLoading]);

  // Group items by their file type
  useEffect(() => {
    const groups = {};
    
    sortedItems.forEach(item => {
      // Use verified content type if available
      const itemId = item.hash || item.id;
      const verifiedItem = verifiedItems[itemId];
      const displayItem = verifiedItem && verifiedItem.isVerified
        ? { ...item, contentType: verifiedItem.contentType }
        : item;
      
      let fileType = 'Unknown';
      
      // Check if it's a CLM first
      if (isCLMItem(item)) {
        fileType = 'CLM';
      } else if (displayItem.contentType && displayItem.contentType.mimeType) {
        const mimeType = displayItem.contentType.mimeType;
        
        if (mimeType.startsWith('image/')) {
          fileType = 'Images';
        } else if (mimeType.startsWith('video/')) {
          fileType = 'Videos';
        } else if (mimeType.startsWith('audio/')) {
          fileType = 'Audio';
        } else if (mimeType === 'application/pdf') {
          fileType = 'PDF';
        } else if (mimeType === 'text/x-python' || mimeType === 'text/x-python-script') {
          fileType = 'Python';
        } else if (mimeType === 'text/csv') {
          fileType = 'CSV';
        } else if (mimeType === 'application/json') {
          fileType = 'JSON';
        } else if (mimeType === 'text/html') {
          fileType = 'HTML';
        } else if (mimeType.includes('text/')) {
          fileType = 'Text';
        } else {
          fileType = 'Other';
        }
      }
      
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
      
      // Initialize expanded state for new groups
      if (expandedGroups[type] === undefined) {
        setExpandedGroups(prev => ({ ...prev, [type]: true }));
      }
    });
    
    setGroupedItems(orderedGroups);
  }, [sortedItems, verifiedItems, expandedGroups]);

  // Helper function to get proper content type display
  const getFormattedContentType = (mimeType) => {
    if (!mimeType) return 'Unknown';
    
    // Special case for CLM
    if (mimeType === 'text/clm') {
      return 'CLM';
    }
    
    const simpleType = getSimpleContentType(mimeType);
    if (!simpleType) return mimeType;
    
    return contentTypeMap[simpleType] || simpleType.toUpperCase();
  };
  
  // Helper to check if an item is a CLM
  const isCLMItem = (item) => {
    const verifiedItem = verifiedItems[item.hash || item.id];
    if (verifiedItem && verifiedItem.isVerified && verifiedItem.isCLM) {
      return true;
    }
    return verifiedItem?.contentType?.mimeType === 'text/clm';
  };
  
  // Get a color for each category
  const getCategoryColor = (category) => {
    const colorMap = {
      'CLM': '#8E44AD',         // Purple for CLM
      'CSV': '#4CAF50',         // Green
      'Python': '#3F51B5',      // Indigo
      'Images': '#2196F3',      // Blue
      'Videos': '#E91E63',      // Pink
      'Audio': '#673AB7',       // Deep Purple
      'Text': '#795548',        // Brown
      'HTML': '#FF5722',        // Deep Orange
      'PDF': '#F44336',         // Red
      'JSON': '#FF9800',        // Orange
      'Other': '#757575',       // Grey
      'Unknown': '#607D8B'      // Blue Grey
    };
    
    return colorMap[category] || '#757575';
  };
  
  // Get folder icon for a category
  const getCategoryIcon = (category) => {
    const iconMap = {
      'CLM': <FaCube style={{ color: '#8E44AD', fontSize: '18px' }} />,
      'Images': <FaImage style={{ color: '#2196F3', fontSize: '18px' }} />,
      'Videos': <FaVideo style={{ color: '#E91E63', fontSize: '18px' }} />,
      'Audio': <FaVolumeUp style={{ color: '#673AB7', fontSize: '18px' }} />,
      'PDF': <FaFilePdf style={{ color: '#F44336', fontSize: '18px' }} />,
      'Python': <FaPython style={{ color: '#3F51B5', fontSize: '18px' }} />,
      'CSV': <FaTable style={{ color: '#4CAF50', fontSize: '18px' }} />,
      'JSON': <FaCode style={{ color: '#FF9800', fontSize: '18px' }} />,
      'HTML': <FaGlobe style={{ color: '#FF5722', fontSize: '18px' }} />,
      'Text': <FaFileAlt style={{ color: '#795548', fontSize: '18px' }} />
    };
    
    return iconMap[category] || <FaFile style={{ color: '#757575', fontSize: '18px' }} />;
  };
  
  // Helper to get content type icon using React Icons
  const getContentTypeIcon = (contentType, item) => {
    // Check if it's a CLM first
    if (item && isCLMItem(item)) {
      return <FaCube className="react-icon clm-icon" style={{ color: '#8E44AD', fontSize: '16px' }} />;
    }
    
    if (!contentType || !contentType.mimeType) {
      return <FaFileAlt className="react-icon" style={{ fontSize: '16px' }} />;
    }
    
    const mimeType = contentType.mimeType.toLowerCase();
    
    // Check for CLM MIME type
    if (mimeType === 'text/clm') {
      return <FaCube className="react-icon clm-icon" style={{ color: '#8E44AD', fontSize: '16px' }} />;
    }
    
    if (mimeType.startsWith('image/')) {
      return <FaImage className="react-icon image-icon" style={{ color: '#2196F3', fontSize: '16px' }} />;
    } else if (mimeType.startsWith('video/')) {
      return <FaVideo className="react-icon video-icon" style={{ color: '#E91E63', fontSize: '16px' }} />;
    } else if (mimeType.startsWith('audio/')) {
      return <FaVolumeUp className="react-icon audio-icon" style={{ color: '#673AB7', fontSize: '16px' }} />;
    } else if (mimeType === 'application/pdf') {
      return <FaFilePdf className="react-icon pdf-icon" style={{ color: '#F44336', fontSize: '16px' }} />;
    } else if (mimeType === 'text/x-python-script' || mimeType === 'text/x-python' || contentType.extension === 'py') {
      return <FaPython className="react-icon python-icon" style={{ color: '#3F51B5', fontSize: '16px' }} />;
    } else if (mimeType === 'text/csv' || contentType.extension === 'csv') {
      return <FaTable className="react-icon table-icon" style={{ color: '#4CAF50', fontSize: '16px' }} />;
    } else if (mimeType === 'application/json') {
      return <FaCode className="react-icon json-icon" style={{ color: '#FF9800', fontSize: '16px' }} />;
    } else if (mimeType === 'text/html') {
      return <FaGlobe className="react-icon html-icon" style={{ color: '#FF5722', fontSize: '16px' }} />;
    } else if (mimeType.includes('text/')) {
      return <FaFileAlt className="react-icon text-icon" style={{ color: '#795548', fontSize: '16px' }} />;
    }
    
    return <FaFile className="react-icon" style={{ color: '#757575', fontSize: '16px' }} />;
  };
  
  // Toggle expanded state of a category
  const toggleCategoryExpanded = (category) => {
    setExpandedGroups(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  // Format hash for display
  const formatHash = (hash) => {
    return hash ? hash.substring(0, 8) : 'No hash';
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
    <div className="list-view-container" style={{
      width: '100%', 
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Main content area */}
      <div className="catalog-list-tree" style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        <div className="list-tree-content">
          {Object.keys(groupedItems).map(category => (
            <div key={category} className="category-section">
              {/* Category header */}
              <div 
                className="category-header" 
                onClick={() => toggleCategoryExpanded(category)}
                style={{
                  backgroundColor: 'var(--item-bg, #262626)',
                  color: 'var(--text-color, #e0e0e0)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-color, #3e3e3e)',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}
              >
                <span className="expand-icon" style={{ marginRight: '8px', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {expandedGroups[category] ? <FaChevronDown /> : <FaChevronRight />}
                </span>
                <span className="category-icon" style={{ marginRight: '8px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getCategoryIcon(category)}
                </span>
                <span className="category-name" style={{ 
                  fontWeight: 'bold',
                  color: getCategoryColor(category)
                }}>
                  {category}
                </span>
                <span className="category-count" style={{ 
                  marginLeft: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '12px'
                }}>
                  {groupedItems[category].length}
                </span>
              </div>
              
              {/* Category items */}
              {expandedGroups[category] && (
                <table className="list-table" style={{ width: '100%' }}>
                  <tbody>
                    {groupedItems[category].map(item => {
                      const itemId = item.hash || item.id;
                      
                      return (
                        <tr 
                          key={itemId} 
                          className="list-row" 
                          onClick={() => onSelectItem(item)}
                          style={{
                            borderBottom: '1px solid var(--border-color, #3e3e3e)',
                            backgroundColor: 'var(--panel-bg, #1e1e1e)',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                            width: '100%'
                          }}
                        >
                          <td className="col-icon" style={{ 
                            padding: '8px 12px',
                            width: '40px'
                          }}>
                            <div className="icon-container" style={{ 
                              marginLeft: '28px', 
                              width: '16px', 
                              height: '16px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center' 
                            }}>
                              {getContentTypeIcon(item.contentType, item)}
                            </div>
                          </td>
                          <td className="col-hash" style={{ 
                            padding: '8px 0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            <span className="item-hash">{formatHash(item.hash || item.id)}</span>
                          </td>
                          <td className="col-timestamp" style={{ 
                            padding: '8px 12px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textAlign: 'right',
                            width: '150px'
                          }}>
                            <span className="item-timestamp">
                              {item.timestamp || 'No timestamp'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Pagination controls */}
      <div className="list-pagination" style={{ 
        borderTop: '1px solid var(--border-color, #3e3e3e)',
        backgroundColor: 'var(--panel-subheader-bg, #262626)',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <PaginationControls 
          paginationInfo={paginationInfo} 
          onPageChange={onPageChange} 
        />
      </div>
    </div>
  );
};

export default ListView;
