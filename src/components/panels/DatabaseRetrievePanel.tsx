import React, { useState, useEffect } from 'react';
import { ContentTypeInterpreter } from '../../content/model/interpreter';
import { MCardFromData } from '../../content/model/mcard';
import { useDispatch } from 'react-redux';
import { importCardFromDatabase, selectContent } from '../../features/contentSlice';

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

// Interface to better represent the content type
interface ContentType {
  mimeType?: string;
  extension?: string;
  isValid?: boolean;
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

  // Function to fetch cards
  const fetchCards = async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    hash?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      // Build the query parameters
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.hash) queryParams.append('hash', params.hash);

      // Make the API request
      const response = await fetch(`/api/retrieve?${queryParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch cards');
      }

      const data = await response.json();
      setCards(data);
      
      // Clear selected card when fetching new cards
      setSelectedCardHash(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching cards:', err);
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
      fetchCards({ hash: hashValue });
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
    
    // Import the card to Redux store
    dispatch(importCardFromDatabase({ 
      hash: card.hash,
      content: card.content,
      metadata: {},
      relationships: {
        parentHash: null,
        childHashes: [],
        relatedHashes: []
      }
    }));
    
    // Select the card in Redux
    dispatch(selectContent(card.hash));
  };

  // Helper function to format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return 'N/A';
    }
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      return date.toLocaleString();
    } catch (e) {
      return 'N/A';
    }
  };

  // Helper function to get timestamp from card
  const getCardTimestamp = (card: MCardFromData) => {
    // Try g_time first (if it exists and is valid)
    if (card.g_time) {
      return card.g_time;
    }
    
    // Try to extract timestamp from content if it's a JSON object
    if (typeof card.content === 'object' && card.content !== null) {
      // Look for __stateTimestamp in the content object
      if (card.content.__stateTimestamp) {
        return card.content.__stateTimestamp;
      }
    }
    
    // If content is a string, try to parse it as JSON to find timestamp
    if (typeof card.content === 'string') {
      try {
        const parsedContent = JSON.parse(card.content);
        if (parsedContent.__stateTimestamp) {
          return parsedContent.__stateTimestamp;
        }
      } catch (e) {
        // Not valid JSON, ignore
      }
    }
    
    return null;
  };

  // Sliding pagination function
  const getSlidingPageNumbers = (currentPage: number, totalPages: number, windowSize: number = 5) => {
    // Ensure window size is odd for symmetry
    const adjustedWindowSize = windowSize % 2 === 0 ? windowSize + 1 : windowSize;
    const halfWindow = Math.floor(adjustedWindowSize / 2);

    let startPage = Math.max(1, currentPage - halfWindow);
    let endPage = Math.min(totalPages, startPage + adjustedWindowSize - 1);

    // Adjust start page if we're near the end
    if (endPage === totalPages) {
      startPage = Math.max(1, totalPages - adjustedWindowSize + 1);
    }

    // Create an array of page numbers to display
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return {
      pages,
      showStartEllipsis: startPage > 1,
      showEndEllipsis: endPage < totalPages
    };
  };

  return (
    <div className="flex flex-col h-full max-h-full bg-background">
      {/* Header Section */}
      <div className="flex-none p-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col gap-2">
          <form onSubmit={handleSearch} className="w-full">
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by content..."
                className="flex-1 min-w-0 px-3 py-1 border rounded text-sm"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm whitespace-nowrap"
                disabled={loading}
              >
                Search
              </button>
            </div>
          </form>

          <form onSubmit={handleHashLookup} className="w-full">
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={hashValue}
                onChange={(e) => setHashValue(e.target.value)}
                placeholder="Lookup by hash..."
                className="flex-1 min-w-0 px-3 py-1 border rounded text-sm"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm whitespace-nowrap"
                disabled={loading}
              >
                Lookup
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex-none flex items-center justify-between p-2 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => {
            setSearchTerm('');
            setHashValue('');
            setPage(1);
            fetchCards({ page: 1, pageSize });
          }}
          className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          disabled={loading}
        >
          Reset
        </button>
        
        <div className="flex items-center">
          <span className="mr-2 text-sm">Items:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              setPageSize(newSize);
              setPage(1);
              
              if (searchTerm) {
                fetchCards({ search: searchTerm, page: 1, pageSize: newSize });
              } else {
                fetchCards({ page: 1, pageSize: newSize });
              }
            }}
            className="px-2 py-1 border rounded text-sm"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex-none bg-red-100 border-l-4 border-red-500 text-red-700 p-2 text-sm">
          <p>{error}</p>
        </div>
      )}

      {/* Card List with Overflow */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {cards && cards.items.length > 0 ? (
          <div className="p-4">
            {/* Results Summary */}
            <div className="mb-2">
              <p className="text-sm text-gray-700">
                {cards.retrievalMethod === 'hash'
                  ? 'Card found by hash'
                  : `Showing ${cards.items.length} of ${cards.total_items} cards`}
                {cards.serverTimestamp && ` (as of ${formatDate(cards.serverTimestamp)})`}
              </p>
            </div>

            <div className="space-y-2 mb-4">
              {cards.items.map((card) => (
                <div
                  key={card.hash}
                  className={`border rounded p-3 cursor-pointer hover:bg-gray-50 ${selectedCardHash === card.hash ? 'bg-blue-50 border-blue-300' : ''}`}
                  onClick={() => handleSelectCard(card)}
                >
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-blue-600 text-sm">
                      {card.hash.substring(0, 8)}...
                    </span>
                    <span className="text-gray-500 text-xs">
                      {formatDate(getCardTimestamp(card))}
                    </span>
                  </div>
                  <div className="text-gray-700 text-sm truncate">
                    {typeof card.content === 'object'
                      ? '{...}'
                      : String(card.content).substring(0, 60)}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {cards.total_pages > 1 && (
              <div className="flex justify-center items-center gap-1 text-sm">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={!cards.has_previous}
                  className={`px-2 py-1 rounded ${
                    cards.has_previous
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Prev
                </button>

                {getSlidingPageNumbers(page, cards.total_pages, 3).pages.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-2 py-1 rounded ${
                      pageNumber === page
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!cards.has_next}
                  className={`px-2 py-1 rounded ${
                    cards.has_next
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          !loading && (
            <div className="text-center text-gray-500 p-4">
              {cards ? 'No cards found' : 'Enter search terms or fetch cards'}
            </div>
          )
        )}
      </div>
    </div>
  );
};
