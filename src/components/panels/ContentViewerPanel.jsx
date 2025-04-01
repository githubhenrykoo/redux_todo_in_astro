'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import ContentViewer from '../viewers/ContentViewer';

/**
 * A panel that displays content using the appropriate viewer based on content type
 */
export default function ContentViewerPanel() {
  // Use specific selectors that only return needed parts of state
  const selectedHash = useSelector(state => state?.content?.selectedHash);
  const cardsMap = useSelector(state => state?.content?.cards || {});
  
  // Get the selected content item
  const selectedContentItem = selectedHash && cardsMap 
    ? Object.values(cardsMap).find(c => c && c.hash === selectedHash) || null
    : null;
  
  if (!selectedContentItem) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Select content to view details
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b flex justify-between items-center">
        <h3 className="text-sm font-semibold truncate">
          {selectedContentItem.title || selectedContentItem.hash}
        </h3>
        <span className="text-xs text-gray-500">
          {selectedContentItem.contentType?.mimeType || 'Unknown type'}
        </span>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ContentViewer 
          content={selectedContentItem.content}
          contentType={selectedContentItem.contentType || {
            mimeType: selectedContentItem.mimeType || 'application/json',
            extension: selectedContentItem.extension
          }}
        />
      </div>
    </div>
  );
}
