'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import ContentViewer from '../viewers/ContentViewer';

/**
 * A panel that displays content using the appropriate viewer based on content type
 */
export default function ContentViewerPanel() {
  // Use the new selectedItem state
  const selectedItem = useSelector(state => state.selectedItem);
  
  if (!selectedItem || !selectedItem.selectedItem) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Select content to view details
      </div>
    );
  }
  
  // Format timestamp for better readability
  const formatTimestamp = (timestamp) => {
    return timestamp 
      ? new Date(timestamp).toLocaleString() 
      : 'Unknown time';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Metadata Display Section */}
      <div className="p-2 border-b bg-gray-100">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-semibold">Hash:</span> 
            <span className="ml-2 truncate">
              {selectedItem.metadata.hash || 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-semibold">Content Type:</span> 
            <span className="ml-2">
              {selectedItem.metadata.contentType || 'Unknown'}
            </span>
          </div>
          <div>
            <span className="font-semibold">Timestamp:</span> 
            <span className="ml-2">
              {formatTimestamp(selectedItem.metadata.gtime)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Content Viewer Section */}
      <div className="flex-1 overflow-hidden">
        <ContentViewer 
          content={selectedItem.content}
          contentType={{
            mimeType: selectedItem.metadata.contentType || 'application/octet-stream',
            extension: selectedItem.metadata.contentType 
              ? selectedItem.metadata.contentType.split('/').pop() 
              : 'bin'
          }}
        />
      </div>
    </div>
  );
}
