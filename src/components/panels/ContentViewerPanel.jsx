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
  
  // Always show the initial state details
  return (
    <div className="h-full flex flex-col">
      {/* Metadata Display Section */}
      <div className="p-2 border-b bg-gray-100">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-semibold">Hash:</span> 
            <span className="ml-2 truncate text-gray-500">
              {selectedItem.metadata.hash}
            </span>
          </div>
          <div>
            <span className="font-semibold">Content Type:</span> 
            <span className="ml-2 text-gray-500">
              {selectedItem.metadata.contentType}
            </span>
          </div>
          <div>
            <span className="font-semibold">Timestamp:</span> 
            <span className="ml-2 text-gray-500">
              {selectedItem.metadata.gtime}
            </span>
          </div>
        </div>
      </div>
      
      {/* Content Viewer Section */}
      <div className="flex-1 overflow-hidden flex items-center justify-center text-gray-500">
        {selectedItem.selectedItem === null ? (
          <div className="text-center">
            <p className="text-lg mb-2">No Content Selected</p>
            <p className="text-sm">Choose an item to view its details</p>
          </div>
        ) : (
          <ContentViewer 
            content={selectedItem.content}
            contentType={{
              mimeType: selectedItem.metadata?.contentType || 'application/octet-stream',
              extension: selectedItem.metadata?.contentType 
                ? selectedItem.metadata.contentType.split('/').pop() 
                : 'bin'
            }}
          />
        )}
      </div>
    </div>
  );
}
