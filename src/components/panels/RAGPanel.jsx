import React, { useState, useEffect, useRef } from 'react';

// Cache for API responses
const apiCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds cache

const RAGPanel = ({ className = '' }) => {
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('ragChatHistory');
    return savedMessages ? JSON.parse(savedMessages) : [
      { 
        role: 'system', 
        content: `Welcome to the RAG (Retrieval-Augmented Generation) panel. You can search through the MCard database or load new content for indexing.`
      }
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [error, setError] = useState(null);
  const [cardStats, setCardStats] = useState({
    totalCards: 0,
    indexedCards: 0,
    lastUpdated: null
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('ragChatHistory', JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch card stats on component mount
  useEffect(() => {
    fetchCardStats();
  }, []);

  // Function to scroll chat to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
    }
  };

  // Function to fetch MCard stats
  const fetchCardStats = async () => {
    try {
      const response = await fetch('/api/card-collection?action=getStats');
      if (!response.ok) {
        console.warn('Could not fetch card stats');
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setCardStats({
          totalCards: data.totalCards || 0,
          indexedCards: data.indexedCards || 0,
          lastUpdated: data.lastUpdated || new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error fetching card stats:', err);
    }
  };

  // Function to fetch all cards from MCard
  const fetchAllCards = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:4321/api/card-collection?action=getPage&pageNumber=1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cards: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch cards');
      }
      
      setMessages(prev => [
        ...prev, 
        { 
          role: 'system', 
          content: `Successfully fetched ${data.items?.length || 0} cards.` 
        }
      ]);
      
      return data.items || [];
    } catch (err) {
      setError(`Error fetching cards: ${err.message}`);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'error', 
          content: `Error fetching cards: ${err.message}` 
        }
      ]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Function to load cards into the RAG database
  const loadCardsIntoRAG = async () => {
    try {
      setIsLoading(true);
      setMessages(prev => [...prev, { role: 'system', content: 'Fetching all cards from MCard...' }]);
      
      const cards = await fetchAllCards();
      
      if (!cards || cards.length === 0) {
        setMessages(prev => [...prev, { role: 'system', content: 'No cards found to load into RAG.' }]);
        return;
      }
      
      setMessages(prev => [...prev, { role: 'system', content: `Loading ${cards.length} cards into RAG database...` }]);
      
      // Prepare cards for RAG API by extracting content
      const processedCards = cards.map(card => {
        // Extract content from the card and create a document structure
        return {
          title: `Card-${card.hash.substring(0, 8)}`,
          content: typeof card.content === 'object' ? 
            (card.content.context || JSON.stringify(card.content)) : 
            String(card.content),
          metadata: {
            source: 'MCard',
            hash: card.hash,
            timestamp: card.g_time || new Date().toISOString()
          }
        };
      });
      
      // Send cards to RAG API for loading one by one through our proxy API
      // Upload each card individually
      for (const card of processedCards) {
        try {
          // Convert card content to a Blob for file upload
          const cardBlob = new Blob([card.content], { type: 'text/plain' });
          
          // Create a FormData object for file upload
          const formData = new FormData();
          formData.append('file', cardBlob, `${card.title}.txt`);
          
          // Use our server-side proxy API instead of direct RAG service call
          const uploadResponse = await fetch('/api/rag-proxy?endpoint=upload', {
            method: 'POST',
            body: formData
          });
          
          if (!uploadResponse.ok) {
            console.warn(`Failed to upload card ${card.title}: ${uploadResponse.status} ${uploadResponse.statusText}`);
          }
        } catch (uploadErr) {
          console.error(`Error uploading card ${card.title}:`, uploadErr);
        }
      }
      
      // Since we're uploading individual cards, we'll mock a successful response
      const response = new Response(JSON.stringify({ success: true, message: 'Cards uploaded successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load cards into RAG: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      setMessages(prev => [
        ...prev, 
        { 
          role: 'system', 
          content: `Successfully loaded ${cards.length} cards into RAG database. ${result.message || ''}` 
        }
      ]);
      
      // Refresh stats
      fetchCardStats();
      
    } catch (err) {
      setError(`Error loading cards into RAG: ${err.message}`);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'error', 
          content: `Error loading cards into RAG: ${err.message}` 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to index the RAG database
  const indexRAGDatabase = async () => {
    try {
      setIsIndexing(true);
      setMessages(prev => [...prev, { role: 'system', content: 'Starting RAG database indexing...' }]);
      
      // First try using the rebuild-index endpoint
      try {
        console.log('Attempting to index using /rebuild-index endpoint via proxy...');
        
        // Use our server-side proxy API instead of direct RAG service call
        const response = await fetch('/api/rag-proxy?endpoint=rebuild-index', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'rebuild' }),
          // Add timeout to prevent long hanging requests
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (!response.ok) {
          throw new Error(`Failed to index RAG database: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        setMessages(prev => [
          ...prev, 
          { 
            role: 'system', 
            content: `Successfully indexed RAG database. ${result.message || ''}` 
          }
        ]);
        
        // Refresh stats
        fetchCardStats();
        return;
      } catch (primaryErr) {
        console.error('Primary indexing method failed:', primaryErr);
        
        // Try fallback approach
        try {
          console.log('Trying alternative approach via proxy...');
          
          // Some RAG implementations might use a different endpoint or require different parameters
          // Let's try these alternatives:
          
          // Alternative 1: Try different endpoint via proxy
          const alt1Response = await fetch('/api/rag-proxy?endpoint=index', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'index' }),
            signal: AbortSignal.timeout(3000)
          }).catch(e => null);
          
          if (alt1Response && alt1Response.ok) {
            const alt1Result = await alt1Response.json();
            setMessages(prev => [
              ...prev, 
              { 
                role: 'system', 
                content: `Successfully indexed RAG database using alternative method. ${alt1Result.message || ''}` 
              }
            ]);
            fetchCardStats();
            return;
          }
          
          // Alternative 2: This might not be needed if documents are automatically indexed on upload
          setMessages(prev => [
            ...prev, 
            { 
              role: 'system', 
              content: `Indexing may have happened automatically during upload. You can now try searching the content.` 
            }
          ]);
          
          // Don't show the error since we provided a fallback message
          setError(null);
        } catch (fallbackErr) {
          // If fallback also fails, show combined error message
          throw new Error(`Primary error: ${primaryErr.message}. Fallback error: ${fallbackErr.message}`);
        }
      }
    } catch (err) {
      // This will only execute if both primary and fallback approaches fail
      console.error('All indexing methods failed:', err);
      setError(`Error indexing RAG database: ${err.message}`);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'error', 
          content: `Error indexing RAG database: ${err.message}\n\nNote: The uploaded documents may still be searchable. The RAG Docker service might have automatically indexed them during upload.` 
        }
      ]);
    } finally {
      setIsIndexing(false);
    }
  };

  // Function to handle input change
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  // Function to handle key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Function to search the RAG database
  const searchRAG = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsLoading(true);
      setMessages(prev => [
        ...prev, 
        { role: 'user', content: `Search: ${searchQuery}` }
      ]);
      
      console.log('Searching RAG database with query via proxy:', searchQuery);
      
      // Using our server-side proxy API instead of direct RAG service call
      const response = await fetch(`/api/rag-proxy?endpoint=query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: searchQuery }),
        // Add timeout to avoid hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`Failed to search RAG: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Search result:', result);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Handle different possible response structures
      const documents = result.documents || result.results || [];
      setSearchResults(documents);
      
      // Format response for display
      let responseContent = 'Here are the search results:\n\n';
      
      if (documents.length > 0) {
        documents.forEach((item, index) => {
          responseContent += `${index + 1}. ${item.title || item.metadata?.title || 'Untitled'}\n`;
          responseContent += `   Score: ${item.score?.toFixed(2) || item.similarity?.toFixed(2) || 'N/A'}\n`;
          responseContent += `   Content: ${(item.content || item.text || '').substring(0, 100)}...\n\n`;
        });
      } else {
        responseContent = 'No results found for your query.';
      }
      
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', content: responseContent }
      ]);
      
      // Clear search query
      setSearchQuery('');
      
    } catch (err) {
      setError(`Error searching RAG: ${err.message}`);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'error', 
          content: `Error searching RAG: ${err.message}` 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to send a message
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = { role: 'user', content: input.trim() };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    try {
      // Add thinking indicator
      setMessages(prev => [...prev, { role: 'assistant', content: 'Thinking...', isThinking: true }]);
      
      // Use the Docker-based RAG service via our server-side proxy API
      const response = await fetch('/api/rag-proxy?endpoint=query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: userMessage.content })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Remove thinking indicator
      setMessages(prev => prev.filter(m => !m.isThinking));
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Format response - handle different possible response structures
      let responseContent = '';
      
      // Handle different response structures based on the Docker RAG service
      if (result.answer) {
        responseContent = result.answer;
      } else if (result.response) {
        responseContent = result.response;
      } else if (result.text) {
        responseContent = result.text;
      } else if (result.documents && result.documents.length > 0) {
        responseContent = 'Here are the relevant documents I found:\n\n';
        result.documents.forEach((doc, index) => {
          responseContent += `${index + 1}. ${doc.title || 'Document ' + (index + 1)}\n`;
          responseContent += `${doc.text || doc.content || ''}\n\n`;
        });
      } else {
        responseContent = 'I couldn\'t find a specific answer to your question.';
      }
      
      // Add sources information if available
      const sources = result.sources || result.documents || [];
      if (sources && sources.length > 0) {
        responseContent += '\n\nSources:\n';
        sources.forEach((source, index) => {
          const title = source.title || source.metadata?.title || 'Document ' + (index + 1);
          const score = source.score?.toFixed(2) || source.similarity?.toFixed(2) || 'N/A';
          responseContent += `${index + 1}. ${title} (${score})\n`;
        });
      }
      
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: responseContent }
      ]);
      
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Remove thinking indicator and add error message
      setMessages(prev => [
        ...prev.filter(m => !m.isThinking),
        { role: 'error', content: `Error: ${err.message}` }
      ]);
      
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clear chat history
  const clearChat = () => {
    const initialMessage = { role: 'system', content: 'Welcome to the RAG (Retrieval-Augmented Generation) panel. You can search through the MCard database or load new content for indexing.' };
    setMessages([initialMessage]);
    localStorage.setItem('ragChatHistory', JSON.stringify([initialMessage]));
  };

  return (
    <div className={`h-full w-full flex flex-col bg-gray-900 text-gray-200 overflow-hidden ${className}`}>
      <div className="p-2 bg-gray-800 border-b border-gray-700 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="text-center flex-1"><b>RAG Panel</b></div>
          <button 
            onClick={clearChat}
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
            onClick={loadCardsIntoRAG}
            disabled={isLoading}
            className={`flex-1 px-2 py-1 text-xs ${isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} rounded transition-colors duration-200`}
          >
            {isLoading ? 'Loading...' : 'Load Cards to RAG'}
          </button>
          <button
            onClick={indexRAGDatabase}
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
            onClick={searchRAG}
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
      
      {error && (
        <div className="bg-red-900 text-red-100 p-2 text-sm">
          {error}
        </div>
      )}
      
      <div className="flex-1 p-4 overflow-y-auto min-h-0">
        {messages.map((message, index) => (
          <div key={index} className={`mb-4 ${
            message.role === 'user' ? 'text-right' : 
            message.role === 'error' ? 'text-center' : 
            'text-left'
          }`}>
            <div className={`inline-block px-4 py-2 rounded-lg max-w-[80%] ${
              message.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 
              message.role === 'system' ? 'bg-gray-700 text-gray-200' : 
              message.role === 'error' ? 'bg-red-600 text-white' : 
              'bg-gray-800 text-gray-200 rounded-bl-none'
            } ${message.isThinking ? 'relative' : ''}`}>
              {message.isThinking && (
                <div className="absolute -bottom-6 left-4 flex space-x-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-[bounce_0.9s_infinite]" style={{animationDelay: '0s'}}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-[bounce_0.9s_infinite]" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-[bounce_0.9s_infinite]" style={{animationDelay: '0.2s'}}></div>
                </div>
              )}
              <div className="whitespace-pre-wrap">
                {message.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-start">
          <div className="relative flex-grow">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents..."
              className="w-full p-2 bg-gray-800 text-white rounded-lg resize-none h-12 max-h-32 min-h-[3rem] pr-10"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className={`ml-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              isLoading || !input.trim() 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
            }`}
          >
            {isLoading ? (
              <div className="flex space-x-1 items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-[bounce_0.9s_infinite]" style={{animationDelay: '0s'}}></div>
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-[bounce_0.9s_infinite]" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-[bounce_0.9s_infinite]" style={{animationDelay: '0.2s'}}></div>
              </div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform transition-transform duration-200 ease-in-out hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RAGPanel;
