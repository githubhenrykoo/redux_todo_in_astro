import React, { useState, useEffect } from 'react';
import { ContentTypeInterpreter } from '../../content/model/interpreter';
import { MCardFromData } from '../../content/model/mcard';

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

export const DatabaseRetrievePanel: React.FC = () => {
  const [cards, setCards] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [hashValue, setHashValue] = useState('');
  const [selectedCard, setSelectedCard] = useState<MCardFromData | null>(null);
  const [viewMode, setViewMode] = useState<'raw' | 'formatted'>('formatted');

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
      setSelectedCard(null);
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

  // Handle viewing card details
  const handleViewCard = (card: MCardFromData) => {
    setSelectedCard(card);
  };

  // Helper function to format content based on type
  const formatContent = (content: any): string => {
    if (typeof content === 'object') {
      return JSON.stringify(content, null, 2);
    }
    return String(content);
  };

  // Helper function to detect content type
  const detectContentType = (card: MCardFromData) => {
    // First try to use the card's native content type if available
    if (card._content_type) {
      return card._content_type;
    }
    
    // Fallback to static detection
    return ContentTypeInterpreter.detectContentType(card.content);
  };

  // Helper function to get a display label for content type
  const getContentTypeLabel = (contentType: any) => {
    if (!contentType) return 'Unknown';
    
    // Handle different content type structures
    if (contentType.mimeType) {
      const mime = contentType.mimeType;
      const ext = contentType.extension || '';
      return `${mime}${ext ? ` (.${ext})` : ''}`;
    }
    
    // Fallback to string representation
    return String(contentType);
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      {/* Search and Hash Lookup Forms */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by content..."
              className="flex-1 px-4 py-2 border rounded"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={loading}
            >
              Search
            </button>
          </div>
        </form>

        <form onSubmit={handleHashLookup} className="flex-1">
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              value={hashValue}
              onChange={(e) => setHashValue(e.target.value)}
              placeholder="Lookup by hash..."
              className="flex-1 px-4 py-2 border rounded"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={loading}
            >
              Lookup
            </button>
          </div>
        </form>
      </div>

      {/* Reset and Page Size Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <button
          onClick={() => {
            setSearchTerm('');
            setHashValue('');
            setPage(1);
            fetchCards({ page: 1, pageSize });
          }}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mb-2 md:mb-0"
          disabled={loading}
        >
          Reset
        </button>
        
        <div className="flex items-center">
          <span className="mr-2">Items per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              setPageSize(newSize);
              setPage(1); // Reset to first page when changing page size
              
              // Refetch with new page size
              if (searchTerm) {
                fetchCards({ search: searchTerm, page: 1, pageSize: newSize });
              } else {
                fetchCards({ page: 1, pageSize: newSize });
              }
            }}
            className="px-2 py-1 border rounded"
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
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Results Display */}
      {cards && cards.items.length > 0 ? (
        <div>
          {/* Results Summary */}
          <div className="mb-4">
            <p className="text-gray-700">
              {cards.retrievalMethod === 'hash'
                ? 'Card found by hash'
                : `Showing ${cards.items.length} of ${cards.total_items} cards`}
              {cards.serverTimestamp && ` (as of ${formatDate(cards.serverTimestamp)})`}
            </p>
          </div>

          {/* Card List */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            {cards.items.map((card) => (
              <div
                key={card.hash}
                className="border rounded p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => handleViewCard(card)}
              >
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-blue-600">
                    {card.hash.substring(0, 10)}...
                  </span>
                  <span className="text-gray-500 text-sm">
                    {formatDate(card.g_time)}
                  </span>
                </div>
                <div className="text-gray-700 truncate">
                  {typeof card.content === 'object'
                    ? '{...}'
                    : String(card.content).substring(0, 80)}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {cards.total_pages > 1 && (
            <div className="flex justify-center gap-2 mb-6">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={!cards.has_previous}
                className={`px-3 py-1 rounded ${
                  cards.has_previous
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {cards.page_number} of {cards.total_pages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={!cards.has_next}
                className={`px-3 py-1 rounded ${
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
          <div className="text-center text-gray-500 py-8">
            {cards ? 'No cards found' : 'Enter search terms or fetch cards'}
          </div>
        )
      )}

      {/* Selected Card Detail View */}
      {selectedCard && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-xl font-semibold mb-4">Card Details</h3>
          
          <div className="mb-4">
            <div className="flex justify-between">
              <div>
                <span className="font-medium">Hash: </span>
                <span className="font-mono">{selectedCard.hash}</span>
              </div>
              <div>
                <button
                  onClick={() => setViewMode(viewMode === 'raw' ? 'formatted' : 'raw')}
                  className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                >
                  {viewMode === 'raw' ? 'Formatted View' : 'Raw View'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <span className="font-medium">Created: </span>
            <span>{formatDate(selectedCard.g_time)}</span>
          </div>
          
          <div className="mb-4">
            <span className="font-medium">Content Type: </span>
            <span>{getContentTypeLabel(detectContentType(selectedCard))}</span>
          </div>
          
          <div className="mb-4">
            <div className="font-medium mb-2">Content:</div>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 font-mono text-sm">
              {viewMode === 'raw' 
                ? typeof selectedCard.content === 'object' 
                  ? JSON.stringify(selectedCard.content)
                  : String(selectedCard.content)
                : formatContent(selectedCard.content)
              }
            </pre>
          </div>
          
          <div className="mt-2">
            <button
              onClick={() => {
                const content = typeof selectedCard.content === 'object' 
                  ? JSON.stringify(selectedCard.content, null, 2)
                  : String(selectedCard.content);
                navigator.clipboard.writeText(content);
                // You could add a toast notification here
              }}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Copy Content
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
