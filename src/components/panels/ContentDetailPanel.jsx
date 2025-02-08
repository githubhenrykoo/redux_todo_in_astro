'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  addContent, 
  selectContent, 
  deleteContent 
} from '../../features/contentSlice.js';
import ContentEditor from '../ui/ContentEditor';

export default function ContentDetailPanel() {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  
  const dispatch = useDispatch();
  const { selectedId, selectedItem } = useSelector(state => ({
    selectedId: state.content.selectedId,
    selectedItem: state.content.selectedId 
      ? state.content.items[state.content.selectedId] 
      : null
  }));

  // Effect to update content when a new item is selected
  useEffect(() => {
    if (selectedItem) {
      setOriginalContent(selectedItem.content);
      setEditContent('');
      setIsEditing(false);
    }
  }, [selectedItem]);

  const handleContentChange = (newContent) => {
    setEditContent(newContent);
  };

  const handleSubmit = () => {
    if (editContent.trim()) {
      // Always create a new content item
      dispatch(addContent(editContent));
      
      setEditContent('');
      setIsEditing(false);
    }
  };

  const handleNewClick = () => {
    setIsEditing(true);
    setEditContent('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent('');
  };

  const handleDelete = () => {
    if (selectedItem) {
      dispatch(deleteContent(selectedItem.id));
    }
  };

  // Determine the content to display
  const displayContent = isEditing 
    ? editContent 
    : (originalContent || '');

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 flex justify-between items-center px-4 py-2 bg-gray-100 border-b">
        <h2 className="text-lg font-semibold text-gray-700">
          {isEditing ? 'Push New Content' : 'Content Details'}
        </h2>
        <div className="flex items-center gap-4">
          {/* Display Selected Content ID */}
          {selectedId && (
            <div className="text-sm text-gray-500">
              Selected ID: {selectedId}
            </div>
          )}
          
          <div className="flex gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={handleNewClick}
                  className="px-4 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Push New Content
                </button>
                {selectedItem && (
                  <button
                    onClick={handleDelete}
                    className="px-4 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Save as New
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-auto">
        <ContentEditor
          content={displayContent}
          onChange={handleContentChange}
          onSave={isEditing ? handleSubmit : undefined}
          title={isEditing ? 'Edit Content' : 'Content Viewer'}
          isReadOnly={!isEditing}
          theme={isEditing ? 'light' : 'dark'}
          showLineNumbers={true}
          language="Plain Text"
          className="h-full"
        />
      </div>
    </div>
  );
}