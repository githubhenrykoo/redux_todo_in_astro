'use client';

import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setSearchQuery } from '../features/todo/todoSlice';
import { FiSearch } from 'react-icons/fi';

export default function SearchTodo() {
  const [searchInput, setSearchInput] = useState('');
  const dispatch = useDispatch();

  // Debounce function
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query) => {
      dispatch(setSearchQuery(query));
    }, 300),
    [dispatch]
  );

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchInput(query);
    debouncedSearch(query);
  };

  return (
    <div className="mb-6">
      <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
        Search Todos
      </label>
      <div className="flex gap-2 items-center">
        <input
          id="search"
          type="text"
          value={searchInput}
          onChange={handleSearch}
          placeholder="Type to filter todos..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button 
          className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          onClick={() => debouncedSearch(searchInput)}
        >
          <FiSearch className="text-gray-600" size={16} />
        </button>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Start typing to instantly filter your todo list
      </p>
    </div>
  );
}
