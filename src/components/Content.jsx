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
          filteredContent.map(card => {
            if (!card) return null;
            
            // Convert content to a string safely
            const contentPreview = (() => {
              if (!card.content) return 'No content';
              
              let contentString;
              if (typeof card.content === 'object') {
                contentString = JSON.stringify(card.content);
              } else {
                contentString = String(card.content);
              }
              
              return contentString.substring(0, 200);
            })();

            return (
              <div 
                key={card.hash} 
                className={`
                  flex flex-col p-2 border rounded 
                  hover:bg-gray-100 dark:hover:bg-neutral-800
                `}
              >
                {/* Content Preview */}
                <div 
                  onClick={() => handleContentSelect(card.hash)}
                  className="cursor-pointer mb-2 dark:text-neutral-100"
                >
                  {contentPreview}...
                </div>

                {/* Metadata and Actions */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500 dark:text-neutral-500">
                    Created: {new Date(card.createdAt).toLocaleString()}
                  </div>
                  <div className="space-x-2">
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
