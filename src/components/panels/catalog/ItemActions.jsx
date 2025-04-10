import React from 'react';
import { useDispatch } from 'react-redux';
import { importCardFromDatabase, selectContent } from '../../../features/contentSlice';
import { selectItem } from '../../../features/selectedItemSlice';
import { processContentForDisplay } from './dataHelpers';
import { getSimpleContentType } from './utils';
import * as api from './api';

/**
 * Custom hook for handling item-related actions
 * @param {Object} options - Options object
 * @returns {Object} - Actions and state
 */
export const useItemActions = ({
  setViewMode,
  setSelectedItem,
  setItemLoading,
  setItemError,
  setItems,
  selectedItem
}) => {
  const dispatch = useDispatch();

  /**
   * Select an item by ID and load its details
   * @param {Object} item - The item to select
   */
  const handleSelectItem = async (item) => {
    setItemLoading(true);
    setViewMode('detail');
    
    try {
      const data = await api.getItemByHash(item.id);
      if (data.success) {
        const cardData = data.card;
        const serverContentType = cardData.contentType;
        const simpleType = serverContentType?.extension || 
                     (serverContentType?.mimeType ? getSimpleContentType(serverContentType.mimeType) : null) || 
                     "txt";
        
        // Process content for display
        let description = processContentForDisplay(cardData.content);
        
        setSelectedItem({
          id: cardData.hash,
          name: cardData.hash.substring(0, 8),
          category: cardData.contentType?.mimeType || 'Unknown',
          description: description,
          hash: cardData.hash,
          content: cardData.content,
          timestamp: cardData.timestamp || new Date().toISOString(),
          contentType: cardData.contentType
        });
        
        // Update Redux store
        dispatch(importCardFromDatabase({ 
          hash: cardData.hash,
          content: cardData.content,
          metadata: { contentType: serverContentType },
          relationships: { parentHash: null, childHashes: [], relatedHashes: [] }
        }));
        
        dispatch(selectContent(cardData.hash));
        dispatch(selectItem({
          item: cardData.content,
          hash: cardData.hash,
          contentType: simpleType,
          gtime: cardData.timestamp
        }));
      } else {
        setItemError(data.error || 'Failed to fetch card');
      }
    } catch (error) {
      console.error('Error fetching card by ID:', error);
      setItemError('Failed to fetch card. Please try again.');
    } finally {
      setItemLoading(false);
    }
  };

  /**
   * Delete an item by ID
   * @param {string} id - The item ID to delete
   */
  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const data = await api.deleteItemByHash(id);
        if (data.success) {
          setItems(prevItems => prevItems.filter(item => item.id !== id));
          if (selectedItem && selectedItem.id === id) {
            setSelectedItem(null);
            setViewMode('grid');
          }
        } else {
          setItemError(data.error || 'Failed to delete item');
        }
      } catch (error) {
        console.error('Error deleting catalog item:', error);
        setItemError('Failed to delete item. Please try again.');
      }
    }
  };

  return {
    handleSelectItem,
    handleDeleteItem
  };
};

export default useItemActions;
