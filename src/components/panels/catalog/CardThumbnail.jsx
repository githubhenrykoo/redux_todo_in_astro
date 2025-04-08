import React from 'react';
import { getSimpleContentType, getContentTypeDisplay } from './utils';

/**
 * Renders a thumbnail for a card based on its content type
 */
const CardThumbnail = ({ item }) => {
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
  const contentTypeDisplay = getContentTypeDisplay();
  
  // Use the simple type for display if available
  const displayType = simpleType && contentTypeDisplay[simpleType] 
    ? contentTypeDisplay[simpleType]
    : contentType || 'Unknown';
  
  return (
    <div className="image-placeholder">
      {displayType}
    </div>
  );
};

export default CardThumbnail;
