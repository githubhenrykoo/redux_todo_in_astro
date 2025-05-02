import React, { useEffect, useRef, useState } from 'react';

// Python REPL Component
const PythonREPL = ({ className = '' }) => {
  // State variables
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [xtermLoaded, setXtermLoaded] = useState(false);
  const [isPythonMode, setIsPythonMode] = useState(false);
  
  const consoleRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const mountedRef = useRef(false);

  // Load xterm.js dynamically on client side
  useEffect(() => {
    // Set mounted flag
    mountedRef.current = true;
    
    // Skip if not in browser
    if (typeof window === 'undefined') return;
    
    // Create a simple console first to show something is working
    const createSimpleConsole = () => {
      setXtermLoaded(true);
      
      // Load CSS first
      import('xterm/css/xterm.css').catch(err => {
        console.error('Failed to load xterm CSS:', err);
      });
      
      // Wait for DOM to be ready
      setTimeout(initializeConsole, 300);
    };
    
    // Wait for DOM to be ready
    const initializeConsole = async () => {
      if (!mountedRef.current) return;
      
      try {
        // Check if console container exists
        if (!consoleRef.current) {
          console.log('Console container not ready, retrying in 100ms');
          setTimeout(initializeConsole, 100);
          return;
        }
        
        console.log('Loading xterm modules...');
        
        // Import modules
        const xtermModule = await import('xterm');
        const fitAddonModule = await import('xterm-addon-fit');
        
        if (!mountedRef.current) return;
        
        console.log('Initializing Python console...');
        
        // Initialize console with Python-friendly colors
        const Terminal = xtermModule.Terminal;
        const FitAddon = fitAddonModule.FitAddon;
        
        const terminal = new Terminal({
          cursorBlink: true,
          theme: {
            background: '#1e1e1e',
            foreground: '#f0f0f0',
            // Python syntax highlighting colors
            black: '#000000',
            red: '#cd3131',
            green: '#0dbc79',
            yellow: '#e5e510',
            blue: '#2472c8',
            magenta: '#bc3fbc',
            cyan: '#11a8cd',
            white: '#e5e5e5',
            brightBlack: '#666666',
            brightRed: '#f14c4c',
            brightGreen: '#23d18b',
            brightYellow: '#f5f543',
            brightBlue: '#3b8eea',
            brightMagenta: '#d670d6',
            brightCyan: '#29b8db',
            brightWhite: '#e5e5e5'
          },
          fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", "Source Code Pro", Menlo, Monaco, "Courier New", monospace',
          fontSize: 14,
          convertEol: true,
          scrollback: 1000,
        });
        
        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        
        xtermRef.current = terminal;
        fitAddonRef.current = fitAddon;
        
        // Open console in the container
        console.log('Opening Python console...');
        terminal.open(consoleRef.current);
        
        terminal.element.style.padding = "10px";

        // Fit console immediately
        try {
          fitAddon.fit();
        } catch (e) {
          console.error('Error fitting console:', e);
        }
        
        // Set up console input handling
        terminal.onData(data => {
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ 
              type: 'input', 
              data: data 
            }));
          }
        });
        
        // Connect to WebSocket server
        connectToServer();
        
        // Handle window resize
        const handleResize = () => {
          if (!mountedRef.current) return;
          if (fitAddonRef.current) {
            try {
              fitAddonRef.current.fit();
              
              // Send console size to server
              if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && xtermRef.current) {
                const { cols, rows } = xtermRef.current;
                socketRef.current.send(JSON.stringify({ 
                  type: 'resize', 
                  cols, 
                  rows 
                }));
              }
            } catch (e) {
              console.error('Error during resize:', e);
            }
          }
        };
        
        window.addEventListener('resize', handleResize);
        
        // Force a resize after a short delay
        setTimeout(handleResize, 500);
        
        // Add resize observer for container size changes
        const resizeObserver = new ResizeObserver(() => {
          if (fitAddonRef.current && mountedRef.current) {
            try {
              fitAddonRef.current.fit();
              
              // Send console size to server
              if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && xtermRef.current) {
                const { cols, rows } = xtermRef.current;
                socketRef.current.send(JSON.stringify({ 
                  type: 'resize', 
                  cols, 
                  rows 
                }));
              }
            } catch (e) {
              console.error('Error during container resize:', e);
            }
          }
        });
        
        if (consoleRef.current) {
          resizeObserver.observe(consoleRef.current);
        }
        
      } catch (err) {
        console.error('Failed to initialize Python console:', err);
        setError('Failed to initialize Python console: ' + err.message);
      }
    };
    
    // Start with a simple console first
    createSimpleConsole();
    
    // Cleanup function
    return () => {
      mountedRef.current = false;
      
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (xtermRef.current) {
        try {
          xtermRef.current.dispose();
        } catch (err) {
          console.error('Error disposing Python console:', err);
        }
      }
    };
  }, []);

  const connectToServer = () => {
    if (!mountedRef.current) return;
    
    try {
      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      console.log('Connecting to Python console server...');
      // Update the WebSocket URL to connect to the Python console server
      const ws = new WebSocket('ws://localhost:3010');
      socketRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        console.log('WebSocket connected to Python console server');
        setIsConnected(true);
        setError(null);
        
        if (xtermRef.current) {
          // Send initial console size
          const { cols, rows } = xtermRef.current;
          ws.send(JSON.stringify({ 
            type: 'resize', 
            cols, 
            rows 
          }));
          
          // Python REPL will start automatically from the server
        }
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'output' && xtermRef.current) {
            xtermRef.current.write(message.data);
            
            // Check if Python REPL has started
            if (message.data.includes('Python ') && message.data.includes('Type "help"')) {
              setIsPythonMode(true);
            }
          }
        } catch (err) {
          console.error('Error processing message:', err);
        }
      };

      ws.onerror = (error) => {
        if (!mountedRef.current) return;
        console.error('WebSocket error:', error);
        setIsConnected(false);
        setError('Failed to connect to Python console server. Make sure the server is running.');
        
        if (xtermRef.current) {
          xtermRef.current.writeln('\x1b[31mError: Failed to connect to Python console server\x1b[0m');
          xtermRef.current.writeln('\x1b[31mMake sure the server is running at ws://localhost:3010\x1b[0m');
          xtermRef.current.writeln('\x1b[34mAttempting to reconnect in 5 seconds...\x1b[0m');
        }
        
        // Set up reconnection
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!mountedRef.current) return;
          if (xtermRef.current) {
            xtermRef.current.writeln('\x1b[34mAttempting to reconnect...\x1b[0m');
          }
          connectToServer();
        }, 5000);
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        console.log('WebSocket closed');
        setIsConnected(false);
        
        if (xtermRef.current) {
          xtermRef.current.writeln('\x1b[31mDisconnected from Python console server\x1b[0m');
          xtermRef.current.writeln('\x1b[34mAttempting to reconnect in 5 seconds...\x1b[0m');
        }
        
        // Set up reconnection
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!mountedRef.current) return;
          if (xtermRef.current) {
            xtermRef.current.writeln('\x1b[34mAttempting to reconnect...\x1b[0m');
          }
          connectToServer();
        }, 5000);
      };
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('Python console connection error:', err);
      setError(`Python console connection error: ${err.message}`);
      
      // Set up reconnection
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        if (xtermRef.current) {
          xtermRef.current.writeln('\x1b[34mAttempting to reconnect...\x1b[0m');
        }
        connectToServer();
      }, 5000);
    }
  };

  // Function to restart Python REPL
  const restartPythonREPL = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && xtermRef.current) {
      // Send command to restart Python
      socketRef.current.send(JSON.stringify({
        type: 'input',
        data: '\x03\r' // Ctrl+C to interrupt any running code
      }));
      
      setTimeout(() => {
        socketRef.current.send(JSON.stringify({
          type: 'input',
          data: 'python3\r'
        }));
      }, 100);
      
      if (xtermRef.current) {
        xtermRef.current.writeln('\x1b[33mRestarting Python REPL...\x1b[0m');
      }
    } else {
      setError('Cannot restart Python: Console not connected');
    }
  };

  // Render a fallback UI while xterm is loading
  if (!xtermLoaded) {
    return (
      <div className={`h-full w-full flex flex-col bg-gray-900 text-gray-200 font-mono ${className}`}>
        <div className="p-2 bg-gray-800 border-b border-gray-700 flex items-center">
          <div className="text-center flex-grow">Python Console</div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400">Loading Python console...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Console container */}
      <div 
        ref={consoleRef} 
        className="flex-1 overflow-hidden bg-black"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-gray-800 text-white text-xs">
        <div className="flex items-center space-x-3">
          {isConnected ? (
            <span className="text-green-400">Connected to Python REPL</span>
          ) : (
            <span className="text-red-400">Disconnected</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={restartPythonREPL}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
            disabled={!isConnected}
          >
            Restart Python
          </button>
          {error && <span className="text-red-400">{error}</span>}
        </div>
      </div>
    </div>
  );
};

// Export the component
const PythonREPLPanel = PythonREPL;
export default PythonREPLPanel;
