import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setSearchQuery } from '../features/contentSlice';

const SearchContent = () => {
  const dispatch = useDispatch();
  const [searchText, setSearchText] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setSearchQuery(searchText));
  };

  const handleClearSearch = () => {
    setSearchText('');
    dispatch(setSearchQuery(''));
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center space-x-2">
      <input 
        type="text" 
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search content..."
        className="flex-1 p-2 border rounded"
      />
      <button 
        type="submit" 
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Search
      </button>
      {searchText && (
        <button 
          type="button"
          onClick={handleClearSearch}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
        >
          Clear
        </button>
      )}
    </form>
  );
};

export default SearchContent;
