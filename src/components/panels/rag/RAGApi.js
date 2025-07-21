/**
 * RAGApi.js - API functions for communicating with the RAG backend
 * Handles all the networking and data processing for the RAG panel
 */

// Cache for API responses
const apiCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds cache

/**
 * Fetch card statistics from the MCard API
 */
export const fetchCardStats = async () => {
  try {
    const response = await fetch('/api/card-collection?action=getStats');
    if (!response.ok) {
      console.warn('Could not fetch card stats');
      return null;
    }
    
    const data = await response.json();
    if (data.success) {
      return {
        totalCards: data.totalCards || 0,
        indexedCards: data.indexedCards || 0,
        lastUpdated: data.lastUpdated || new Date().toISOString()
      };
    }
    return null;
  } catch (err) {
    console.error('Error fetching card stats:', err);
    return null;
  }
};

/**
 * Fetch all cards from MCard API
 */
export const fetchAllCards = async () => {
  try {
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
    
    return data.items || [];
  } catch (err) {
    console.error('Error fetching cards:', err);
    throw err;
  }
};

/**
 * Load cards into the RAG database
 */
export const loadCardsToRAG = async (processedCards) => {
  let successCount = 0;
  console.log(`Starting upload of ${processedCards.length} cards to RAG database...`);
  
  if (!processedCards || processedCards.length === 0) {
    console.error('No cards provided for upload');
    return 0;
  }
  
  // Upload each card individually
  for (const card of processedCards) {
    try {
      console.log(`Processing card for upload: ${card.title}`, {
        contentLength: card.content?.length || 0,
        contentPreview: card.content?.substring(0, 50)
      });
      
      // Convert card content to a Blob for file upload
      const cardBlob = new Blob([card.content], { type: 'text/plain' });
      console.log(`Created blob for ${card.title}, size: ${cardBlob.size} bytes`);
      
      // Create a FormData object for file upload
      const formData = new FormData();
      formData.append('file', cardBlob, `${card.title}.txt`);
      
      // Debug what's in the FormData
      console.log('FormData entries:');
      if (formData.entries) {
        for (const pair of formData.entries()) {
          console.log(`- ${pair[0]}: ${pair[1] instanceof Blob ? 'Blob object' : pair[1]}`);
        }
      }
      
      // Use our server-side proxy API
      console.log(`Sending upload request for ${card.title} via proxy...`);
      const uploadResponse = await fetch('/api/rag-proxy?endpoint=upload', {
        method: 'POST',
        body: formData,
        // Explicitly set mode and credentials for debugging
        mode: 'same-origin', // Default for same-origin requests
        credentials: 'same-origin' // Include cookies in same-origin requests
      });
      
      // Log the response details
      console.log(`Upload response for ${card.title}:`, {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        headers: Array.from(uploadResponse.headers.entries())
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text().catch(() => 'Could not extract response text');
        console.warn(`Failed to upload card ${card.title}: ${uploadResponse.status} ${uploadResponse.statusText}`);
        console.warn(`Error response: ${errorText}`);
        continue;
      }
      
      const responseData = await uploadResponse.text();
      console.log(`Upload success for ${card.title}. Response:`, responseData);
      
      successCount++;
    } catch (uploadErr) {
      console.error(`Error uploading card ${card.title}:`, uploadErr);
    }
  }
  
  console.log(`Upload process completed. Success count: ${successCount}/${processedCards.length}`);
  return successCount;
};

/**
 * Index the RAG database
 */
export const indexRAGDatabase = async () => {
  try {
    console.log('Attempting to index using /rebuild-index endpoint via proxy...');
    
    // Use server-side proxy API
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
    return { success: true, message: result.message || '' };
  } catch (primaryErr) {
    console.error('Primary indexing method failed:', primaryErr);
    
    // Try fallback approach
    try {
      console.log('Trying alternative approach via proxy...');
      
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
        return { success: true, message: `Using alternative method. ${alt1Result.message || ''}` };
      }
      
      // Alternative 2: Docs may be automatically indexed on upload
      return { 
        success: true, 
        message: 'Indexing may have happened automatically during upload. You can now try searching the content.' 
      };
    } catch (fallbackErr) {
      // If fallback also fails, show combined error message
      throw new Error(`Primary error: ${primaryErr.message}. Fallback error: ${fallbackErr.message}`);
    }
  }
};

/**
 * Search the RAG database with a query
 */
export const searchRAG = async (query) => {
  console.log('Searching RAG database with query via proxy:', query);
  
  const response = await fetch('/api/rag-proxy?endpoint=query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query }),
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
  
  return result;
};

/**
 * Send a message to the RAG system and get a response
 */
export const sendMessageToRAG = async (message) => {
  console.log('Sending message to RAG:', message);
  
  try {
    const payload = { query: message };
    console.log('Request payload:', payload);
    
    const response = await fetch('/api/rag-proxy?endpoint=query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      mode: 'same-origin',
      credentials: 'same-origin'
    });
    
    console.log('Query response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not extract response text');
      console.error('Error response body:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('Content-Type');
    console.log('Response content type:', contentType);
    
    let result;
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      console.log('Got non-JSON response:', text);
      try {
        result = JSON.parse(text);
      } catch (e) {
        result = { answer: text };
      }
    }
    
    console.log('Parsed response:', result);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Error in sendMessageToRAG:', error);
    throw error;
  }
};
