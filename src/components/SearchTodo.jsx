'use client';

import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setSearchQuery } from '../features/todoSlice';
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
      <label htmlFor="search" className="block text-sm font-medium text-foreground mb-2">
        Search Items
      </label>
      <div className="flex gap-2 items-center">
        <input
          id="search"
          type="text"
          value={searchInput}
          onChange={handleSearch}
          placeholder="Type to filter todos..."
          className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <button 
          className="bg-muted p-2 rounded-lg hover:bg-muted-foreground/10 transition-colors duration-200"
          onClick={() => debouncedSearch(searchInput)}
          aria-label="Search"
        >
          <FiSearch className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Start typing to instantly filter your todo list
      </p>
    </div>
  );
}
