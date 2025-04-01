'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  addContent, 
  deleteContent 
} from '../../features/contentSlice.js';
import ContentEditor from '../ui/ContentEditor';
import FileUploader from '../ui/FileUploader';

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
  
  // Memoize the calculated values, not the selector itself
  const selectedContentItem = useMemo(() => {
    // Find the card by hash - safely handle when cards is undefined or empty
    if (selectedHash && cardsMap) {
      return Object.values(cardsMap).find(c => c && c.hash === selectedHash) || null;
    }
    
    return null;
  }, [cardsMap, selectedHash]);

  // Helper function to handle different content types
  const formatContent = (content) => {
    if (!content) return '';
    
    // If content is already a string, return it
    if (typeof content === 'string') return content;
    
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
      // Store the raw content directly without metadata wrapping
      dispatch(addContent(editContent));
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
      
      // Store just the raw file data without additional processing
      const fileData = await readFileAsDataURL(file);
      
      // Store basic info for UI display only (not saved to MCard)
      setFileInfo({
        name: file.name,
        type: file.type,
        size: file.size,
        data: fileData
      });
      
      // Set the raw file data as the content
      setEditContent(fileData);
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
        
        {/* Media Preview */}
        {isMediaPreview && (
          <div className="w-full flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-3">
            {/* Display based on media type */}
            {fileInfo?.type?.startsWith('image/') || selectedContentItem?.content?.mimeType?.startsWith('image/') ? (
              <img 
                src={fileInfo?.data || selectedContentItem?.content?.data} 
                alt={fileInfo?.name || selectedContentItem?.content?.fileName || "Image preview"}
                className="max-w-full max-h-[400px] object-contain mb-2"
              />
            ) : fileInfo?.type?.startsWith('video/') || selectedContentItem?.content?.mimeType?.startsWith('video/') ? (
              <video 
                controls
                src={fileInfo?.data || selectedContentItem?.content?.data}
                className="max-w-full max-h-[400px] mb-2"
              >
                Your browser does not support the video tag.
              </video>
            ) : fileInfo?.type?.startsWith('audio/') || selectedContentItem?.content?.mimeType?.startsWith('audio/') ? (
              <audio 
                controls
                src={fileInfo?.data || selectedContentItem?.content?.data}
                className="w-full mb-2"
              >
                Your browser does not support the audio tag.
              </audio>
            ) : fileInfo?.type === 'application/pdf' || selectedContentItem?.content?.mimeType === 'application/pdf' ? (
              <div className="w-full text-center">
                <div className="text-4xl mb-2">📄</div>
                <p>PDF file: {fileInfo?.name || selectedContentItem?.content?.fileName}</p>
                <a 
                  href={fileInfo?.data || selectedContentItem?.content?.data} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 underline mt-2 inline-block"
                >
                  Open PDF
                </a>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-2">📁</div>
                <p>File: {fileInfo?.name || selectedContentItem?.content?.fileName}</p>
                <p className="text-sm text-gray-500">
                  {fileInfo?.type || selectedContentItem?.content?.mimeType || "Unknown file type"}
                </p>
              </div>
            )}
            <div className="text-sm text-gray-500 mt-2">
              Size: {formatFileSize(fileInfo?.size || selectedContentItem?.content?.size || 0)}
            </div>
          </div>
        )}
        
        {/* Text Editor (Hidden for media when not editing) */}
        <div className={`w-full h-full max-w-full ${isMediaPreview && !isEditing ? 'hidden' : ''}`}>
          <ContentEditor
            content={editorContent || ''}
            onChange={handleContentChange}
            onSave={isEditing ? handleSubmit : undefined}
            title={isEditing ? 'Edit Content' : 'Content Viewer'}
            isReadOnly={!isEditing}
            showLineNumbers={true}
            language="Plain Text"
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}