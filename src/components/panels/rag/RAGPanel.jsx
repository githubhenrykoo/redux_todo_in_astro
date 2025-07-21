import React, { useState, useEffect, useRef } from 'react';
import RAGChat from './RAGChat';
import RAGControls from './RAGControls';
import * as RAGApi from './RAGApi';
import { formatRAGResponse, formatSearchResults, processCardsForRAG, getInitialMessages, saveMessages } from './RAGUtils';

/**
 * RAGPanel component - Main container for the RAG functionality
 * This component integrates the various RAG subcomponents and manages the state
 */
const RAGPanel = ({ className = '' }) => {
  // State management
  const [messages, setMessages] = useState(getInitialMessages);
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
    saveMessages(messages);
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

  // Fetch card statistics
  const fetchCardStats = async () => {
    try {
      const stats = await RAGApi.fetchCardStats();
      if (stats) {
        setCardStats(stats);
      }
    } catch (err) {
      console.error('Error fetching card stats:', err);
    }
  };

  // Function to load cards into the RAG database
  const loadCardsIntoRAG = async () => {
    try {
      setIsLoading(true);
      setMessages(prev => [...prev, { role: 'system', content: 'Fetching all cards from MCard...' }]);
      
      const cards = await RAGApi.fetchAllCards();
      
      if (!cards || cards.length === 0) {
        setMessages(prev => [...prev, { role: 'system', content: 'No cards found to load into RAG.' }]);
        return;
      }
      
      setMessages(prev => [...prev, { role: 'system', content: `Loading ${cards.length} cards into RAG database...` }]);
      
      // Process cards for RAG API
      const processedCards = processCardsForRAG(cards);
      
      // Upload cards to RAG database
      const uploadedCount = await RAGApi.loadCardsToRAG(processedCards);
      
      if (uploadedCount > 0) {
        setMessages(prev => [
          ...prev,
          { role: 'system', content: `Successfully loaded ${uploadedCount} cards into RAG database.` }
        ]);
      } else {
        throw new Error('Failed to upload any cards');
      }
      
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
      
      const result = await RAGApi.indexRAGDatabase();
      
      setMessages(prev => [
        ...prev, 
        { 
          role: 'system', 
          content: `Successfully indexed RAG database. ${result.message || ''}` 
        }
      ]);
      
      // Refresh stats
      fetchCardStats();
    } catch (err) {
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
      
      const result = await RAGApi.searchRAG(searchQuery);
      
      // Format response for display
      const responseContent = formatSearchResults(result);
      
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
      
      const result = await RAGApi.sendMessageToRAG(userMessage.content);
      
      // Remove thinking indicator
      setMessages(prev => prev.filter(m => !m.isThinking));
      
      // Format the response
      const responseContent = formatRAGResponse(result);
      
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
    saveMessages([initialMessage]);
  };

  return (
    <div className={`h-full w-full flex flex-col bg-gray-900 text-gray-200 overflow-hidden ${className}`}>
      <RAGControls
        cardStats={cardStats}
        isLoading={isLoading}
        isIndexing={isIndexing}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onLoadCards={loadCardsIntoRAG}
        onIndexDatabase={indexRAGDatabase}
        onSearch={searchRAG}
        onClearChat={clearChat}
      />
      
      {error && (
        <div className="bg-red-900 text-red-100 p-2 text-sm">
          {error}
        </div>
      )}
      
      <RAGChat
        messages={messages}
        input={input}
        isLoading={isLoading}
        onInputChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onSendMessage={sendMessage}
        messagesEndRef={messagesEndRef}
      />
    </div>
  );
};

export default RAGPanel;
