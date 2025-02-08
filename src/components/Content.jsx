'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectContent, deleteContent } from '../features/contentSlice';

const Content = () => {
  const dispatch = useDispatch();
  const { items, search } = useSelector(state => state.content);
  
  // Get all content items, not just search results
  const contentItems = Object.values(items);
  const searchQuery = search.query.toLowerCase();

  // Filter content based on search query if it exists
  const filteredContent = searchQuery
    ? contentItems.filter(content => 
        content.content.toLowerCase().includes(searchQuery)
      )
    : contentItems;

  const handleContentSelect = (id) => {
    dispatch(selectContent(id));
  };

  const handleContentDelete = (id) => {
    dispatch(deleteContent(id));
  };

  return (
    <div className="space-y-4 dark:bg-neutral-900 dark:text-neutral-100">
      {/* Content List */}
      <div className="space-y-2">
        {filteredContent.length === 0 ? (
          <p className="text-gray-500 dark:text-neutral-500 text-center">
            {searchQuery 
              ? `No content matches "${search.query}"` 
              : 'No content available'}
          </p>
        ) : (
          filteredContent.map(content => {
            if (!content) return null;
            
            return (
              <div 
                key={content.id} 
                className={`
                  flex flex-col p-2 border rounded 
                  hover:bg-gray-100 dark:hover:bg-neutral-800
                `}
              >
                {/* Content Preview */}
                <div 
                  onClick={() => handleContentSelect(content.id)}
                  className="cursor-pointer mb-2 dark:text-neutral-100"
                >
                  {content.content.substring(0, 200)}...
                </div>

                {/* Metadata and Actions */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500 dark:text-neutral-500">
                    Created: {new Date(content.createdAt).toLocaleString()}
                  </div>
                  <div className="space-x-2">
                    <button 
                      onClick={() => handleContentDelete(content.id)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Content;
