import React, { useState, useEffect, useRef } from 'react';

// Cache for API responses
const apiCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds cache

const ChatbotPanel = ({ className = '' }) => {
  // Add isTyping state with other state declarations
  const [isTyping, setIsTyping] = useState(false);
  const [mentions, setMentions] = useState([]);
  const [showCommands, setShowCommands] = useState(false);
  
  // Initialize messages from localStorage if available
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    return savedMessages ? JSON.parse(savedMessages) : [
      { 
        role: 'system', 
        content: `How can I help?`
      }
    ];
  });

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }, [messages]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const switchTimeoutRef = useRef(null);
  const [error, setError] = useState(null);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedPort, setSelectedPort] = useState('11434');
  const [ollamaInstance, setOllamaInstance] = useState('local');
  const [instanceStatus, setInstanceStatus] = useState({
    local: { connected: false, models: [] },
    server: { connected: false, models: [] }
  });
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);


  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if Ollama is running and get available models
  useEffect(() => {
    checkOllamaStatus();
  }, [selectedPort]);
  
  // Function to fetch data from the API endpoint for RAG
  const fetchExternalData = async () => {
    try {
      console.log('Fetching data from API endpoint...');
      // Use no-cache to ensure we always get fresh data
      const response = await fetch('http://localhost:4321/api/card-collection?action=getPage&pageNumber=1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('External data fetched successfully:', data);
      return data;
    } catch (err) {
      console.error('Error fetching external data:', err);
      return null;
    }
  };
  
  // Function to process and extract relevant information from the API response
  const processExternalData = (data) => {
    console.log('Processing external data...');
    
    if (!data) {
      console.warn('No data provided to processExternalData');
      return null;
    }
    
    if (!data.items || data.items.length === 0) {
      console.warn('Data has no items array or empty items array');
      return null;
    }
    
    try {
      // Extract content from the first item
      const item = data.items[0];
      console.log('Processing first item:', item);
      
      if (!item) {
        console.warn('First item is undefined or null');
        return null;
      }
      
      let parsedContent;
      
      // Try to parse the content if it's a JSON string
      try {
        if (typeof item.content === 'string') {
          console.log('Parsing item content as string');
          parsedContent = JSON.parse(item.content);
        } else {
          console.log('Using item content directly as object');
          parsedContent = item.content;
        }
        console.log('Parsed content:', parsedContent);
      } catch (e) {
        console.warn('Failed to parse content as JSON, using as is:', e);
        parsedContent = item.content;
      }
      
      // Format the data in a readable way
      let formattedInfo = 'Here is the information I found:\n\n';
      
      // Handle calendar-like data with context structure
      if (parsedContent && parsedContent.context) {
        console.log('Found context structure in parsed content');
        const context = parsedContent.context;
        
        // Process today, week, and month data if available
        ['today', 'week', 'month'].forEach(timeframe => {
          if (context[timeframe] && Array.isArray(context[timeframe]) && context[timeframe].length > 0) {
            console.log(`Found ${context[timeframe].length} events for ${timeframe}`);
            formattedInfo += `${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}:\n`;
            
            context[timeframe].forEach((event) => {
              formattedInfo += `- ${event.summary || 'Event'}`;
              if (event.start) formattedInfo += ` (${event.start}`;
              if (event.end && event.end !== event.start) formattedInfo += ` to ${event.end}`;
              if (event.start) formattedInfo += `)`;
              formattedInfo += '\n';
            });
            
            formattedInfo += '\n';
          } else {
            console.log(`No events found for ${timeframe}`);
          }
        });
      } else {
        console.log('No context structure found, processing as generic data');
        // For other types of data, include all available fields
        formattedInfo += `Title: ${item.title || 'N/A'}\n`;
        formattedInfo += `Description: ${item.description || 'N/A'}\n`;
        
        if (typeof parsedContent === 'object' && parsedContent !== null) {
          formattedInfo += 'Content:\n';
          Object.entries(parsedContent).forEach(([key, value]) => {
            formattedInfo += `- ${key}: ${JSON.stringify(value)}\n`;
          });
        } else {
          formattedInfo += `Content: ${parsedContent || 'N/A'}\n`;
        }
      }
      
      console.log('Formatted info created successfully');
      return formattedInfo;
    } catch (err) {
      console.error('Error processing external data:', err);
      return null;
    }
  };

  const checkOllamaStatus = async () => {
    const instance = selectedPort === '11434' ? 'local' : 'server';
    // Use the appropriate API proxy based on the selected port
    const baseUrl = selectedPort === '11434' ? '/api/ollama-proxy' : '/api/ollama_public';
    const cacheKey = `models_${baseUrl}_${selectedPort}`;

    // Check cache first
    const cachedData = apiCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      setModels(cachedData.models);
      setInstanceStatus(prev => ({
        ...prev,
        [instance]: { connected: true, models: cachedData.models }
      }));
      setSelectedModel(cachedData.models[0]?.name || '');
      setError(null);
      return;
    }

    setInstanceStatus(prev => ({
      ...prev,
      [instance]: { ...prev[instance], connected: false }
    }));

    try {
      // Faster timeout for model list
      const endpoint = '?endpoint=/api/tags';
      const response = await fetch(`${baseUrl}${endpoint}`, {
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });

      if (!response.ok) {
        throw new Error('Unable to fetch models');
      }

      const data = await response.json();
      const models = data.models?.map(model => ({ name: model.name })) || [];

      if (models.length > 0) {
        // Cache the successful response
        apiCache.set(cacheKey, {
          models,
          timestamp: Date.now()
        });
        
        setModels(models);
        setInstanceStatus(prev => ({
          ...prev,
          [instance]: { connected: true, models: models }
        }));
        setSelectedModel(models[0].name);
        setError(null);
      } else {
        throw new Error('No models available');
      }
    } catch (err) {
      console.error('Error checking Ollama status:', err);
      const instanceType = selectedPort === '11434' ? 'Local LLM' : 'Server LLM';
      const errorMessage = err.name === 'TimeoutError' 
        ? `${instanceType} connection timed out. Make sure ${instanceType} is running.`
        : `${instanceType} is not available. Make sure ${instanceType} is running and has models installed.`;
      setError(errorMessage);
      setModels([]);
      setSelectedModel('');
    }
  };



  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
    }
  };
  

  const handleInputChange = (e) => {
    setInput(e.target.value);
    // Reset typing timer
    setIsTyping(true);
    const timer = setTimeout(() => setIsTyping(false), 1000);
    return () => clearTimeout(timer);
  };
  


  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };


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

      // Implement optimized RAG with quick timeout
      console.log('Starting optimized RAG process...');
      
      // Fetch external data with timeout to ensure quick response
      const externalData = await Promise.race([
        fetchExternalData(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('RAG timeout')), 2000)
        )
      ]).catch(err => {
        console.log('RAG fetch skipped:', err.message);
        return null;
      });
      
      // Prepare a string representation of the raw API response
      let rawApiResponseStr = 'API Response: ';
      if (!externalData) {
        console.warn('No external data retrieved, proceeding without RAG context');
        rawApiResponseStr += 'Failed to retrieve data from API';
      } else {
        console.log('Successfully retrieved external data for RAG');
        rawApiResponseStr += JSON.stringify(externalData, null, 2);
      }
      
      const contextInfo = processExternalData(externalData);
      console.log('Processed context info:', contextInfo ? 'Available' : 'Not available');
      
      // Prepare messages array with external context if available
      const messagesForModel = [];
      
      // Add system message with enhanced RAG prompt template
      messagesForModel.push({
        role: 'system',
        content: `You are a helpful assistant with access to both document search and general knowledge.

If relevant document context is found, use it: ${contextInfo || 'No relevant context found.'}

Please explain very quickly. If no relevant documents are found or the context doesn't answer the question completely, use your general knowledge to provide a helpful response. Always aim to give the most accurate and useful answer possible, whether it comes from documents or your general knowledge.`
      });
      
      // Add a hidden message with the raw API data for the model to use
      if (rawApiResponseStr) {
        messagesForModel.push({
          role: 'system',
          content: `Additional context (not to be directly referenced in your response): Raw API response from http://localhost:4321/api/card-collection?action=getPage&pageNumber=1:\n\n${rawApiResponseStr}`
        });
      }
      
      // Add existing conversation history and user message
      messagesForModel.push(
        ...messages.filter(m => !m.isThinking && m.role !== 'system'),
        userMessage
      );

      // Use the appropriate API proxy based on the selected port
      const baseUrl = selectedPort === '11434' ? '/api/ollama-proxy' : '/api/ollama_public';
      const endpoint = '';
      
      // Make API call to Ollama via proxy
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: messagesForModel,
          stream: true,
          endpoint: '/api/chat', // Only used by the proxy
          options: {
            temperature: 0.7,
            num_predict: 1024,
            top_k: 20,
            top_p: 0.9,
            repeat_penalty: 1.1,
            num_ctx: 2048
          }
        }),
        signal: AbortSignal.timeout(10000) // 10s timeout
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      let accumulatedResponse = '';
      
      // Remove thinking indicator before starting stream
      setMessages(prev => prev.filter(m => !m.isThinking));
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(Boolean);
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              accumulatedResponse += data.message.content;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                
                if (lastMessage?.role === 'assistant') {
                  lastMessage.content = accumulatedResponse;
                  return newMessages;
                } else {
                  return [...prev, { role: 'assistant', content: accumulatedResponse }];
                }
              });
            }
          } catch (parseError) {
            console.warn('Failed to parse streaming chunk:', parseError);
            continue;
          }
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Still fetch API data for debugging but don't show it to the user
      try {
        const externalData = await fetchExternalData();
        if (externalData) {
          console.log('API data retrieved during error recovery:', externalData);
        }
      } catch (apiErr) {
        console.error('Error fetching API data during error recovery:', apiErr);
      }
      
      // Remove thinking indicator and add error message without API data
      const errorMessage = `Error: ${err.message}. Make sure Ollama is running with the ${selectedModel} model.`;
      
      setMessages(prev => [
        ...prev.filter(m => !m.isThinking),
        { role: 'error', content: errorMessage }
      ]);
      setError(`${err.message}. Make sure Ollama is running with the ${selectedModel} model.`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    const initialMessage = { role: 'system', content: 'How can I help?' };
    setMessages([initialMessage]);
    localStorage.setItem('chatHistory', JSON.stringify([initialMessage]));
  };

  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
  };

  // Add this after other function declarations
  // Remove the duplicate state declaration and move it to the top with other states
  const [selectedText, setSelectedText] = useState('');
  
  // Keep the handleMentionClick function, but remove the JSX block that's outside return
  const handleMentionClick = (word) => {
    const selection = window.getSelection().toString().trim();
    const textToAdd = selection || word;
    setInput(prev => prev + (prev ? ' ' : '') + textToAdd);
    inputRef.current?.focus();
  };
  
  // Add this with other state declarations at the top
  const [isWordSelectEnabled, setIsWordSelectEnabled] = useState(true);
  
  // Add this near the handleModelChange function
  const toggleWordSelect = () => {
    setIsWordSelectEnabled(prev => !prev);
  };
  
  // Update the header section in the return statement
  // In the return statement, wrap the elements in a parent div
  return (
    <div className={`h-full w-full flex flex-col bg-gray-900 text-gray-200 overflow-hidden ${className}`}>
      <div className="p-2 bg-gray-800 border-b border-gray-700 flex flex-col">
        <div className="flex items-center mb-2">
          <div className="text-center flex-grow"><b>Chatbot</b></div>
          <div className="flex items-center mr-2">
            <span className="text-xs text-gray-300 font-medium mr-3">LLM Provider:</span>
            <button
              disabled={isSwitching}
              onClick={() => {
                // Prevent concurrent switches
                if (isSwitching) return;

                // Clear any pending switch timeout
                if (switchTimeoutRef.current) {
                  clearTimeout(switchTimeoutRef.current);
                }

                // Set a 100ms debounce timeout
                switchTimeoutRef.current = setTimeout(async () => {
                  setIsSwitching(true);
                  try {
                    const newPort = selectedPort === '11434' ? '11435' : '11434';
                    const newInstance = selectedPort === '11434' ? 'server' : 'local';

                    // Batch state updates
                    setModels([]);
                    setError(null);
                    setIsLoading(false);
                    setMessages(prev => prev.filter(m => !m.isThinking));
                    setSelectedPort(newPort);
                    setOllamaInstance(newInstance);

                    await checkOllamaStatus();
                  } catch (err) {
                    console.error('Switch error:', err);
                    setError(`Failed to switch LLM provider: ${err.message}`);
                  } finally {
                    setIsSwitching(false);
                    switchTimeoutRef.current = null;
                  }
                }, 100);
              }}
              className={`flex items-center gap-2 px-3 py-1 text-xs ${isSwitching ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600'} text-white rounded transition-colors duration-200 min-w-[80px] text-center font-medium`}
            >
              <div className="flex items-center gap-2">
                <div className="relative h-4 w-6 flex justify-between px-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="white">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="white">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <span className="min-w-[36px]">{selectedPort === '11434' ? 'Local' : 'Server'}</span>
              </div>
            </button>
          </div>
          <select 
            value={selectedModel}
            onChange={handleModelChange}
            className="mr-2 px-2 py-1 text-xs bg-gray-700 text-white rounded"
          >
            {models.length > 0 ? (
              models.map(model => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))
            ) : (
              <option key="LLM Models" value="LLM Models">LLM Models</option>
            )}
          </select>
          <button 
            onClick={clearChat}
            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
          >
            Clear
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
              <div 
                className="whitespace-pre-wrap"
                onMouseUp={() => {
                  if (!isWordSelectEnabled) return;
                  const selection = window.getSelection().toString().trim();
                  if (selection) {
                    setInput(prev => prev + (prev ? ' ' : '') + selection);
                    inputRef.current?.focus();
                  }
                }}
              >
                {message.role === 'assistant' && !message.isThinking ? (
                  message.content.split(' ').map((word, i) => (
                    <React.Fragment key={i}>
                      <span 
                        className={`${isWordSelectEnabled ? 'cursor-pointer hover:text-yellow-400' : ''} transition-colors`}
                        onClick={() => isWordSelectEnabled && handleMentionClick(word)}
                      >
                        {word}
                      </span>
                      {' '}
                    </React.Fragment>
                  ))
                ) : (
                  message.content
                )}
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
              onChange={(e) => {
                handleInputChange(e);
                setIsTyping(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
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

export default ChatbotPanel;
