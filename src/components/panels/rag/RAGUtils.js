/**
 * RAGUtils.js - Utility functions for the RAG panel
 * Contains helper functions and utilities for formatting and data processing
 */

/**
 * Format a response from the RAG system for display
 */
export const formatRAGResponse = (result) => {
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
  
  return responseContent;
};

/**
 * Format search results for display
 */
export const formatSearchResults = (result) => {
  const documents = result.documents || result.results || [];
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
  
  return responseContent;
};

/**
 * Process cards for RAG API by extracting content
 */
export const processCardsForRAG = (cards) => {
  return cards.map(card => {
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
};

/**
 * Get messages from localStorage or initialize with default
 */
export const getInitialMessages = () => {
  const savedMessages = localStorage.getItem('ragChatHistory');
  return savedMessages ? JSON.parse(savedMessages) : [
    { 
      role: 'system', 
      content: `Welcome to the RAG (Retrieval-Augmented Generation) panel. You can search through the MCard database or load new content for indexing.`
    }
  ];
};

/**
 * Save messages to localStorage
 */
export const saveMessages = (messages) => {
  localStorage.setItem('ragChatHistory', JSON.stringify(messages));
};
