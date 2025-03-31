import React, { useState } from 'react';

interface CardData {
  content?: any;
  hash?: string;
  g_time?: string;
  [key: string]: any;
}

interface CardResponse {
  error?: string;
  serverTimestamp?: string;
  success?: boolean;
  card?: CardData;
}

export const CardViewer: React.FC = () => {
  const [hash, setHash] = useState('');
  const [card, setCard] = useState<CardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [serverTimestamp, setServerTimestamp] = useState<string | null>(null);

  const fetchCard = async () => {
    if (!hash.trim()) {
      setError('Please enter a hash value');
      return;
    }

    setLoading(true);
    setError(null);
    setCard(null);
    setAvailableSections([]);
    setSelectedSection(null);
    setServerTimestamp(null);

    try {
      console.log('Fetching card with hash:', hash);
      const response = await fetch(`/api/card-collection?action=get&hash=${encodeURIComponent(hash)}`);
      const data: CardResponse = await response.json();
      console.log('Card fetch response:', data);

      if (response.ok && !data.error) {
        // For the new API, the card data is nested under a 'card' property when successful
        if (data.success && data.card) {
          setCard(data.card);
          setServerTimestamp(data.serverTimestamp || null);
          
          // Extract available sections from the content
          if (data.card.content) {
            const sections = Object.keys(data.card.content);
            setAvailableSections(sections);
            
            // Select the first section by default if available
            if (sections.length > 0) {
              setSelectedSection(sections[0]);
            }
          } else {
            setAvailableSections([]);
            setSelectedSection(null);
          }
        } else {
          // Handle case where API returns success:false but HTTP status is 200
          setError(data.error || 'Card not found');
        }
      } else {
        setError(data.error || 'Failed to retrieve card');
      }
    } catch (err) {
      console.error('Error fetching card:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <div className="mb-4">
        <label htmlFor="hash" className="block text-sm font-medium text-gray-700 mb-1">Card Hash</label>
        <div className="flex">
          <input
            type="text"
            id="hash"
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter card hash"
          />
          <button 
            onClick={fetchCard}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Fetch'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4">
          {error}
        </div>
      )}

      {card && (
        <div className="bg-gray-100 p-4 rounded-md">
          <h3 className="font-medium text-lg mb-2">Card Details</h3>
          
          <div className="mb-3 text-sm text-gray-600">
            <p><strong>Hash:</strong> {card.hash}</p>
            <p><strong>Created:</strong> {new Date(card.g_time || '').toLocaleString()}</p>
            {serverTimestamp && (
              <p><strong>Retrieved:</strong> {new Date(serverTimestamp).toLocaleString()}</p>
            )}
          </div>

          {availableSections.length > 0 && (
            <>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">View Section</label>
                <select 
                  value={selectedSection || ''}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableSections.map(section => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </div>

              {selectedSection && (
                <div className="bg-white p-3 rounded-md border border-gray-300 overflow-auto max-h-60">
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(card.content[selectedSection], null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
