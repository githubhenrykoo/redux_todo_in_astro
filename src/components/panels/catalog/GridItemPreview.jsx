import React, { useState, useEffect } from 'react';
import { getSimpleContentType, getContentTypeDisplay } from './utils';

/**
 * Enhanced preview component for grid items
 * Shows actual content previews in the grid view instead of just icons
 */
const GridItemPreview = ({ item }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const contentType = item.contentType?.mimeType || 'unknown';
  
  // Preload image for image content types
  useEffect(() => {
    if (contentType.startsWith('image/')) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageError(true);
      img.src = `/api/card-collection?action=get&hash=${item.id}`;
    }
  }, [contentType, item.id]);
  
  // Image previews
  if (contentType.startsWith('image/')) {
    if (imageError) {
      return (
        <div className="grid-item-preview default-preview">
          <div className="preview-icon">No Preview</div>
        </div>
      );
    }
    
    return (
      <div className="grid-item-preview image-preview">
        {imageLoaded ? (
          <img 
            src={`/api/card-collection?action=get&hash=${item.id}`} 
            alt={item.name}
            className="preview-image" 
            loading="lazy"
          />
        ) : (
          <div className="preview-loading">Loading...</div>
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
