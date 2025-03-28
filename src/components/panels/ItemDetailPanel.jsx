'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addContent } from '../../features/contentSlice.js';
import ContentEditor from '../ui/ContentEditor';

export default function ItemDetailPanel() {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  
  const dispatch = useDispatch();
  
  // Use specific selectors that only return needed parts of state
  const selectedHash = useSelector(state => state?.content?.selectedHash);
  const cards = useSelector(state => state?.content?.cards || {});
  
  // Memoize the calculated values, not the selector itself
  const selectedContentItem = useMemo(() => {
    // Find the card by hash
    return selectedHash ? cards[selectedHash] : null;
  }, [cards, selectedHash]);

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
      setEditContent(formatContent(selectedContentItem.content));
    }
    setIsEditing(false);
  };

  // Determine the content to display
  const displayContent = isEditing 
    ? editContent 
    : formatContent(selectedContentItem?.content);

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 flex justify-between items-center px-4 py-2 bg-gray-100 border-b">
        <h2 className="text-lg font-semibold text-gray-700">
          {isEditing ? 'Edit Content' : 'Item Details'}
        </h2>
        <div className="flex gap-2">
          {!isEditing && (
            <button
              onClick={handleNewClick}
              className="px-4 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              New Item
            </button>
          )}
          {selectedContentItem && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
            >
              Edit
            </button>
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
          content={displayContent || ''}
          onChange={handleContentChange}
          onSave={isEditing ? handleSubmit : undefined}
          title={isEditing ? 'Edit Content' : 'Content Viewer'}
          isReadOnly={!isEditing}
          showLineNumbers={true}
          language="Plain Text"
          className="h-full"
        />
      </div>
    </div>
  );
}