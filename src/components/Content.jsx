'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectContent, deleteContent } from '../features/contentSlice';

const Content = () => {
  const dispatch = useDispatch();
  const { cards, search } = useSelector(state => state.content);
  
  // Get all content cards, not just search results
  const contentCards = Object.values(cards);
  const searchQuery = search.query.toLowerCase();

  // Utility function to safely truncate content
  const truncateContent = (content, maxLength = 50) => {
    if (!content) return 'No content';
    
    let contentString;
    if (typeof content === 'object') {
      contentString = JSON.stringify(content);
    } else {
      contentString = String(content);
    }
    
    return contentString.length > maxLength 
      ? contentString.substring(0, maxLength) + '...'
      : contentString;
  };

  // Filter content based on search query if it exists
  const filteredContent = searchQuery
    ? contentCards.filter(card => 
        card.content.toLowerCase().includes(searchQuery)
      )
    : contentCards;

  const handleContentSelect = (hash) => {
    dispatch(selectContent(hash));
  };

  const handleContentDelete = (hash) => {
    dispatch(deleteContent(hash));
  };

  return (
    <div className="h-full max-h-full overflow-y-auto dark:bg-neutral-900 dark:text-neutral-100">
      {/* Content List */}
      <div className="space-y-1">
        {filteredContent.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-neutral-500 text-center p-2">
            {searchQuery 
              ? `No content matches "${search.query}"` 
              : 'No content available'}
          </p>
        ) : (
          filteredContent.map(card => {
            if (!card) return null;
            
            const contentPreview = truncateContent(card.content);

            return (
              <div 
                key={card.hash} 
                className={`
                  flex flex-col p-1 border-b 
                  hover:bg-gray-100 dark:hover:bg-neutral-800
                `}
              >
                {/* Content Preview */}
                <div 
                  onClick={() => handleContentSelect(card.hash)}
                  className="cursor-pointer text-sm mb-1 dark:text-neutral-100 truncate"
                >
                  {contentPreview}
                </div>

                {/* Metadata and Actions */}
                <div className="flex justify-between items-center text-xs">
                  <div className="text-gray-500 dark:text-neutral-500 truncate">
                    Created: {new Date(card.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <button 
                      onClick={() => handleContentDelete(card.hash)}
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
