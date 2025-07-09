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

  // Save messages to localStorage whenever they changes
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }, [messages]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('llama3:8b');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const terminalSocketRef = useRef(null);


  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if Ollama is running and get available models
  useEffect(() => {
    checkOllamaStatus();
  }, []);
  
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
    try {
      const response = await fetch('http://127.0.0.1:11434/api/tags');
      if (response.ok) {
        const data = await response.json();
        if (data.models && data.models.length > 0) {
          setModels(data.models);
          // If llama3:8b is available, use it
          const llama3Model = data.models.find(model => model.name === 'llama3:8b');
          if (llama3Model) {
            setSelectedModel('llama3:8b');
          } else {
            // Otherwise use the first available model
            setSelectedModel(data.models[0].name);
          }
        }
      }
    } catch (err) {
      console.error('Error checking Ollama status:', err);
      setError('Cannot connect to Ollama server. Make sure Ollama is running at http://127.0.0.1:11434');
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

  useEffect(() => {
    // Connect to terminal WebSocket server
    connectToTerminal();
    return () => {
      if (terminalSocketRef.current) {
        terminalSocketRef.current.close();
      }
    };
  }, []);

  const connectToTerminal = () => {
    try {
      const ws = new WebSocket('ws://localhost:3001');
      terminalSocketRef.current = ws;

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'output') {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: message.data
          }]);
        }
      };
    } catch (err) {
      console.error('Terminal connection error:', err);
    }
  };

  // Add this function after other function declarations
  // Update the processNaturalLanguageCommand function
  const processNaturalLanguageCommand = (text) => {
    // Helper function to calculate similarity between two strings
    const calculateSimilarity = (str1, str2) => {
      const s1 = str1.toLowerCase();
      const s2 = str2.toLowerCase();
      const len1 = s1.length;
      const len2 = s2.length;
      const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));

      for (let i = 0; i <= len1; i++) matrix[i][0] = i;
      for (let j = 0; j <= len2; j++) matrix[0][j] = j;

      for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
          const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost
          );
        }
      }
      return 1 - (matrix[len1][len2] / Math.max(len1, len2));
    };

    // Find closest matching command
    const findClosestCommand = (input) => {
      const commands = Object.keys(commandMap);
      let bestMatch = null;
      let highestSimilarity = 0;

      commands.forEach(cmd => {
        const similarity = calculateSimilarity(input, cmd);
        if (similarity > highestSimilarity && similarity > 0.6) { // Threshold of 60% similarity
          highestSimilarity = similarity;
          bestMatch = cmd;
        }
      });
      return bestMatch;
    };

    const commandMap = {
      'read': 'cat',
      'show': 'cat',
      'list': 'ls',
      'show files': 'ls',
      'show directory': 'ls',
      'current directory': 'pwd',
      'where am i': 'pwd',
      'clear screen': 'clear',
      'make directory': 'mkdir',
      'create directory': 'mkdir',
      'remove': 'rm',
      'delete': 'rm',
    };

    // Fuzzy patterns for file operations
    const patterns = {
      read: /(?:r[ea]+d|sh[o0]w|d[i1]spl[ae]y|[o0]p[e3]n)\s+(?:c[o0]nt[e3]nts?\s+[o0]f\s+|th[e3]\s+)?(?:f[i1]l[e3]\s+)?["']?([^"']+?)["']?\s*$/i,
      list: /(?:l[i1]st|sh[o0]w)\s+(?:f[i1]l[e3]s?|d[i1]r[e3]ct[o0]r[yi]?s?|c[o0]nt[e3]nts?)\s*(?:[i1]n\s+)?(.+)?/i,
      mkdir: /(?:m[a4]k[e3]|cr[e3][a4]t[e3])\s+(?:[a4]\s+)?(?:n[e3]w\s+)?d[i1]r(?:[e3]ct[o0]r[yi])?\s+(?:n[a4]m[e3]d\s+)?(.+)/i,
      remove: /(?:r[e3]m[o0]v[e3]|d[e3]l[e3]t[e3])\s+(?:th[e3]\s+)?(?:f[i1]l[e3]|d[i1]r[e3]ct[o0]r[yi])?\s+(.+)/i,
      where: /w[he]{1,2}r[e]?\s+(?:am|is)\s+(?:i|me|we)/i
    };

    let command = '';
    const input = text.toLowerCase().trim();

    // First try to find exact match
    if (commandMap[input]) {
      return commandMap[input];
    }

    // Then try to find closest match for simple commands
    const closestMatch = findClosestCommand(input);
    if (closestMatch) {
      return commandMap[closestMatch];
    }

    // Check patterns with fuzzy matching
    if (patterns.where.test(input)) {
      command = 'pwd';
    } else if (patterns.read.test(input)) {
      const match = input.match(patterns.read);
      const filename = match[1].trim();
      command = `cat "${filename}"`;
    } else if (patterns.list.test(input)) {
      const match = input.match(patterns.list);
      command = `ls ${match[1] ? `"${match[1].trim()}"` : ''}`.trim();
    } else if (patterns.mkdir.test(input)) {
      const match = input.match(patterns.mkdir);
      command = `mkdir "${match[1].trim()}"`;
    } else if (patterns.remove.test(input)) {
      const match = input.match(patterns.remove);
      command = `rm "${match[1].trim()}"`;
    }

    return command;
  };
  
  // Update the sendMessage function's command handling section
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
  
    const userMessage = { role: 'user', content: input.trim() };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
  
    // Check for terminal commands (both direct and natural language)
    const naturalCommand = processNaturalLanguageCommand(input.trim());
    if (input.trim().startsWith('$') || naturalCommand) {
      const command = input.trim().startsWith('$') ? input.trim().slice(1) : naturalCommand;
      if (terminalSocketRef.current?.readyState === WebSocket.OPEN) {
        terminalSocketRef.current.send(JSON.stringify({
          type: 'input',
          data: command + '\n'
        }));
      }
      setIsLoading(false);
      return;
    }

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
      
      // Add system message with context information if available
      messagesForModel.push({
        role: 'system',
        content: `You are a helpful assistant. ${contextInfo ? 'Here is some information that might be relevant to the user\'s query: ' + contextInfo : ''}`
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
      
      const response = await fetch(`http://127.0.0.1:11434/api/chat`, {
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
    <div className={`h-full w-full flex flex-col bg-gradient-to-b from-white to-gray-100 text-gray-800 overflow-hidden ${className}`}>
      <div className="p-4 bg-opacity-90 backdrop-blur-sm bg-white border-b border-gray-200 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              AI Assistant
            </div>
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-3">
            <select 
              value={selectedModel}
              onChange={handleModelChange}
              className="px-3 py-1.5 text-sm bg-white text-gray-800 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {models.length > 0 ? (
                models.map(model => (
                  <option key={model.name} value={model.name}>
                    {model.name}
                  </option>
                ))
              ) : (
                <option key="llama3:8b" value="llama3:8b">llama3:8b</option>
              )}
            </select>
            <button 
              onClick={clearChat}
              className="px-3 py-1.5 text-sm bg-white hover:bg-gray-50 text-gray-800 rounded-lg border border-gray-300 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center space-x-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear Chat</span>
            </button>
          </div>
        </div>

      </div>
      
      {error && (
        <div className="bg-red-900 text-red-100 p-2 text-sm">
          {error}

        </div>
      )}
      
      <div className="flex-1 p-4 overflow-y-auto min-h-0 space-y-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} ${
            message.role === 'user' ? 'items-end' : 
            message.role === 'error' ? 'items-center justify-center' : 
            'items-start'
          }`}>
            {message.role === 'assistant' && !message.isThinking && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            )}
            <div className={`px-4 py-3 rounded-2xl shadow-sm max-w-[80%] backdrop-blur-sm ${
              message.role === 'user' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none' : 
              message.role === 'system' ? 'bg-gray-100 text-gray-800' : 
              message.role === 'error' ? 'bg-red-500 text-white' : 
              'bg-white text-gray-800 rounded-bl-none'
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
      
      <div className="p-4 border-t border-gray-200 backdrop-blur-sm bg-white">
        <div className="flex items-start max-w-4xl mx-auto">
          <div className="relative flex-grow">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                handleInputChange(e);
                setIsTyping(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here... (Press Enter to send)"
              className="w-full p-3 bg-gray-50 text-gray-800 rounded-2xl resize-none h-12 max-h-32 min-h-[3rem] pr-12 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 placeholder-gray-500"
              rows={1}
              disabled={isLoading}
            />
            {isTyping && (
              <div className="absolute right-3 bottom-3 text-xs text-gray-500">
                typing...
              </div>
            )}
          </div>
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className={`ml-3 p-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
              isLoading || !input.trim() 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg shadow-sm'
            }`}
          >
            <div className="relative w-5 h-5">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-5 w-5 relative">
                    <div className="absolute inset-0 opacity-75 animate-ping rounded-full bg-white"></div>
                    <svg className="relative animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center transition-transform duration-200 hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPanel;
