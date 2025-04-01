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
  
  // For debugging
  console.log("ContentViewerPanel - selectedItem state:", selectedItem);
  console.log("ContentViewerPanel - contentType:", selectedItem.metadata.contentType);
  
  // Always show the initial state details
  return (
    <div className="h-full flex flex-col w-full overflow-hidden">
      {/* Metadata Display Section */}
      <div className="p-2 border-b bg-gray-100 shrink-0">
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
      
      {/* Content Viewer Section with stricter overflow constraints */}
      <div className="flex-1 overflow-auto p-4 w-full">
        {selectedItem.selectedItem === null ? (
          <div className="text-center text-gray-500">
            <p className="text-lg mb-2">No Content Selected</p>
            <p className="text-sm">Choose an item to view its details</p>
          </div>
        ) : (
          <div className="break-all whitespace-normal overflow-hidden w-full max-w-full">
            <ContentViewer 
              content={selectedItem.content}
              contentType={{
                mimeType: getFullMimeType(selectedItem.metadata.contentType),
                extension: selectedItem.metadata.contentType
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to convert simplified content type to full MIME type
function getFullMimeType(simpleType) {
  if (!simpleType || simpleType === "null") return 'application/octet-stream';
  
  // Map common extensions to MIME types
  const mimeMap = {
    'json': 'application/json',
    'js': 'application/javascript',
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'svg': 'image/svg+xml',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'pdf': 'application/pdf',
    'csv': 'text/csv',
    'xml': 'application/xml',
    'md': 'text/markdown'
  };
  
  return mimeMap[simpleType] || `application/${simpleType}`;
}
