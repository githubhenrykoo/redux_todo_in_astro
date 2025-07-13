import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '../../store.js';
import { SearchBar } from './database/SearchBar.js';
import { ControlBar } from './database/ControlBar.js';
import CardList from './database/CardList.js';
import { Pagination } from './database/Pagination.js';

const MCardPanel = () => {
  // State management
  const [cards, setCards] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch cards with pagination and search
  const fetchCards = async (hash?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (hash) {
        params.append('action', 'get');
        params.append('hash', hash);
      } else {
        params.append('action', 'getPage');
        params.append('pageNumber', currentPage.toString());
        params.append('pageSize', pageSize.toString());
        if (searchTerm) {
          params.append('search', searchTerm);
        }
      }

      const url = `http://localhost:4321/api/card-collection?${params.toString()}`;
      console.log('Fetching cards with URL:', url);
      
      const response = await fetch(url);
      const result = await response.json();
      console.log('API response:', result);
      
      // Process the response
      if (result.success) {
        if (hash && result.card) {
          // Single card response
          setCards({
            items: [{
              hash: result.card.hash || '',
              g_time: result.card.timestamp || new Date().toISOString(),
              content: result.card.content,
              contentType: result.card.contentType
            }],
            total_items: 1,
            serverTimestamp: result.timestamp || new Date().toISOString(),
            retrievalMethod: 'hash'
          });
          setTotalPages(1);
        } else if (result.items) {
          // Page of cards response
          setCards({
            items: result.items.map((item: any) => ({
              hash: item.hash || '',
              g_time: item.timestamp || new Date().toISOString(),
              content: item.content,
              contentType: item.contentType
            })),
            total_items: result.total_items || result.items.length,
            serverTimestamp: result.timestamp || new Date().toISOString()
          });
          setTotalPages(Math.ceil((result.total_items || result.items.length) / pageSize));
        } else {
          console.error('No cards found in response:', result);
          setCards({
            items: [],
            total_items: 0,
            serverTimestamp: new Date().toISOString()
          });
          setTotalPages(1);
        }
      } else {
        console.error('Unexpected API response format:', result);
        setCards(null);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
      setCards(null);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCards();
  }, []); // Only fetch on mount

  // Event handlers
  const handleReset = async () => {
    setSearchTerm('');
    setCurrentPage(1);
    setPageSize(10);
    await fetchCards();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = e.target as HTMLFormElement;
    const term = target.search.value;
    setSearchTerm(term);
    setCurrentPage(1);
    await fetchCards();
  };

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    await fetchCards();
  };

  const handlePageSizeChange = async (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    await fetchCards();
  };

  return (
    <Provider store={store}>
      <div className="flex flex-col h-full bg-gray-100">
        {/* Search and Control Section */}
        <div className="p-4 bg-white border-b border-gray-200">
          <SearchBar 
            onSearch={handleSearch}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
          <ControlBar 
            onPageSizeChange={handlePageSizeChange}
            pageSize={pageSize}
            loading={loading}
            onReset={handleReset}
            setPageSize={setPageSize}
          />
        </div>

        {/* Cards Section */}
        <div className="flex-1 overflow-auto p-4">
          <CardList 
            cards={cards || { items: [], total_items: 0 }}
            loading={loading}
            selectedCardHash=""
            onSelectCard={() => {}}
          />
        </div>

        {/* Pagination Section */}
        <div className="p-4 bg-white border-t border-gray-200">
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            hasNext={currentPage < totalPages}
            hasPrevious={currentPage > 1}
          />
        </div>
      </div>
    </Provider>
  );
};

export default MCardPanel;
