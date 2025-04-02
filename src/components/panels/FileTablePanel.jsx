'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FileTypeIcon } from '../ui/icons/FileTypeIcon';
import { ContentTypeInterpreter } from '../../content/model/content_type_detector';
import { selectItem, updateContentType } from '../../features/selectedItemSlice';

const FileTablePanel = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [retrievedCards, setRetrievedCards] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: 'g_time', direction: 'desc' });
  
  const selectedHash = useSelector(state => state?.selectedItem?.metadata?.hash || 'null');
  const dispatch = useDispatch();

  // Fetch cards on mount and when search query changes
  useEffect(() => {
    fetchCards();
  }, [searchQuery]);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) {
        queryParams.append('query', searchQuery);
      }
      
      const response = await fetch(`/api/retrieve?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process retrieved cards to detect content types
      const processedCards = await Promise.all(data.items.map(async (card) => {
        // Skip processing if the card already has a well-detected content type
        if (card.contentType && card.contentType.isValid) {
          return card;
        }
        
        try {
          // Apply content type detection
          const contentType = await detectContentType(card.content);
          return {
            ...card,
            contentType: {
              ...contentType,
              detectionMethod: 'client-table',
            }
          };
        } catch (error) {
          console.error("Error detecting content type:", error);
          return card;
        }
      }));
      
      setRetrievedCards(processedCards);
      setTotalCount(data.total_items || processedCards.length);
    } catch (error) {
      console.error("Error fetching cards:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to detect content type from content data
  const detectContentType = async (content) => {
    // If content is null or undefined
    if (!content) {
      return { 
        mimeType: 'application/octet-stream', 
        extension: 'bin',
        isValid: false,
        isBlob: false,
      };
    }
    
    // If we have Buffer JSON, convert it for checking
    let contentForDetection = content;
    let decodedText = null;
    
    if (content && typeof content === 'object' && content.type === 'Buffer' && Array.isArray(content.data)) {
      try {
        // Convert to Uint8Array for content-based detection
        const array = new Uint8Array(content.data);
        
        // Also try to decode as text to check for textual content
        decodedText = new TextDecoder().decode(array);
        
        // Create a ContentTypeInterpreter instance for detection
        const interpreter = new ContentTypeInterpreter();
        const detectedType = interpreter.detectContentType(array);
        
        // If a specific type was detected, return it
        if (detectedType && detectedType.mimeType !== 'application/octet-stream') {
          return {
            ...detectedType,
            isValid: true,
            decodedText: decodedText,
          };
        }
        
        // Text detection based on character analysis
        const printableChars = decodedText.match(/[\x20-\x7E\n\r\t]/g) || [];
        const ratio = printableChars.length / decodedText.length;
        
        // If high ratio of printable characters, it's likely text
        if (decodedText.length > 0 && ratio > 0.8) {
          console.log("High printable character ratio:", ratio.toFixed(2));
          return {
            mimeType: 'text/plain',
            extension: 'txt',
            isValid: true,
            decodedText: decodedText,
          };
        }
        
        // Return binary type as fallback
        return {
          mimeType: 'application/octet-stream',
          extension: 'bin',
          isValid: true,
          isBlob: true,
        };
      } catch (error) {
        console.error("Error processing Buffer data:", error);
      }
    }
    
    // String content is treated as text
    if (typeof content === 'string') {
      // Check for JSON format
      try {
        JSON.parse(content);
        return {
          mimeType: 'application/json',
          extension: 'json',
          isValid: true,
        };
      } catch {
        // Not JSON, treat as plain text
        return {
          mimeType: 'text/plain',
          extension: 'txt',
          isValid: true,
        };
      }
    }
    
    // Process other object types
    if (typeof content === 'object') {
      return {
        mimeType: 'application/json',
        extension: 'json',
        isValid: true,
      };
    }
    
    // Fallback
    return {
      mimeType: 'application/octet-stream',
      extension: 'bin',
      isValid: false,
    };
  };

  // Handle row selection
  const handleSelectCard = (card) => {
    console.log("Selected card:", card.hash, "Content type:", card.contentType);
    
    // For image content, prepare it for display
    let processedContent = card.content;
    let contentType = card.contentType?.mimeType || 'application/octet-stream';
    
    // Special handling for Buffer content
    if (card.content && typeof card.content === 'object' && card.content.type === 'Buffer' && Array.isArray(card.content.data)) {
      // If it's an image, convert to a base64 data URL for direct display
      if (contentType.startsWith('image/')) {
        try {
          const array = new Uint8Array(card.content.data);
          const base64 = btoa(String.fromCharCode.apply(null, array));
          processedContent = `data:${contentType};base64,${base64}`;
          console.log("Converted image to data URL for display");
        } catch (error) {
          console.error("Error converting image to data URL:", error);
        }
      }
      
      // For text content that's in Buffer format
      if (contentType === 'text/plain' && card.contentType?.decodedText) {
        processedContent = card.contentType.decodedText;
        console.log("Using decoded text content");
      }
    }
    
    dispatch(selectItem({
      item: processedContent,
      hash: card.hash,
      contentType: contentType,
      gtime: card.g_time
    }));
  };

  // Handle sorting
  const requestSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  // Apply sorting to cards
  const sortedCards = React.useMemo(() => {
    if (!sortConfig.key) return retrievedCards;
    
    return [...retrievedCards].sort((a, b) => {
      // Null handling
      if (a[sortConfig.key] === null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (b[sortConfig.key] === null) return sortConfig.direction === 'asc' ? 1 : -1;
      
      // String comparison
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [retrievedCards, sortConfig]);

  // Function to get the sort indicator icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Search and Controls */}
      <div className="flex items-center gap-2 p-3 border-b border-neutral-200 dark:border-neutral-800">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search cards..."
          className="flex-1 px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent"
        />
        <button 
          onClick={fetchCards}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Search
        </button>
        <button 
          onClick={() => setSearchQuery('')}
          className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Results Summary */}
      <div className="px-4 py-2 text-sm">
        <span className="text-gray-500">
          {loading ? 'Loading...' : `Showing ${retrievedCards.length} of ${totalCount} cards`}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
          <thead className="bg-neutral-50 dark:bg-neutral-900">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('hash')}
              >
                Hash {getSortIcon('hash')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('g_time')}
              >
                G-Time {getSortIcon('g_time')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Type
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Size
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {sortedCards.map((card) => (
              <tr 
                key={card.hash}
                className={`hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer ${
                  selectedHash === card.hash ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                onClick={() => handleSelectCard(card)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {card.hash.substring(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {card.g_time || 'No timestamp'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileTypeIcon 
                      mimeType={card.contentType?.mimeType} 
                      extension={card.contentType?.extension}
                      size={20}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      {card.contentType?.mimeType.split('/')[1] || 'unknown'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {card.content?.data?.length ? `${card.content.data.length} bytes` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Loading Indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default FileTablePanel;
