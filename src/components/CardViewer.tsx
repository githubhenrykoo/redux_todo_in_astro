import React, { useState } from 'react';

interface CardData {
  theme?: any;
  user?: any;
  content?: any;
  todo?: any;
  [key: string]: any;
}

export const CardViewer: React.FC = () => {
  const [hash, setHash] = useState('');
  const [card, setCard] = useState<CardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

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

    try {
      console.log('Fetching card with hash:', hash);
      const response = await fetch(`/api/get-card?hash=${encodeURIComponent(hash)}`);
      const data = await response.json();
      console.log('Card fetch response:', data);

      if (response.ok && data.success) {
        setCard(data.card);
        
        // Extract available sections from the card
        const sections = Object.keys(data.card);
        setAvailableSections(sections);
        
        // Set default selected section
        if (sections.length > 0) {
          setSelectedSection(sections[0]);
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
      <h2 className="text-xl font-bold mb-4">Card Viewer</h2>
      
      <div className="flex mb-4">
        <input
          type="text"
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          placeholder="Enter card hash..."
          className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={fetchCard}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Loading...' : 'View Card'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded mb-4">
          {error}
        </div>
      )}

      {card && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Card Content:</h3>
          
          {availableSections.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-1">Select Section:</h4>
              <div className="flex flex-wrap gap-2">
                {availableSections.map(section => (
                  <button
                    key={section}
                    onClick={() => setSelectedSection(section)}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedSection === section 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    {section}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {selectedSection ? (
            <div className="mt-2">
              <h4 className="text-sm font-medium mb-1">{selectedSection}:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(card[selectedSection], null, 2)}
              </pre>
            </div>
          ) : (
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(card, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
