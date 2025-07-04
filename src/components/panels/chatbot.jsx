import React, { useState, useEffect, useRef } from 'react';

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
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
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

    setInstanceStatus(prev => ({
      ...prev,
      [instance]: { ...prev[instance], connected: false }
    }));

    try {
      // Try /api/list endpoint directly - it's more reliable
      const response = await fetch(`http://127.0.0.1:${selectedPort}/api/tags`, {
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });

      if (!response.ok) {
        throw new Error('Unable to fetch models');
      }

      const data = await response.json();
      const models = data.models?.map(model => ({ name: model.name })) || [];

      if (models.length > 0) {
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
      setMessages(prev => [...prev, { role: 'assistant', content: '...', isThinking: true }]);

      // Implement RAG: Fetch external data to augment the response
      console.log('Starting RAG process...');
      
      // Fetch external data and handle the response
      const externalData = await fetchExternalData();
      
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
      
      // Add system message with RAG prompt template
      messagesForModel.push({
        role: 'system',
        content: `You are an assistant who is very good at searching documents. If you do not find an answer from the provided information, say sorry.

Context: ${contextInfo || 'No relevant context found in the database.'}

Answer based on the above context.`
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

      // Call Ollama API with the enhanced context
      console.log('Sending request to Ollama API with', messagesForModel.length, 'messages');
      console.log('First message role:', messagesForModel[0]?.role);
      
      const response = await fetch(`http://127.0.0.1:${selectedPort}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: messagesForModel,
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received response from Ollama API');
      
      // Check if we have a valid response with content
      if (!data.message || !data.message.content) {
        console.warn('Received empty or invalid response from Ollama');
      }
      
      // Only show the model's response to the user (hide API data)
      const assistantResponse = data.message?.content || 'No response from model';
      
      // Remove thinking indicator and add actual response
      setMessages(prev => [
        ...prev.filter(m => !m.isThinking),
        { role: 'assistant', content: assistantResponse }
      ]);
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
            } ${message.isThinking ? 'animate-pulse' : ''}`}>
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
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPanel;
