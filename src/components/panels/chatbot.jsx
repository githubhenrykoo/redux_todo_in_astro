import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setMessages, 
  setInput, 
  setLoading, 
  setError, 
  setModels, 
  setSelectedModel 
} from '../../features/chatbotSlice';

const ChatbotPanel = ({ className = '' }) => {
  // Add local state for mentions
  const [mentions, setMentions] = useState([]);
  
  const dispatch = useDispatch();
  const {
    messages,
    input,
    isLoading,
    error,
    models,
    selectedModel
  } = useSelector(state => state.chatbot);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const terminalSocketRef = useRef(null);

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    dispatch(setInput(e.target.value));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const fetchModels = async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      const data = await response.json();
      dispatch(setModels(data.models || []));
    } catch (err) {
      console.error('Error fetching models:', err);
      dispatch(setError('Failed to connect to Ollama server. Make sure it\'s running on http://localhost:11434'));
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const timestamp = new Date().toLocaleTimeString();
    
    // Save chat action to playwright-state.json
    // In the sendMessage function, update the fetch calls:
    
    // First fetch call for user message
    try {
      await fetch('/api/update-playwright-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'chat',
          userMessage: input.trim(),
          timestamp: new Date().toISOString(),
          status: 'active',
          logs: [{
            timestamp: new Date().toLocaleTimeString(),
            message: `User: ${input.trim()}`,
            type: 'chat'
          }]
        })
      });
    } catch (err) {
      console.error('Error saving chat state:', err);
    }

    // Second fetch call for LLM response
    try {
      await fetch('/api/update-playwright-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'chat',
          llmResponse: data.message?.content || 'No response from model',
          model: selectedModel,
          timestamp: new Date().toISOString(),
          status: 'active',
          logs: [{
            timestamp: new Date().toLocaleTimeString(),
            message: `Assistant (${selectedModel}): ${data.message?.content || 'No response from model'}`,
            type: 'chat'
          }]
        })
      });
    } catch (err) {
      console.error('Error saving LLM response:', err);
    }

    dispatch(setMessages([...messages, userMessage]));
    dispatch(setInput(''));
    dispatch(setLoading(true));
    dispatch(setError(null));

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
      dispatch(setLoading(false));
      return;
    }

    try {
      // Add thinking indicator
      dispatch(setMessages([...messages, userMessage, { role: 'assistant', content: '...', isThinking: true }]));

      // Call Ollama API
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [...messages, userMessage].filter(m => !m.isThinking),
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Save LLM response to playwright-state.json
      try {
        await fetch('/api/update-playwright-state', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'chat',
            llmResponse: data.message?.content || 'No response from model',
            model: selectedModel,
            timestamp: new Date().toISOString(),
            status: 'active',
            logs: [{
              timestamp: new Date().toLocaleTimeString(),
              message: `Assistant (${selectedModel}): ${data.message?.content || 'No response from model'}`,
              type: 'chat'
            }]
          })
        });
      } catch (err) {
        console.error('Error saving LLM response:', err);
      }

      // Remove thinking indicator and add actual response
      dispatch(setMessages([
        ...messages,
        userMessage,
        { role: 'assistant', content: data.message?.content || 'No response from model' }
      ]));
    } catch (err) {
      console.error('Error sending message:', err);
      dispatch(setMessages([
        ...messages,
        userMessage,
        { role: 'error', content: `Error: ${err.message}. Make sure Ollama is running with llama3 model.` }
      ]));
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
};

  const clearChat = () => {
    setMessages([
      { role: 'system', content: 'How can I help?' }
    ]);
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
        <div className="text-center flex-grow">ChatBot - MCP</div>
        {/* Word Select button removed */}
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
              {message.role !== 'user' && message.role !== 'system' && message.role !== 'error' && (
                <div className="text-xs text-gray-400 mt-1">
                  System
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-start">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="flex-grow p-2 bg-gray-800 text-white rounded-lg resize-none h-12 max-h-32 min-h-[3rem]"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className={`ml-2 px-4 py-2 rounded-lg ${
              isLoading || !input.trim() 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
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
        <div className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default ChatbotPanel;


// Add this function before sendMessage
const processNaturalLanguageCommand = (text) => {
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
  
  const readPattern = /(?:read|show|display|open)\s+(?:contents\s+of\s+|the\s+)?(?:file\s+)?["']?([^"']+?)["']?\s*$/i;
  const listPattern = /(?:list|show)\s+(?:files|directory|contents)\s*(?:in\s+)?(.+)?/i;
  const mkdirPattern = /(?:make|create)\s+(?:a\s+)?(?:new\s+)?directory\s+(?:named\s+)?(.+)/i;
  const removePattern = /(?:remove|delete)\s+(?:the\s+)?(?:file|directory)?\s+(.+)/i;
  
  let command = '';
  
  if (readPattern.test(text)) {
    const match = text.match(readPattern);
    const filename = match[1].trim();
    command = `cat "${filename}"`;
  } else if (listPattern.test(text)) {
    const match = text.match(listPattern);
    command = `ls ${match[1] ? `"${match[1].trim()}"` : ''}`.trim();
  } else if (mkdirPattern.test(text)) {
    const match = text.match(mkdirPattern);
    command = `mkdir "${match[1].trim()}"`;
  } else if (removePattern.test(text)) {
    const match = text.match(removePattern);
    command = `rm "${match[1].trim()}"`;
  } else if (text.toLowerCase().includes('current directory') || text.toLowerCase().includes('where am i')) {
    command = 'pwd';
  } else if (text.toLowerCase().includes('clear screen')) {
    command = 'clear';
  }
  
  return command;
};