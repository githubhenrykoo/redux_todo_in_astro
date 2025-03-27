import React, { useEffect, useRef, useState } from 'react';

const XtermPanel = ({ className = '' }) => {
  const [output, setOutput] = useState([
    { text: 'Terminal', type: 'header' },
    { text: 'Connecting to terminal server...', type: 'info' }
  ]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const socketRef = useRef(null);
  const outputRef = useRef(null);
  const inputRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket server
    connectToServer();

    return () => {
      // Clean up WebSocket connection
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when output changes
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const connectToServer = () => {
    try {
      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      const ws = new WebSocket('ws://localhost:3001');
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        setOutput(prev => [
          ...prev,
          { text: 'Connected to terminal server', type: 'success' }
        ]);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'output') {
          // Process terminal output
          const lines = message.data.split('\n');
          lines.forEach(line => {
            if (line.trim()) {
              setOutput(prev => [...prev, { 
                text: line, 
                type: 'terminal'
              }]);
            }
          });
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
        setError('Failed to connect to terminal server. Make sure the server is running.');
        setOutput(prev => [
          ...prev,
          { text: 'Error: Failed to connect to terminal server', type: 'error' },
          { text: 'Make sure the server is running at ws://localhost:3001', type: 'error' },
          { text: 'Attempting to reconnect in 5 seconds...', type: 'info' }
        ]);
        
        // Set up reconnection
        reconnectTimeoutRef.current = setTimeout(() => {
          setOutput(prev => [...prev, { text: 'Attempting to reconnect...', type: 'info' }]);
          connectToServer();
        }, 5000);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setOutput(prev => [
          ...prev,
          { text: 'Disconnected from terminal server', type: 'error' },
          { text: 'Attempting to reconnect in 5 seconds...', type: 'info' }
        ]);
        
        // Set up reconnection
        reconnectTimeoutRef.current = setTimeout(() => {
          setOutput(prev => [...prev, { text: 'Attempting to reconnect...', type: 'info' }]);
          connectToServer();
        }, 5000);
      };
    } catch (err) {
      console.error('Terminal connection error:', err);
      setError(`Terminal connection error: ${err.message}`);
      
      // Set up reconnection
      reconnectTimeoutRef.current = setTimeout(() => {
        setOutput(prev => [...prev, { text: 'Attempting to reconnect...', type: 'info' }]);
        connectToServer();
      }, 5000);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateHistory(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateHistory(1);
    }
  };

  const navigateHistory = (direction) => {
    if (commandHistory.length === 0) return;
    
    const newIndex = historyIndex + direction;
    
    if (newIndex >= -1 && newIndex < commandHistory.length) {
      setHistoryIndex(newIndex);
      if (newIndex === -1) {
        setInput('');
      } else {
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    }
  };

  const sendCommand = () => {
    if (!input.trim() || !isConnected) return;

    // Add command to history
    setCommandHistory(prev => [...prev, input]);
    setHistoryIndex(-1);

    // Add command to output
    setOutput(prev => [...prev, { text: `$ ${input}`, type: 'command' }]);

    // Send command to server
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ 
        type: 'input', 
        data: input + '\n' 
      }));
    }

    // Clear input
    setInput('');
  };

  const clearTerminal = () => {
    setOutput([{ text: 'Terminal cleared', type: 'info' }]);
  };

  return (
    <div className={`h-full w-full flex flex-col bg-gray-900 text-gray-200 font-mono ${className}`}>
      <div className="p-2 bg-gray-800 border-b border-gray-700 flex items-center">
        <div className="flex space-x-2 mr-4">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-center flex-grow">Terminal</div>
        <button 
          onClick={clearTerminal}
          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
        >
          Clear
        </button>
      </div>
      
      {error && (
        <div className="bg-red-900 text-red-100 p-2 text-sm">
          {error}
          <button 
            onClick={connectToServer}
            className="ml-2 px-2 py-0.5 bg-red-800 hover:bg-red-700 rounded text-xs"
          >
            Retry
          </button>
        </div>
      )}
      
      <div 
        ref={outputRef}
        className="flex-1 p-2 overflow-y-auto"
      >
        {output.map((line, index) => (
          <div 
            key={index} 
            className={`mb-1 ${
              line.type === 'error' ? 'text-red-400' : 
              line.type === 'info' ? 'text-blue-400' : 
              line.type === 'success' ? 'text-green-400' :
              line.type === 'command' ? 'text-yellow-400 font-bold' :
              line.type === 'header' ? 'text-white font-bold text-lg mb-2' :
              'text-gray-200'
            }`}
          >
            {line.text}
          </div>
        ))}
      </div>
      
      <div className="p-2 border-t border-gray-700 flex items-center">
        <span className="text-green-400 mr-2">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-grow bg-transparent outline-none text-white"
          placeholder={isConnected ? "Enter command..." : "Connecting..."}
          disabled={!isConnected}
          autoFocus
        />
      </div>
      
      <div className="p-1 bg-gray-800 text-xs text-gray-500 flex justify-between">
        <span>{isConnected ? "Connected" : "Disconnected"}</span>
        <span>Use ↑↓ for history</span>
      </div>
    </div>
  );
};

export default XtermPanel;