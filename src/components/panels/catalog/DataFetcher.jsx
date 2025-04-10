import React from 'react';
import * as api from './api';
import { processApiItems, updatePagination } from './dataHelpers';

/**
 * Custom hook for handling data fetching operations
 * @param {Object} options - Options object
 * @returns {Object} - Actions and state
 */
export const useDataFetcher = ({
  setLoading,
  setError,
  setItems,
  setPagination,
  pagination
}) => {
  /**
   * Fetch initial catalog items
   */
  const fetchCatalogItems = async () => {
    setLoading(true);
    try {
      const data = await api.fetchItemsPage(1, pagination.pageSize);
      if (data.success) {
        const transformedItems = processApiItems(data);
        setItems(transformedItems);
        setPagination(updatePagination(data, transformedItems, pagination.pageSize));
      } else {
        setError(data.error || 'Failed to fetch items');
      }
    } catch (error) {
      console.error('Error fetching catalog items:', error);
      setError('Failed to fetch catalog items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch a specific page of items
   * @param {number} newPage - Page number to fetch
   */
  const fetchItemsPage = async (newPage) => {
    setLoading(true);
    try {
      const data = await api.fetchItemsPage(newPage, pagination.pageSize);
      if (data.success) {
        const transformedItems = processApiItems(data);
        setItems(transformedItems);
        setPagination(updatePagination(data, transformedItems, pagination.pageSize));
      } else {
        setError(data.error || 'Failed to fetch items');
      }
    } catch (error) {
      console.error('Error fetching catalog items:', error);
      setError('Failed to fetch catalog items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchCatalogItems,
    fetchItemsPage
  };
};

export default useDataFetcher;
