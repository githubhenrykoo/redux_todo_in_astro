import React, { useState, useEffect, useCallback } from 'react';
import PaginationControls from './PaginationControls';
import { getSimpleContentType, getContentTypeDisplay, determineCorrectContentType } from './utils';
import './list-view.css';

// Import React Icons
import { FaFilePdf, FaImage, FaVideo, FaVolumeUp, FaPython, FaTable, 
         FaCode, FaGlobe, FaFileAlt, FaFile } from 'react-icons/fa';

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
  const [verifiedItems, setVerifiedItems] = useState({});
  const [pendingVerifications, setPendingVerifications] = useState({});
  
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
          if (data.success && data.card && data.card.contentType) {
            // Update with accurate content type from API
            setVerifiedItems(prev => ({
              ...prev,
              [item.hash || item.id]: {
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

  // Helper function to get proper content type display
  const getFormattedContentType = (mimeType) => {
    if (!mimeType) return 'Unknown';
    
    const simpleType = getSimpleContentType(mimeType);
    if (!simpleType) return mimeType;
    
    return contentTypeMap[simpleType] || simpleType.toUpperCase();
  };
  
  // Helper to get content type icon using React Icons
  const getContentTypeIcon = (contentType) => {
    if (!contentType || !contentType.mimeType) {
      return <FaFileAlt className="react-icon" />;
    }
    
    const mimeType = contentType.mimeType.toLowerCase();
    
    if (mimeType.startsWith('image/')) {
      return <FaImage className="react-icon image-icon" />;
    } else if (mimeType.startsWith('video/')) {
      return <FaVideo className="react-icon video-icon" />;
    } else if (mimeType.startsWith('audio/')) {
      return <FaVolumeUp className="react-icon audio-icon" />;
    } else if (mimeType === 'application/pdf') {
      return <FaFilePdf className="react-icon pdf-icon" />;
    } else if (mimeType === 'text/x-python-script' || mimeType === 'text/x-python' || contentType.extension === 'py') {
      return <FaPython className="react-icon python-icon" />;
    } else if (mimeType === 'text/csv' || contentType.extension === 'csv') {
      return <FaTable className="react-icon table-icon" />;
    } else if (mimeType === 'application/json') {
      return <FaCode className="react-icon json-icon" />;
    } else if (mimeType === 'text/html') {
      return <FaGlobe className="react-icon html-icon" />;
    } else if (mimeType.includes('text/')) {
      return <FaFileAlt className="react-icon text-icon" />;
    }
    
    return <FaFile className="react-icon" />;
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
    <div className="list-view-container">
      <div className="catalog-list-table">
        <table className="list-table">
          <thead>
            <tr>
              <th className="col-icon"></th>
              <th className="col-hash">Hash</th>
              <th className="col-type">Type</th>
              <th className="col-timestamp">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map(item => {
              // Use verified content type if available
              const itemId = item.hash || item.id;
              const verifiedItem = verifiedItems[itemId];
              const displayItem = verifiedItem && verifiedItem.isVerified
                ? { ...item, contentType: verifiedItem.contentType }
                : item;
              
              return (
                <tr key={itemId} className="list-row" onClick={() => onSelectItem(item)}>
                  <td className="col-icon">
                    <div className="icon-container">
                      {getContentTypeIcon(displayItem.contentType)}
                    </div>
                  </td>
                  <td className="col-hash">
                    <span className="item-hash">{formatHash(item.hash)}</span>
                  </td>
                  <td className="col-type">
                    <span className="item-type-badge">
                      {displayItem.contentType?.mimeType 
                        ? getFormattedContentType(displayItem.contentType.mimeType).split(' ')[0]
                        : 'Unknown'}
                    </span>
                  </td>
                  <td className="col-timestamp">
                    <span className="item-timestamp">
                      {item.timestamp || 'No timestamp'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <PaginationControls 
        paginationInfo={paginationInfo} 
        onPageChange={onPageChange} 
      />
    </div>
  );
};

export default ListView;
