import React, { useState, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ContentTypeInterpreter } from '../../content/model/interpreter';
import { MCardFromData } from '../../content/model/mcard';
import { useDispatch } from 'react-redux';
import { importCardFromDatabase, updateContent } from '../../features/contentSlice';

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
  const [selectedCard, setSelectedCard] = useState<MCardFromData | null>(null);
  const [viewMode, setViewMode] = useState<'raw' | 'formatted' | 'edit'>('formatted');
  const [panelSizes, setPanelSizes] = useState([50, 50]); // Initial split for card list and details
  const [editableContent, setEditableContent] = useState<string>('');
  const [updateStatus, setUpdateStatus] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

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
    setViewMode('formatted');
    
    // Convert card content to string for editing
    if (typeof card.content === 'object') {
      setEditableContent(JSON.stringify(card.content, null, 2));
    } else {
      setEditableContent(String(card.content));
    }
  };

  // Handle entering edit mode
  const handleEditCard = () => {
    setViewMode('edit');
  };

  // Handle content changes in edit mode
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableContent(e.target.value);
  };

  // Handle saving the edited content
  const handleSaveContent = async () => {
    if (!selectedCard) return;
    
    setUpdateStatus({ status: 'loading', message: 'Updating card...' });
    
    try {
      // Parse content if it's JSON
      let parsedContent: any = editableContent;
      const contentType = detectContentType(selectedCard);
      
      // Check if we're dealing with JSON content
      const isJsonContent = 
        (contentType && 'mimeType' in contentType && contentType.mimeType === 'application/json') ||
        (typeof selectedCard.content === 'object');
      
      if (isJsonContent) {
        try {
          parsedContent = JSON.parse(editableContent);
        } catch (e) {
          throw new Error('Invalid JSON format');
        }
      }
      
      // First, update card in local Redux store
      dispatch(updateContent({
        hash: selectedCard.hash,
        content: parsedContent
      }));
      
      // Also import the card into the local Redux state
      dispatch(importCardFromDatabase({
        card: {
          hash: selectedCard.hash,
          content: parsedContent
        }
      }));
      
      // Then update in the database
      const response = await fetch('/api/update-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hash: selectedCard.hash,
          content: parsedContent
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update card');
      }
      
      // Update the selected card in state by fetching it again
      fetchCards({ hash: selectedCard.hash });
      
      setUpdateStatus({ status: 'success', message: 'Card updated successfully!' });
      setViewMode('formatted');
    } catch (err) {
      setUpdateStatus({ 
        status: 'error', 
        message: err instanceof Error ? err.message : 'Failed to update card' 
      });
      console.error('Error updating card:', err);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    // Reset editable content to the original
    if (selectedCard) {
      if (typeof selectedCard.content === 'object') {
        setEditableContent(JSON.stringify(selectedCard.content, null, 2));
      } else {
        setEditableContent(String(selectedCard.content));
      }
    }
    setViewMode('formatted');
    setUpdateStatus({ status: 'idle', message: '' });
  };

  // Helper function to format content based on type
  const formatContent = (content: any): string => {
    if (typeof content === 'object') {
      return JSON.stringify(content, null, 2);
    }
    return String(content);
  };

  // Helper function to detect content type
  const detectContentType = (card: MCardFromData): ContentType => {
    // First try to use the card's native content type if available
    if (card._content_type) {
      return card._content_type as ContentType;
    }
    
    // Fallback to static detection
    const result = ContentTypeInterpreter.detectContentType(card.content);
    
    // Convert to standardized ContentType
    if (typeof result === 'object' && result !== null) {
      return result as ContentType;
    }
    
    // Default fallback
    return { mimeType: 'text/plain' };
  };

  // Helper function to get a display label for content type
  const getContentTypeLabel = (contentType: ContentType | null) => {
    if (!contentType) return 'Unknown';
    
    // Handle different content type structures
    if (contentType.mimeType) {
      const mime = contentType.mimeType;
      const ext = contentType.extension || '';
      return `${mime}${ext ? ` (.${ext})` : ''}`;
    }
    
    // Fallback to string representation
    return 'Unknown Content Type';
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
    <PanelGroup direction="horizontal" className="h-full w-full">
      <Panel 
        defaultSize={panelSizes[0]} 
        minSize={20} 
        className="bg-white shadow-md rounded-lg p-6 overflow-auto"
      >
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

        {/* Card List */}
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

            <div className="grid grid-cols-1 gap-4 mb-6">
              {cards.items.map((card) => (
                <div
                  key={card.hash}
                  className={`border rounded p-4 cursor-pointer hover:bg-gray-50 ${selectedCard?.hash === card.hash ? 'bg-blue-50 border-blue-300' : ''}`}
                  onClick={() => handleViewCard(card)}
                >
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-blue-600">
                      {card.hash.substring(0, 10)}...
                    </span>
                    <span className="text-gray-500 text-sm">
                      {formatDate(getCardTimestamp(card))}
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
              <div className="flex justify-center items-center gap-2 mb-6">
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

                {/* First page button */}
                {getSlidingPageNumbers(page, cards.total_pages).showStartEllipsis && (
                  <button
                    onClick={() => handlePageChange(1)}
                    className="px-3 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
                  >
                    1
                  </button>
                )}
                
                {/* Start ellipsis */}
                {getSlidingPageNumbers(page, cards.total_pages).showStartEllipsis && (
                  <span className="px-2 text-gray-500">...</span>
                )}

                {/* Sliding page numbers */}
                {getSlidingPageNumbers(page, cards.total_pages).pages.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-1 rounded ${
                      pageNumber === page
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}

                {/* End ellipsis */}
                {getSlidingPageNumbers(page, cards.total_pages).showEndEllipsis && (
                  <span className="px-2 text-gray-500">...</span>
                )}

                {/* Last page button */}
                {getSlidingPageNumbers(page, cards.total_pages).showEndEllipsis && (
                  <button
                    onClick={() => handlePageChange(cards.total_pages)}
                    className="px-3 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
                  >
                    {cards.total_pages}
                  </button>
                )}

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
      </Panel>

      <PanelResizeHandle 
        className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors cursor-col-resize" 
      />

      <Panel 
        defaultSize={panelSizes[1]} 
        minSize={20} 
        className="bg-white shadow-md rounded-lg p-6 overflow-auto"
      >
        {/* Selected Card Detail View */}
        {selectedCard ? (
          <div>
            <h3 className="text-xl font-semibold mb-4">Card Details</h3>
            
            <div className="mb-4">
              <div className="flex justify-between">
                <div>
                  <span className="font-medium">Hash: </span>
                  <span className="font-mono">{selectedCard.hash}</span>
                </div>
                <div className="flex gap-2">
                  {viewMode !== 'edit' && (
                    <button
                      onClick={handleEditCard}
                      className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                    >
                      Edit
                    </button>
                  )}
                  {viewMode !== 'edit' && (
                    <button
                      onClick={() => setViewMode(viewMode === 'raw' ? 'formatted' : 'raw')}
                      className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                    >
                      {viewMode === 'raw' ? 'Formatted View' : 'Raw View'}
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <span className="font-medium">Created: </span>
              <span>{formatDate(getCardTimestamp(selectedCard))}</span>
            </div>
            
            <div className="mb-4">
              <span className="font-medium">Content Type: </span>
              <span>{getContentTypeLabel(detectContentType(selectedCard))}</span>
            </div>
            
            {/* Update Status Message */}
            {updateStatus.status !== 'idle' && (
              <div className={`mb-4 p-3 rounded ${
                updateStatus.status === 'loading' ? 'bg-blue-100 text-blue-800' :
                updateStatus.status === 'success' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {updateStatus.message}
              </div>
            )}
            
            <div className="mb-4">
              <div className="font-medium mb-2">Content:</div>
              {viewMode === 'edit' ? (
                <div>
                  <textarea
                    value={editableContent}
                    onChange={handleContentChange}
                    className="w-full h-64 font-mono text-sm p-4 border rounded"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveContent}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      disabled={updateStatus.status === 'loading'}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 font-mono text-sm">
                  {viewMode === 'raw' 
                    ? typeof selectedCard.content === 'object' 
                      ? JSON.stringify(selectedCard.content)
                      : String(selectedCard.content)
                    : formatContent(selectedCard.content)
                  }
                </pre>
              )}
            </div>
            
            {viewMode !== 'edit' && (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => {
                    const content = typeof selectedCard.content === 'object' 
                      ? JSON.stringify(selectedCard.content, null, 2)
                      : String(selectedCard.content);
                    navigator.clipboard.writeText(content);
                    alert('Content copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Copy Content
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedCard.hash);
                    alert('Hash copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Copy Hash
                </button>
                <button
                  onClick={() => {
                    // Import the card into Redux
                    dispatch(importCardFromDatabase({ 
                      card: {
                        hash: selectedCard.hash,
                        content: selectedCard.content,
                        metadata: {},
                        relationships: {
                          parentHash: null,
                          childHashes: [],
                          relatedHashes: []
                        }
                      }
                    }));
                    alert('Card imported to local state!');
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Import to Redux
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a card to view details
          </div>
        )}
      </Panel>
    </PanelGroup>
  );
};
