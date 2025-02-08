import React, { useMemo } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { 
  deleteContent, 
  selectContent
} from '../features/contentSlice';

// Memoized selector for content state
const selectContentState = createSelector(
  (state) => state.content,
  (content) => ({
    items: content?.items || {},
    search: content?.search || { results: [] },
    selected: content?.selected || null
  })
);

const Content = () => {
  const dispatch = useDispatch();
  const { items, search, selected } = useSelector(selectContentState, shallowEqual);
  const searchResults = useMemo(() => search.results || [], [search.results]);

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
        {searchResults.length === 0 ? (
          <p className="text-gray-500 dark:text-neutral-500 text-center">No content found</p>
        ) : (
          searchResults.map(hash => {
            const content = items[hash];
            const isSelected = selected === hash;

            return (
              <div 
                key={hash} 
                className={`
                  flex flex-col p-2 border rounded 
                  ${isSelected 
                    ? 'bg-blue-50 border-blue-300 dark:bg-blue-900 dark:border-blue-700' 
                    : 'hover:bg-gray-100 dark:hover:bg-neutral-800'}
                `}
              >
                {/* Content Preview */}
                <div 
                  onClick={() => handleContentSelect(hash)}
                  className="cursor-pointer mb-2 dark:text-neutral-100"
                >
                  {content?.content.substring(0, 200)}...
                </div>

                {/* Metadata and Actions */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500 dark:text-neutral-500">
                    Hash: {hash.substring(0, 10)}...
                  </div>
                  <div className="space-x-2">
                    <button 
                      onClick={() => handleContentDelete(hash)}
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
