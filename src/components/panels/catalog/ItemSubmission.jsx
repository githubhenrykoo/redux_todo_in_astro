import React from 'react';
import * as api from './api';

/**
 * Custom hook for handling item submission
 * @param {Object} options - Options object
 * @returns {Object} - Actions and state
 */
export const useItemSubmission = ({
  setLoading,
  setError,
  setItems,
  setViewMode
}) => {
  /**
   * Add a new item (text or file)
   * @param {Object} newItemData - The new item data to add
   */
  const handleAddItem = (newItemData) => {
    if (newItemData.file) {
      addFileItem(newItemData);
    } else if (newItemData.description) {
      addTextItem(newItemData);
    }
  };

  /**
   * Add a file item to the catalog
   * @param {Object} newItemData - The new item data
   */
  const addFileItem = async (newItemData) => {
    setLoading(true);
    try {
      const data = await api.addFileItem(newItemData);
      if (data.success) {
        const newCardItem = {
          id: data.hash,
          name: newItemData.name,
          description: newItemData.description || 'Added file',
          category: newItemData.contentType || 'application/octet-stream',
          hash: data.hash,
          timestamp: new Date().toISOString(),
          contentType: { mimeType: newItemData.contentType || 'application/octet-stream' }
        };
        
        setItems(prevItems => [...prevItems, newCardItem]);
        setViewMode('grid');
      } else {
        setError(data.error || 'Failed to add item');
      }
    } catch (error) {
      console.error('Error adding catalog item:', error);
      setError(`Failed to add item: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a text item to the catalog
   * @param {Object} newItemData - The new item data
   */
  const addTextItem = async (newItemData) => {
    setLoading(true);
    try {
      const data = await api.addTextItem(newItemData);
      if (data.success) {
        const newCardItem = {
          id: data.hash,
          name: newItemData.name,
          description: newItemData.description.substring(0, 100) + (newItemData.description.length > 100 ? '...' : ''),
          category: newItemData.contentType || 'text/plain',
          hash: data.hash,
          timestamp: new Date().toISOString(),
          contentType: { mimeType: newItemData.contentType || 'text/plain' }
        };
        
        setItems(prevItems => [...prevItems, newCardItem]);
        setViewMode('grid');
      } else {
        setError(data.error || 'Failed to add item');
      }
    } catch (error) {
      console.error('Error adding catalog item:', error);
      setError(`Failed to add item: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    handleAddItem
  };
};

export default useItemSubmission;
