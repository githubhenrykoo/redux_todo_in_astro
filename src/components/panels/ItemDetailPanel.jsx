'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addTodo } from '../../features/todoSlice.js';
import ContentEditor from '../ui/ContentEditor';

export default function ItemDetailPanel() {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const selectedContent = useSelector(state => state.todo.selectedContent);
  const dispatch = useDispatch();

  const handleContentChange = (newContent) => {
    setEditContent(newContent);
  };

  const handleSubmit = () => {
    if (editContent.trim()) {
      dispatch(addTodo(editContent));
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

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header - Fixed Height */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-100 flex-shrink-0">
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

      {/* Content Area - Flexible Height with Scroll */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ContentEditor
          content={isEditing ? editContent : (selectedContent || '')}
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