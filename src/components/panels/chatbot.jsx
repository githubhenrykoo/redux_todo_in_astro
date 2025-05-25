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
  const [error, setError] = useState(null);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('llama3:8b');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const terminalSocketRef = useRef(null);

  // Fetch available models on component mount
  useEffect(() => {
    fetchModels();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchModels = async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      const data = await response.json();
      setModels(data.models || []);
    } catch (err) {
      console.error('Error fetching models:', err);
      setError('Failed to connect to Ollama server. Make sure it\'s running on http://localhost:11434');
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
    }
  };
  

  const handleInputChange = (e) => {
    dispatch(setInput(e.target.value));
    // Reset typing timer
    setIsTyping(true);
    const timer = setTimeout(() => setIsTyping(false));
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
  
    // Check if the message contains any hash mentions
    const hashMatches = input.trim().match(/@([a-f0-9]{64})/g);
    if (hashMatches) {
      try {
        // Extract all hashes without the @ symbol
        const hashes = hashMatches.map(match => match.slice(1));
        let updatedMessages = [...messages, userMessage];
        
        // Process hashes sequentially
        for (const hash of hashes) {
          const context = await fetchCatalogContext(hash);
          const formattedContext = context.replace(/\n/g, '\n');
          const hashResponse = {
            role: 'assistant',
            content: `${formattedContext}`
          };
          updatedMessages = [...updatedMessages, hashResponse];
          setMessages(updatedMessages);
          // Wait for state update
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Process the message without the hash part
        const messageWithoutHash = input.trim().replace(/@[a-f0-9]{64}/g, '').trim();
        if (messageWithoutHash) {
          // Create a new user message for the remaining text
          const followUpMessage = { role: 'user', content: messageWithoutHash };
          updatedMessages = [...updatedMessages, followUpMessage];
          setMessages(updatedMessages);
          
          // Add thinking indicator
          setMessages(prev => [...prev, { role: 'assistant', content: '...', isThinking: true }]);
    
          try {
            // Call Ollama API with complete chat history
            const response = await fetch('http://localhost:11434/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: selectedModel,
                messages: updatedMessages.filter(m => !m.isThinking),
                stream: false
              }),
            });
    
            if (!response.ok) {
              throw new Error(`Error: ${response.statusText}`);
            }
    
            const data = await response.json();
            
            // Remove thinking indicator and add actual response
            setMessages(prev => [
              ...prev.filter(m => !m.isThinking),
              { role: 'assistant', content: data.message?.content || 'No response from model' }
            ]);
          } catch (err) {
            // Handle API call error
            setMessages(prev => [
              ...prev.filter(m => !m.isThinking),
              { role: 'error', content: `Error: ${err.message}. Make sure Ollama is running with the selected model.` }
            ]);
          }
        }
      } catch (err) {
        setMessages(prev => [
          ...prev,
          {
            role: 'error',
            content: 'Failed to fetch catalog context. Please check the hash and try again.'
          }
        ]);
      }
      setIsLoading(false);
      return;
    }
  
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

      // Call Ollama API
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [...messages.filter(m => !m.isThinking), userMessage],
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Remove thinking indicator and add actual response
      setMessages(prev => [
        ...prev.filter(m => !m.isThinking),
        { role: 'assistant', content: data.message?.content || 'No response from model' }
      ]);
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Remove thinking indicator and add error message
      setMessages(prev => [
        ...prev.filter(m => !m.isThinking),
        { role: 'error', content: `Error: ${err.message}. Make sure Ollama is running with llama3 model.` }
      ]);
      setError(err.message);
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
    <div className={`h-full w-full flex flex-col bg-gray-900 text-gray-200 ${className}`}>
      <div className="p-2 bg-gray-800 border-b border-gray-700 flex items-center">
        <div className="text-center flex-grow">Chatbot</div>
        <button
          onClick={() => setShowCommands(!showCommands)}
          className="mr-2 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
        >
          {showCommands ? 'Hide Commands' : 'Show Commands'}
        </button>
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
            <option value="llama3">llama3</option>
          )}
        </select>
        <button 
          onClick={clearChat}
          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
        >
          Clear
        </button>
      </div>
      
      {showCommands && (
        <div className="bg-gray-800 p-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold mb-2">Available Commands:</h3>
          <ul className="text-sm space-y-1 text-gray-300">
            <li>- "read the testing.txt", "show contents of testing.txt"</li>
            <li>- "list files in downloads"</li>
            <li>- "where am i"</li>
            <li>- "make directory testing"</li>
            <li>- "delete file testing.txt"</li>
          </ul>
        </div>
      )}
      
      {error && (
        <div className="bg-red-900 text-red-100 p-2 text-sm">
          {error}
          <button 
            onClick={fetchModels}
            className="ml-2 px-2 py-0.5 bg-red-800 hover:bg-red-700 rounded text-xs"
          >
            Retry
          </button>
        </div>
      )}
      
      <div className="flex-1 p-4 overflow-y-auto">
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
            {isTyping && (
              <div className="absolute right-2 bottom-2 text-xs text-gray-400">
                typing...
              </div>
            )}
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
        <div className="text-xs text-gray-500 mt-2 flex justify-between items-center">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{input.length} characters</span>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPanel;

const fetchCatalogContext = async (hash) => {
  try {
    const response = await fetch(`http://localhost:4321/api/card-collection?action=get&hash=${hash}`);
    const data = await response.json();
    
    if (data.success && data.card) {
      const cardContent = JSON.parse(data.card.content);
      return cardContent.context;
    }
    return 'Failed to fetch context';
  } catch (error) {
    console.error('Error fetching catalog context:', error);
    return 'Error fetching context';
  }
};
