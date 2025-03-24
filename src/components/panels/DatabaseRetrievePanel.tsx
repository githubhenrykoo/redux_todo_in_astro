import React, { useState, useEffect } from 'react';
import { Page } from '../../content/model/card-collection';
import { MCard } from '../../content/model/mcard';

interface DatabaseRetrievePanelProps {
  onDataRetrieve?: (data: Page) => void;
}

export const DatabaseRetrievePanel: React.FC<DatabaseRetrievePanelProps> = ({ onDataRetrieve }) => {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  const fetchData = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cards?page=${page}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }

      const data: Page = await response.json();
      setPage(data);
      
      if (onDataRetrieve) {
        onDataRetrieve(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pageNumber);
  }, [pageNumber]);

  const handleNextPage = () => {
    if (page && page.has_next) {
      setPageNumber(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (page && page.has_previous) {
      setPageNumber(prev => prev - 1);
    }
  };

  return (
    <div className="database-retrieve-panel">
      {loading && <div className="text-center">Loading...</div>}
      {error && <div className="text-red-500 text-center">{error}</div>}
      
      {page && (
        <div>
          <h2 className="text-xl font-bold mb-4">Retrieved Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {page.items.map((card: MCard, index: number) => (
              <div 
                key={card.hash || `card-${index}`} 
                className="border p-4 rounded-lg shadow-md"
              >
                <div className="font-semibold">Hash: {card.hash}</div>
                <div className="text-sm text-gray-600">Time: {card.g_time}</div>
                <pre className="mt-2 text-sm overflow-auto max-h-40">
                  {JSON.stringify(card.content, null, 2)}
                </pre>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-4">
            <button 
              onClick={handlePreviousPage} 
              disabled={!page.has_previous}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
            >
              Previous
            </button>
            <div className="text-center">
              Page {page.page_number} of {page.total_pages}
            </div>
            <button 
              onClick={handleNextPage} 
              disabled={!page.has_next}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
