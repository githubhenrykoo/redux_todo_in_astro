import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { importCardFromDatabase, selectContent } from '../../features/contentSlice.js';
import { selectItem } from '../../features/selectedItemSlice.js';

// Import our new components
import { SearchBar } from './database/SearchBar.js';
import { HashLookup } from './database/HashLookup.js';
import { ControlBar } from './database/ControlBar.js';
import CardList from './database/CardList.js';
import { Pagination } from './database/Pagination.js';

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

const DatabaseRetrievePanel: React.FC = () => {
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
      
      if (data.success) {
        setCards(data);
        // Clear selected card when fetching new cards
        setSelectedCardHash(null);
      } else {
        throw new Error(data.error || 'Failed to fetch cards');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching cards:', err);
      setCards(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      fetchCards({ search: searchTerm, page: 1, pageSize });
    }
  };

  // Handle hash lookup form submission
  const handleHashLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (hashValue.trim()) {
      fetchCardByHash(hashValue.trim());
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
  const handleSelectCard = async (card: MCardFromData) => {
    // Toggle selection if clicking the same card
    if (selectedCardHash === card.hash) {
      setSelectedCardHash(null);
      return;
    }
    
    setSelectedCardHash(card.hash);
    
    // If we already have content, use it directly
    if (card.content !== undefined) {
      console.log("Using existing card content");
      
      // Get content type directly from server response
      const serverContentType = card.contentType;
      console.log("Server-provided content type:", serverContentType);
      
      // Extract a simple content type string for the UI
      const simpleType = serverContentType?.extension || 
                       (serverContentType?.mimeType ? getSimpleContentType(serverContentType.mimeType) : null) || 
                       "txt";
      
      console.log("Using content type:", simpleType);
      
      // Process the content based on its type
      dispatch(selectItem({
        item: card.content,
        hash: card.hash,
        contentType: simpleType,
        gtime: card.g_time
      }));
    } else {
      // Otherwise fetch the full card details
      console.log("Fetching full card details");
      await fetchCardDetails(card.hash);
    }
  };

  // Function to fetch the full card details
  const fetchCardDetails = async (hash: string) => {
    try {
      // Make the API request using the card-collection GET endpoint with full=true to get content
      const response = await fetch(`/api/card-collection?action=get&hash=${hash}&full=true`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch card details');
      }
      
      const data = await response.json();
      
      if (data.success && data.card) {
        console.log("Fetched card details:", data.card);
        
        // Get content type directly from server response
        const serverContentType = data.card.contentType;
        
        // Extract a simple content type string for the UI
        const simpleType = serverContentType?.extension || 
                           (serverContentType?.mimeType ? getSimpleContentType(serverContentType.mimeType) : null) || 
                           "txt";
        
        console.log("Using server-provided content type:", simpleType);
        
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

export default DatabaseRetrievePanel;
