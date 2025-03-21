'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  addContent, 
  deleteContent 
} from '../../features/contentSlice.js';
import ContentEditor from '../ui/ContentEditor';

export default function ContentDetailPanel() {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  
  const dispatch = useDispatch();
  // Using memoized selector to prevent unnecessary rerenders
  const { selectedHash, selectedContentItem } = useSelector(state => {
    const hash = state.content.selectedHash;
    const cards = state.content.cards;
    
    // Find the card by iterating through cards
    const card = Object.values(cards).find(c => c.hash === hash);
    
    return {
      selectedHash: hash,
      selectedContentItem: card
    };
  }, (prev, next) => {
    // Custom equality function for shallow comparison of returned objects
    return prev.selectedHash === next.selectedHash && 
           prev.selectedContentItem === next.selectedContentItem;
  });

  // Effect to update content when a new card is selected
  useEffect(() => {
    if (selectedContentItem) {
      setEditContent(selectedContentItem.content);
      setIsEditing(false);
    } else {
      setEditContent('');
    }
  }, [selectedContentItem]);

  const handleContentChange = (newContent) => {
    setEditContent(newContent);
  };

  const handleSubmit = () => {
    if (editContent.trim()) {
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
    // Revert to original content if editing
    if (selectedContentItem) {
      setEditContent(selectedContentItem.content);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (selectedContentItem?.hash) {
      dispatch(deleteContent(selectedContentItem.hash));
    }
  };

  // Determine the content to display
  const displayContent = isEditing 
    ? editContent 
    : (selectedContentItem?.content || '');

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 flex justify-between items-center px-4 py-2 bg-gray-100 border-b">
        <h2 className="text-lg font-semibold text-gray-700">
          {isEditing ? 'Push New Content' : 'Content Details'}
        </h2>
        <div className="flex gap-2">
          {!isEditing && (
            <button
              onClick={handleNewClick}
              className="px-4 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Push New Content
            </button>
          )}
          {selectedContentItem && !isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
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
                Save
              </button>
            </>
          )}
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