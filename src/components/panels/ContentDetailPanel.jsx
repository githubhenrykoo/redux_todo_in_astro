'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  addContent, 
  deleteContent 
} from '../../features/contentSlice.js';
import ContentEditor from '../ui/ContentEditor';
import FileUploader from '../ui/FileUploader';
import { FileTypeIcon } from '../ui/icons/FileTypeIcon';
import TXTViewer from '../viewers/TXTViewer';

export default function ContentDetailPanel() {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [fileError, setFileError] = useState('');
  const [fileInfo, setFileInfo] = useState(null);
  const fileInputRef = useRef(null);
  
  const dispatch = useDispatch();
  
  // Use specific selectors that only return needed parts of state
  const selectedHash = useSelector(state => state?.content?.selectedHash);
  const cardsMap = useSelector(state => state?.content?.cards || {});
  
  // Additional selector for content type from the selected item slice
  const selectedItemMetadata = useSelector(state => state?.selectedItem?.metadata);
  const selectedItemContent = useSelector(state => state?.selectedItem?.content);
  
  // Memoize the calculated values, not the selector itself
  const selectedContentItem = useMemo(() => {
    // Find the card by hash - safely handle when cards is undefined or empty
    if (selectedHash && cardsMap) {
      return Object.values(cardsMap).find(c => c && c.hash === selectedHash) || null;
    }
    
    return null;
  }, [cardsMap, selectedHash]);

  // Helper function to determine content type
  const getContentType = useMemo(() => {
    // First check if we have content type in selectedItemMetadata
    if (selectedItemMetadata && selectedItemMetadata.contentType && 
        selectedItemMetadata.contentType !== "null") {
      return selectedItemMetadata.contentType;
    }
    
    // Then check the card's content type if available
    if (selectedContentItem?.contentType?.mimeType) {
      return selectedContentItem.contentType.mimeType;
    }
    
    // Fallback: try to detect from content object properties
    if (selectedContentItem?.content?.mimeType) {
      return selectedContentItem.content.mimeType;
    }
    
    // Ultimate fallback
    return 'text/plain';
  }, [selectedItemMetadata, selectedContentItem]);

  // Helper function to handle different content types
  const formatContent = (content) => {
    if (!content) return '';
    
    // If content is already a string, return it
    if (typeof content === 'string') return content;
    
    // Special handling for Buffer JSON that contains text
    if (typeof content === 'object' && content?.type === 'Buffer' && Array.isArray(content?.data)) {
      try {
        // Convert to Uint8Array and decode as text - this handles the case where text files
        // are stored as Buffer JSON but should be displayed as text (for txt, md, etc.)
        const array = new Uint8Array(content.data);
        const text = new TextDecoder().decode(array);
        
        // Log the conversion for debugging
        console.log("ContentDetailPanel: Converted Buffer JSON to text", text.substring(0, 30) + "...");
        
        return text;
      } catch (e) {
        console.error("ContentDetailPanel: Error decoding Buffer content", e);
      }
    }
    
    // If it's an object (parsed JSON), stringify it for display
    if (typeof content === 'object') {
      try {
        return JSON.stringify(content, null, 2);
      } catch (e) {
        console.error('Error stringifying content:', e);
      }
    }
    
    // Fallback: convert to string
    return String(content);
  };

  // Effect to update content when a new card is selected
  useEffect(() => {
    if (selectedContentItem) {
      setEditContent(formatContent(selectedContentItem.content));
      setIsEditing(false);
      
      // Check if the content is a media MCard
      const content = selectedContentItem.content;
      if (typeof content === 'object' && content?.type === 'media' && content?.data) {
        setFileInfo({
          name: content.fileName || 'Unknown file',
          type: content.mimeType || '',
          data: content.data,
          size: content.size || 0
        });
      } else {
        setFileInfo(null);
      }
    } else {
      setEditContent('');
      setFileInfo(null);
    }
  }, [selectedContentItem]);

  const handleContentChange = (newContent) => {
    setEditContent(newContent);
  };

  const handleSubmit = () => {
    if (editContent) {
      // Use the direct API endpoint for files/binary data instead of going through Redux
      // This bypasses the filtering in TopBar component
      if (fileInfo && fileInfo.data) {
        // For file uploads, use direct API call to bypass Redux serialization
        saveBinaryContentDirectly(fileInfo.data, fileInfo);
      } else {
        // For text content, use normal Redux flow
        dispatch(addContent(editContent));
      }
      setEditContent('');
      setFileInfo(null);
      setIsEditing(false);
    }
  };

  const handleNewClick = () => {
    setIsEditing(true);
    setEditContent('');
    setFileInfo(null);
  };

  const handleCancel = () => {
    // Revert to original content if editing
    if (selectedContentItem) {
      setEditContent(formatContent(selectedContentItem.content));
      
      // Restore file info if it exists
      const content = selectedContentItem.content;
      if (typeof content === 'object' && content?.type === 'media' && content?.data) {
        setFileInfo({
          name: content.fileName || 'Unknown file',
          type: content.mimeType || '',
          data: content.data,
          size: content.size || 0
        });
      } else {
        setFileInfo(null);
      }
    } else {
      setEditContent('');
      setFileInfo(null);
    }
    
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (selectedContentItem?.hash) {
      dispatch(deleteContent(selectedContentItem.hash));
    }
  };
  
  // Handle file upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  // Handle file selection
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setFileError('');
      
      // Read as binary data (ArrayBuffer)
      const binaryData = await readFileAsBinary(file);
      
      // Create a blob URL for preview purposes only
      const blobUrl = URL.createObjectURL(new Blob([binaryData], {type: file.type}));
      
      setFileInfo({
        name: file.name,
        type: file.type,
        size: file.size,
        data: binaryData,     // Store binary data
        previewUrl: blobUrl   // Use for UI preview
      });
      
      // For editing purposes, show metadata only
      setEditContent(JSON.stringify({
        type: 'media',
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        dataPreview: `[${formatFileSize(file.size)} binary data]`
      }, null, 2));
      setIsEditing(true);
    } catch (error) {
      console.error('Error reading file:', error);
      setFileError(`Failed to read file: ${error.message}`);
      setFileInfo(null);
    } finally {
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Function to check if a file is a media file
  const isMediaFile = (file) => {
    return file.type.startsWith('image/') || 
           file.type.startsWith('video/') ||
           file.type.startsWith('audio/') ||
           file.type === 'application/pdf';
  };
  
  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
    else return (bytes / 1073741824).toFixed(2) + ' GB';
  };
  
  // Function to read file as text
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(new Error('Error reading text file'));
      reader.readAsText(file);
    });
  };
  
  // Function to read file as data URL (for binary/media files)
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(new Error('Error reading media file'));
      reader.readAsDataURL(file);
    });
  };

  // Function to read file as ArrayBuffer (native binary format)
  const readFileAsBinary = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(new Error('Error reading binary file'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Direct API function for saving binary content
  const saveBinaryContentDirectly = async (binaryData, fileMetadata) => {
    try {
      // Create form data to properly send binary content
      const formData = new FormData();
      const blob = new Blob([binaryData], {type: fileMetadata.type});
      
      formData.append('action', 'add');
      formData.append('file', blob, fileMetadata.name);
      formData.append('metadata', JSON.stringify({
        fileName: fileMetadata.name,
        mimeType: fileMetadata.type,
        size: fileMetadata.size
      }));
      
      const response = await fetch('/api/card-collection', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to save content: ${response.statusText}`);
      }

      const result = await response.json();
      
      // If successful, add reference to Redux so it shows in the UI
      if (result.success && result.hash) {
        // Store reference with metadata for display
        dispatch(addContent({
          type: 'media',
          fileName: fileMetadata.name,
          mimeType: fileMetadata.type,
          size: fileMetadata.size,
          hash: result.hash,
          contentReference: result.hash,
          // Add preview URL for images
          previewUrl: fileMetadata.previewUrl || null
        }));
      }
    } catch (error) {
      console.error('Error saving binary content:', error);
      setFileError(`Failed to save content: ${error.message}`);
    }
  };

  // Determine if we're displaying a media preview
  const isMediaPreview = fileInfo || 
    (selectedContentItem?.content?.type === 'media' && !isEditing);

  // Content to display in editor when not showing media
  const editorContent = isEditing 
    ? editContent 
    : (isMediaPreview ? '' : formatContent(selectedContentItem?.content));

  return (
    <div className="flex flex-col h-full max-h-full bg-background overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-none flex justify-between items-center px-3 py-2 bg-muted border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-base font-semibold text-foreground truncate max-w-[50%]">
          {isEditing ? 'Push New Content' : fileInfo?.name || 'Content Details'}
        </h2>
        <div className="flex gap-1 overflow-x-auto max-w-[50%]">
          {/* File Upload Button - Now more prominent */}
          <button
            onClick={handleUploadClick}
            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors whitespace-nowrap font-bold"
            style={{ padding: '6px 12px', fontSize: '14px' }}
          >
            📁 Upload File
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="*/*" // Accept all file types
          />
          
          {!isEditing && (
            <button
              onClick={handleNewClick}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors whitespace-nowrap"
            >
              New
            </button>
          )}
          {selectedContentItem && !isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors whitespace-nowrap"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors whitespace-nowrap"
              >
                Delete
              </button>
            </>
          )}
          {isEditing && (
            <>
              <button
                onClick={handleCancel}
                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors whitespace-nowrap"
              >
                Save
              </button>
            </>
          )}
        </div>
      </div>

      {/* File Error Display */}
      {fileError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 mb-2">
          {fileError}
        </div>
      )}

      {/* File Info Display */}
      {fileInfo && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 mb-2">
          <div><strong>File:</strong> {fileInfo.name}</div>
          <div><strong>Type:</strong> {fileInfo.type || 'Unknown'}</div>
          <div><strong>Size:</strong> {formatFileSize(fileInfo.size)}</div>
        </div>
      )}

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-auto p-2">
        {/* Upload Interface - shown when explicitly adding new content */}
        {isEditing && !fileInfo && !selectedContentItem && (
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Upload a File</h3>
            <FileUploader 
              onFileSelected={async (file) => {
                try {
                  if (isMediaFile(file)) {
                    const fileData = await readFileAsDataURL(file);
                    setFileInfo({
                      name: file.name,
                      type: file.type,
                      size: file.size,
                      data: fileData
                    });
                    
                    // Create a preview version of the media MCard
                    const mediaPreview = JSON.stringify({
                      type: 'media',
                      fileName: file.name,
                      mimeType: file.type,
                      size: file.size,
                      uploadedAt: new Date().toISOString(),
                      // We don't include the full data in the preview
                      dataPreview: `[${formatFileSize(file.size)} media file]`
                    }, null, 2);
                    
                    setEditContent(mediaPreview);
                  } else {
                    const textContent = await readFileAsText(file);
                    setEditContent(textContent);
                    setFileInfo(null);
                  }
                } catch (error) {
                  console.error('Error reading file:', error);
                  setFileError(`Failed to read file: ${error.message}`);
                }
              }}
              className="mb-4"
            />
            <div className="text-center text-gray-500 text-sm mt-4">
              - or -
            </div>
          </div>
        )}
        
        {/* Media Preview - Using Card Layout */}
        {isMediaPreview && (
          <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-4 flex flex-col items-center">
              {/* File Type Icon */}
              <div className="mb-4">
                <FileTypeIcon 
                  mimeType={fileInfo?.type || selectedContentItem?.content?.mimeType} 
                  extension={getFileExtension(fileInfo?.name || selectedContentItem?.content?.fileName)}
                  size={48}
                />
              </div>
              
              {/* File Name */}
              <h3 className="text-lg font-semibold text-center mb-2">
                {fileInfo?.name || selectedContentItem?.content?.fileName || "File"}
              </h3>
              
              {/* File Info */}
              <div className="text-sm text-gray-500 mb-4">
                {fileInfo?.type || selectedContentItem?.content?.mimeType || "Unknown type"} • 
                {formatFileSize(fileInfo?.size || selectedContentItem?.content?.size || 0)}
              </div>

              {/* Media Preview Based on Type */}
              <div className="w-full flex justify-center mb-4">
                {fileInfo?.type?.startsWith('image/') || selectedContentItem?.content?.mimeType?.startsWith('image/') ? (
                  <img 
                    src={fileInfo?.previewUrl || fileInfo?.data || selectedContentItem?.content?.previewUrl || selectedContentItem?.content?.data} 
                    alt={fileInfo?.name || selectedContentItem?.content?.fileName || "Image preview"}
                    className="max-w-full max-h-[300px] object-contain rounded-md"
                  />
                ) : fileInfo?.type?.startsWith('video/') || selectedContentItem?.content?.mimeType?.startsWith('video/') ? (
                  <video 
                    controls
                    src={fileInfo?.previewUrl || fileInfo?.data || selectedContentItem?.content?.previewUrl || selectedContentItem?.content?.data}
                    className="max-w-full max-h-[300px] rounded-md"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : fileInfo?.type?.startsWith('audio/') || selectedContentItem?.content?.mimeType?.startsWith('audio/') ? (
                  <audio 
                    controls
                    src={fileInfo?.previewUrl || fileInfo?.data || selectedContentItem?.content?.previewUrl || selectedContentItem?.content?.data}
                    className="w-full rounded-md"
                  >
                    Your browser does not support the audio tag.
                  </audio>
                ) : fileInfo?.type === 'application/pdf' || selectedContentItem?.content?.mimeType === 'application/pdf' ? (
                  <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-6xl mb-3">
                      <FileTypeIcon mimeType="application/pdf" size={64} />
                    </div>
                    <a 
                      href={fileInfo?.previewUrl || fileInfo?.data || selectedContentItem?.content?.previewUrl || selectedContentItem?.content?.data} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 underline mt-2 inline-block"
                    >
                      Open PDF
                    </a>
                  </div>
                ) : (
                  <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <FileTypeIcon 
                      mimeType={fileInfo?.type || selectedContentItem?.content?.mimeType}
                      extension={getFileExtension(fileInfo?.name || selectedContentItem?.content?.fileName)}
                      size={64}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Text Content Card View */}
        {!isMediaPreview && selectedContentItem && !isEditing && (
          <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <FileTypeIcon 
                  mimeType={getContentType()}
                  size={24}
                  className="mr-3"
                />
                <div>
                  <h3 className="font-medium">
                    {selectedHash ? `${selectedHash.substring(0, 8)}...` : 'Text Content'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {getContentType()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-0">
              {/* Use TXTViewer for text/plain files */}
              {getContentType() === 'text/plain' ? (
                <TXTViewer content={selectedContentItem?.content} />
              ) : (
                <ContentEditor
                  content={editorContent || ''}
                  onChange={handleContentChange}
                  title={'Content Viewer'}
                  isReadOnly={true}
                  showLineNumbers={true}
                  language="Plain Text"
                  className="w-full border-0 rounded-none"
                />
              )}
            </div>
          </div>
        )}
        
        {/* Text Editor Interface - When Editing */}
        {isEditing && (
          <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <FileTypeIcon 
                  mimeType={getContentType()}
                  extension={fileInfo?.name ? getFileExtension(fileInfo.name) : undefined}
                  size={24}
                  className="mr-3"
                />
                <h3 className="font-medium">Edit Content</h3>
              </div>
            </div>
            
            <div className="p-0">
              <ContentEditor
                content={editorContent || ''}
                onChange={handleContentChange}
                onSave={handleSubmit}
                title={'Edit Content'}
                isReadOnly={false}
                showLineNumbers={true}
                language="Plain Text"
                className="w-full border-0 rounded-none"
              />
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {!isEditing && !selectedContentItem && !isMediaPreview && (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
            <FileTypeIcon size={64} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No Content Selected</p>
            <p className="text-sm mt-2">Select an item from the list or create new content</p>
            <button
              onClick={handleNewClick}
              className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Create New Content
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get file extension from a filename
const getFileExtension = (filename) => {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};