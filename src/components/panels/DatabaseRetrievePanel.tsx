import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { importCardFromDatabase, selectContent } from '../../features/contentSlice';
import { selectItem } from '../../features/selectedItemSlice';

// Import our new components
import { SearchBar } from './database/SearchBar';
import { HashLookup } from './database/HashLookup';
import { ControlBar } from './database/ControlBar';
import { CardList } from './database/CardList';
import { Pagination } from './database/Pagination';

interface PageData {
  items: MCardFromData[];
  total_items: number;
  page_number: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  total_pages: number;
  previous_page: number | null;
  next_page: number | null;
  serverTimestamp?: string;
  retrievalMethod?: string;
}

interface MCardFromData {
  hash: string;
  g_time: string;
  content?: any;
  contentType?: {
    mimeType: string;
    extension: string;
    isBlob: boolean;
    isValid: boolean;
  };
}

export const DatabaseRetrievePanel: React.FC = () => {
  const dispatch = useDispatch();
  const [cards, setCards] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [hashValue, setHashValue] = useState('');
  const [selectedCardHash, setSelectedCardHash] = useState<string | null>(null);

  // Function to fetch card by hash
  const fetchCardByHash = async (hash: string) => {
    try {
      setLoading(true);
      setError(null);

      // Make the API request using the card-collection GET endpoint with contentType=true to get enough info for content type detection
      const response = await fetch(`/api/card-collection?action=get&hash=${hash}&contentType=true`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch card');
      }

      const data = await response.json();
      
      if (data.success && data.card) {
        // Format the response to match PageData interface
        setCards({
          items: [data.card],
          total_items: 1,
          page_number: 1,
          page_size: 1,
          has_next: false,
          has_previous: false,
          total_pages: 1,
          next_page: null,
          previous_page: null,
          retrievalMethod: 'hash'
        });
        
        // Clear selected card when fetching new cards
        setSelectedCardHash(null);
      } else {
        throw new Error(data.error || 'Card not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching card by hash:', err);
      setCards(null);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch cards (page or search)
  const fetchCards = async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      // Build the query parameters
      const queryParams = new URLSearchParams();
      // Using the existing /api/retrieve endpoint for pagination and search
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      
      // Add contentType flag to retrieve enough info for content type detection
      queryParams.append('contentType', 'true');

      // Make the API request to the original retrieve endpoint
      const response = await fetch(`/api/retrieve?${queryParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch cards');
      }

      const data = await response.json();
      
      // The retrieve endpoint returns PageData directly
      setCards(data);
      
      // Clear selected card when fetching new cards
      setSelectedCardHash(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching cards:', err);
      setCards(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchCards({ page, pageSize });
  }, []);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm) {
      setPage(1); // Reset to first page when searching
      fetchCards({ search: searchTerm, page: 1, pageSize });
    }
  };

  // Handle hash lookup form submission
  const handleHashLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (hashValue) {
      fetchCardByHash(hashValue);
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (searchTerm) {
      fetchCards({ search: searchTerm, page: newPage, pageSize });
    } else {
      fetchCards({ page: newPage, pageSize });
    }
  };

  // Handle selecting a card
  const handleSelectCard = (card: MCardFromData) => {
    setSelectedCardHash(card.hash);
    
    // Log the card details to see what's actually available
    console.log("Selected card:", card);
    console.log("Content type from card:", card.contentType);
    
    // Determine the simple content type
    const simpleType = card.contentType?.extension || 
                      getSimpleContentType(card.contentType?.mimeType) || 
                      "txt";
    
    console.log("Simple content type determined:", simpleType);
    
    // Process the content based on its format
    let processedContent = card.content;
    
    // Check if content is in base64 format from API
    if (card.content && typeof card.content === 'object' && card.content.type === 'base64') {
      console.log("Content is in base64 format, original type:", card.content.originalType);
      // Keep as is - components will handle base64 format
      processedContent = card.content;
    } else if (card.content && typeof card.content === 'object' && card.content.type === 'Buffer') {
      // For backward compatibility, if we still get Buffer JSON format
      console.log("Content is in Buffer JSON format");
      processedContent = card.content;
    } else {
      // String or other format, keep as is
      console.log("Content is in format:", typeof card.content);
    }
    
    // Import only the hash to Redux store
    dispatch(importCardFromDatabase({ 
      hash: card.hash,
      content: processedContent,
      metadata: {
        contentType: card.contentType
      },
      relationships: {
        parentHash: null,
        childHashes: [],
        relatedHashes: []
      }
    }));
    
    // Select the card in Redux
    dispatch(selectContent(card.hash));
    
    // Update the selectedItem state with card details
    dispatch(selectItem({
      item: processedContent,
      hash: card.hash,
      contentType: simpleType,
      gtime: card.g_time
    }));
    
    // If we don't have the content yet, fetch the full card to get content and details
    if (!card.content) {
      fetchCardDetails(card.hash);
    }
  };
  
  // Function to fetch the full card details 
  const fetchCardDetails = async (hash: string) => {
    try {
      // Use the card-collection API to get full card details
      const response = await fetch(`/api/card-collection?action=get&hash=${hash}&full=true`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch card details');
      }
      
      const data = await response.json();
      
      if (data.success && data.card) {
        console.log("Fetched card details:", data.card);
        
        // Determine the simple content type
        const simpleType = data.card.contentType?.extension || 
                          getSimpleContentType(data.card.contentType?.mimeType) || 
                          "txt";
        
        console.log("Simple content type for fetched card:", simpleType);
        
        // Update the selectedItem with the full content and metadata
        dispatch(selectItem({
          item: data.card.content,
          hash: data.card.hash,
          contentType: simpleType,
          gtime: data.card.g_time
        }));
      }
    } catch (err) {
      console.error('Error fetching card details:', err);
    }
  };

  // Helper function to extract a simple content type from MIME type
  const getSimpleContentType = (mimeType?: string): string | null => {
    if (!mimeType) return null;
    
    // Extract the subtype from the MIME type
    const parts = mimeType.split('/');
    if (parts.length < 2) return null;
    
    const subtype = parts[1];
    
    // Handle special cases
    if (subtype.includes('json')) return 'json';
    if (subtype.includes('javascript')) return 'js';
    if (subtype === 'plain') return 'txt';
    if (subtype === 'html') return 'html';
    if (subtype === 'css') return 'css';
    if (subtype === 'svg+xml') return 'svg';
    
    // Return the subtype as-is for common formats (gif, png, jpg, etc.)
    return subtype;
  };

  // Handle reset
  const handleReset = () => {
    setSearchTerm('');
    setHashValue('');
    setPage(1);
    fetchCards({ page: 1, pageSize });
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    if (searchTerm) {
      fetchCards({ search: searchTerm, page: 1, pageSize: newSize });
    } else {
      fetchCards({ page: 1, pageSize: newSize });
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full bg-background">
      {/* Header Section */}
      <div className="flex-none p-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col gap-2">
          <SearchBar 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearch={handleSearch}
            loading={loading}
          />
          <HashLookup 
            hashValue={hashValue}
            setHashValue={setHashValue}
            onLookup={handleHashLookup}
            loading={loading}
          />
        </div>
      </div>

      {/* Controls Section */}
      <ControlBar 
        onReset={handleReset}
        pageSize={pageSize}
        setPageSize={setPageSize}
        onPageSizeChange={handlePageSizeChange}
        loading={loading}
      />

      {/* Error Display */}
      {error && (
        <div className="flex-none bg-red-100 border-l-4 border-red-500 text-red-700 p-2 text-sm">
          <p>{error}</p>
        </div>
      )}

      {/* Card List with Overflow */}
      <div className="flex-1 overflow-y-auto">
        <CardList 
          cards={cards}
          selectedCardHash={selectedCardHash}
          onSelectCard={handleSelectCard}
          loading={loading}
        />
        
        {cards && cards.total_pages > 1 && (
          <div className="pb-4">
            <Pagination
              currentPage={page}
              totalPages={cards.total_pages}
              hasNext={cards.has_next}
              hasPrevious={cards.has_previous}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};
