import React from 'react';

/**
 * RAGControls component - Contains buttons and inputs for controlling the RAG panel
 */
const RAGControls = ({
  cardStats,
  isLoading,
  isIndexing,
  searchQuery,
  setSearchQuery,
  onLoadCards,
  onIndexDatabase,
  onSearch,
  onClearChat,
}) => {
  return (
    <div className="p-2 bg-gray-800 border-b border-gray-700 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="text-center flex-1"><b>RAG Panel</b></div>
        <button 
          onClick={onClearChat}
          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
        >
          Clear Chat
        </button>
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-300">Cards: {cardStats.totalCards}</span>
          <span className="text-xs text-gray-300">Indexed: {cardStats.indexedCards}</span>
          {cardStats.lastUpdated && (
            <span className="text-xs text-gray-300">
              Updated: {new Date(cardStats.lastUpdated).toLocaleString()}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={onLoadCards}
          disabled={isLoading}
          className={`flex-1 px-2 py-1 text-xs ${isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} rounded transition-colors duration-200`}
        >
          {isLoading ? 'Loading...' : 'Load Cards to RAG'}
        </button>
        <button
          onClick={onIndexDatabase}
          disabled={isIndexing}
          className={`flex-1 px-2 py-1 text-xs ${isIndexing ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} rounded transition-colors duration-200`}
        >
          {isIndexing ? 'Indexing...' : 'Index Database'}
        </button>
      </div>
      
      <div className="mt-2 flex space-x-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Enter search query..."
          className="flex-grow p-2 bg-gray-700 text-white rounded-lg"
        />
        <button
          onClick={onSearch}
          disabled={isLoading || !searchQuery.trim()}
          className={`px-3 py-1 ${
            isLoading || !searchQuery.trim() 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          } rounded transition-colors duration-200`}
        >
          Search
        </button>
      </div>
    </div>
  );
};

export default RAGControls;
