'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchQuery } from '../features/contentSlice';

const SearchContent = () => {
  const dispatch = useDispatch();
  const searchQuery = useSelector(state => state.content.search.query);

  const handleSearchChange = (e) => {
    dispatch(setSearchQuery(e.target.value));
  };

  const handleClearSearch = () => {
    dispatch(setSearchQuery(''));
  };

  return (
    <div className="flex items-center space-x-1">
      <input 
        type="text" 
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Search content..."
        className="flex-1 p-1 text-sm border rounded"
      />
      {searchQuery && (
        <button 
          onClick={handleClearSearch}
          className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded"
        >
          Clear
        </button>
      )}
    </div>
  );
};

export default SearchContent;
