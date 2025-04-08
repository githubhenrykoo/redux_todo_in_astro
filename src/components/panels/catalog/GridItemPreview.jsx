import React, { useState, useEffect } from 'react';
import { getSimpleContentType, getContentTypeDisplay } from './utils';
import { ContentService } from '../../../services/content-service';
import { isImageType } from '../../../utils/content-utils';

/**
 * Enhanced preview component for grid items
 * Shows actual content previews in the grid view instead of just icons
 */
const GridItemPreview = ({ item }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [dataUrl, setDataUrl] = useState(null);
  const contentType = item.contentType?.mimeType || 'unknown';
  
  // Preload image for image content types
  useEffect(() => {
    if (isImageType(item.contentType)) {
      setImageLoaded(false);
      setImageError(false);
      
      // Use ContentService to fetch and process content
      ContentService.fetchContent(item.hash, { maxRetries: 1 })
        .then(result => {
          if (result.error) {
            console.error(`Error loading preview for ${item.hash}:`, result.error);
            setImageError(true);
            return;
          }
          
          // Check for processed content (already a data URL)
          if (result.processed && result.processed.type === 'dataUrl') {
            setDataUrl(result.processed.url);
            setImageLoaded(true);
          } else {
            // Get a data URL from raw content
            const url = ContentService.getDataUrl(result.raw);
            if (url) {
              setDataUrl(url);
              setImageLoaded(true);
            } else {
              throw new Error('Unable to create data URL from content');
            }
          }
        })
        .catch(error => {
          console.error("Error loading preview image:", error);
          setImageError(true);
        });
    }
  }, [item.hash, contentType, item.contentType]);
  
  // Image previews
  if (contentType.startsWith('image/')) {
    if (imageError) {
      return (
        <div className="grid-item-preview default-preview">
          <div className="preview-icon">
            <i className="fa fa-image" /> Error
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid-item-preview image-preview">
        {!imageLoaded && (
          <div className="loading-indicator">
            <i className="fa fa-spinner fa-spin" />
          </div>
        )}
        {imageLoaded && dataUrl && (
          <img 
            src={dataUrl} 
            alt={item.name || 'Image preview'} 
            className="preview-image"
            onError={() => setImageError(true)}
          />
        )}
      </div>
    );
  }
  
  // Video previews with thumbnail
  if (contentType.startsWith('video/')) {
    return (
      <div className="grid-item-preview video-preview">
        <div className="video-thumbnail">
          <span className="play-icon">▶</span>
          <img 
            src={`/api/card-collection?action=getThumbnail&hash=${item.id}`} 
            alt={`${item.name} (video)`}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://placehold.co/300x300?text=Video";
            }}
          />
        </div>
      </div>
    );
  }
  
  // Audio previews with waveform visualization or icon
  if (contentType.startsWith('audio/')) {
    return (
      <div className="grid-item-preview audio-preview">
        <div className="audio-icon">
          <span>🎵</span>
          <div className="waveform">
            {Array(8).fill().map((_, i) => (
              <div key={i} className="waveform-bar" style={{ height: `${20 + Math.random() * 60}%` }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // PDF preview with icon and first page if available
  if (contentType === 'application/pdf') {
    return (
      <div className="grid-item-preview pdf-preview">
        <div className="pdf-icon">
          <span>PDF</span>
          <img 
            src={`/api/card-collection?action=getThumbnail&hash=${item.id}`} 
            alt={`${item.name} (PDF)`}
            onError={(e) => {
              e.target.onerror = null;
              e.target.parentNode.className = "pdf-icon-only";
            }}
          />
        </div>
      </div>
    );
  }
  
  // Text content preview
  if (contentType === 'text/plain' || contentType === 'text/html' || contentType === 'application/json') {
    return (
      <div className="grid-item-preview text-preview">
        <div className="text-icon">
          {getContentTypeDisplay()[getSimpleContentType(contentType)] || contentType.split('/')[1].toUpperCase()}
        </div>
        <div className="text-preview-content">
          {/* We would load text preview here if available */}
          <div className="text-lines">
            {Array(4).fill().map((_, i) => (
              <div key={i} className="text-line" style={{ width: `${30 + Math.random() * 70}%` }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Default icon for other types
  const contentTypeDisplay = getContentTypeDisplay();
  const simpleType = getSimpleContentType(contentType);
  const displayType = simpleType && contentTypeDisplay[simpleType] 
    ? contentTypeDisplay[simpleType]
    : contentType || 'Unknown';
  
  return (
    <div className="grid-item-preview default-preview">
      <div className="preview-icon">
        {displayType}
      </div>
    </div>
  );
};

export default GridItemPreview;
