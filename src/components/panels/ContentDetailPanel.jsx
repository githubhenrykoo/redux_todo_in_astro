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
  
  const dispatch = useDispatch();
  const { selectedHash, selectedCard } = useSelector(state => ({
    selectedHash: state.content.selectedHash,
    selectedCard: state.content.selectedHash 
      ? state.content.cards[state.content.selectedHash]?.content 
      : ''
  }));

  // Effect to update content when a new card is selected
  useEffect(() => {
    if (selectedCard) {
      setEditContent(selectedCard);
      setIsEditing(false);
    } else {
      setEditContent('');
    }
  }, [selectedCard]);

  const handleContentChange = (newContent) => {
    setEditContent(newContent);
  };

  const handleSubmit = () => {
    if (editContent.trim()) {
      // Always create a new content card
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
    if (selectedCard) {
      setEditContent(selectedCard);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (selectedHash) {
      dispatch(deleteContent(selectedHash));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 flex justify-between items-center px-4 py-2 bg-gray-100 border-b">
        <h2 className="text-lg font-semibold text-gray-700">
          {isEditing ? 'Edit Content' : 'Content Details'}
        </h2>
        <div className="flex items-center gap-4">
          {/* Display Selected Content Hash */}
          {selectedHash && (
            <div className="text-sm text-gray-500">
              Selected Hash: {selectedHash}
            </div>
          )}
          
          <div className="flex gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={handleNewClick}
                  className="px-4 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  New Content
                </button>
                {selectedHash && (
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
                  {selectedHash ? 'Save as New' : 'Save'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-auto">
        <ContentEditor
          content={editContent}
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