import React from 'react';
import * as api from './api';
import { processApiItems } from './dataHelpers';

/**
 * Custom hook for handling search functionality
 * @param {Object} options - Options object
 * @returns {Object} - Actions and state
 */
export const useSearchHandler = ({
  searchTerm,
  setSearchTerm,
  isSearchMode,
  setIsSearchMode,
  searchResults,
  setSearchResults,
  setSearchLoading,
  setSearchError,
  pagination,
  fetchCatalogItems
}) => {
  /**
   * Handle search form submission
   * @param {Event} e - Form submit event
   */
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      clearSearch();
      return;
    }
    
    setIsSearchMode(true);
    setSearchLoading(true);
    
    try {
      const data = await api.searchByContent(searchTerm, 1, pagination.pageSize);
      if (data.success) {
        const transformedItems = processApiItems(data);
        setSearchResults({
          items: transformedItems,
          currentPage: data.currentPage || 1,
          totalPages: data.totalPages || Math.ceil((data.totalResults || data.totalItems || transformedItems.length) / pagination.pageSize),
          totalItems: data.totalResults || data.totalItems || transformedItems.length,
          searchTerm: searchTerm
        });
      } else {
        setSearchError(data.error || 'Search failed');
      }
    } catch (error) {
      console.error('Error searching catalog items:', error);
      setSearchError('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  /**
   * Clear the current search and reset to normal view
   */
  const clearSearch = () => {
    setIsSearchMode(false);
    setSearchResults({
      items: [], currentPage: 1, totalPages: 1, totalItems: 0, searchTerm: ''
    });
    setSearchTerm('');
  };

  /**
   * Fetch a specific page of search results
   * @param {number} newPage - Page number to fetch
   */
  const fetchSearchPage = async (newPage) => {
    setSearchLoading(true);
    try {
      const data = await api.searchByContent(searchResults.searchTerm, newPage, pagination.pageSize);
      if (data.success) {
        const transformedItems = processApiItems(data);
        setSearchResults({
          items: transformedItems,
          currentPage: data.currentPage || newPage,
          totalPages: data.totalPages || Math.ceil((data.totalResults || data.totalItems || transformedItems.length) / pagination.pageSize),
          totalItems: data.totalResults || data.totalItems || transformedItems.length,
          searchTerm: searchResults.searchTerm
        });
      } else {
        setSearchError(data.error || 'Search failed');
      }
    } catch (error) {
      console.error('Error searching catalog items:', error);
      setSearchError('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  /**
   * Refresh the catalog or clear search
   */
  const handleRefresh = () => {
    if (isSearchMode) clearSearch();
    fetchCatalogItems();
  };

  return {
    handleSearchSubmit,
    clearSearch,
    fetchSearchPage,
    handleRefresh
  };
};

export default useSearchHandler;
