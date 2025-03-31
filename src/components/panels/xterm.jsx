import React, { useEffect, useRef, useState } from 'react';

// Client-side only component
const XtermPanel = ({ className = '' }) => {
  // Remove unused state variables
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [xtermLoaded, setXtermLoaded] = useState(false);
  const [isLazygitActive, setIsLazygitActive] = useState(false);
  
  const terminalRef = useRef(null);
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
    
    // Create a simple terminal first to show something is working
    const createSimpleTerminal = () => {
      setXtermLoaded(true);
      
      // Load CSS first
      import('xterm/css/xterm.css').catch(err => {
        console.error('Failed to load xterm CSS:', err);
      });
      
      // Wait for DOM to be ready
      setTimeout(initializeTerminal, 300);
    };
    
    // Wait for DOM to be ready
    const initializeTerminal = async () => {
      if (!mountedRef.current) return;
      
      try {
        // Check if terminal container exists
        if (!terminalRef.current) {
          console.log('Terminal container not ready, retrying in 100ms');
          setTimeout(initializeTerminal, 100);
          return;
        }
        
        console.log('Loading xterm modules...');
        
        // Import modules
        const xtermModule = await import('xterm');
        const fitAddonModule = await import('xterm-addon-fit');
        
        if (!mountedRef.current) return;
        
        console.log('Initializing terminal...');
        
        // Initialize terminal
        const Terminal = xtermModule.Terminal;
        const FitAddon = fitAddonModule.FitAddon;
        
        const terminal = new Terminal({
          cursorBlink: true,
          theme: {
            background: '#1e1e1e',
            foreground: '#f0f0f0',
          },
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          fontSize: 14,
          lineHeight: 1.2,
          convertEol: true,
        });
        
        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        
        xtermRef.current = terminal;
        fitAddonRef.current = fitAddon;
        
        // Open terminal in the container
        console.log('Opening terminal...');
        terminal.open(terminalRef.current);
        
        terminal.element.style.padding = "10px";

        // Fit terminal immediately
        try {
          fitAddon.fit();
        } catch (e) {
          console.error('Error fitting terminal:', e);
        }
        
        // Write initial message
        terminal.writeln('Terminal initialized');
        terminal.writeln('\x1b[34mConnecting to terminal server...\x1b[0m');
        
        // Set up terminal input handling
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
              
              // Send terminal size to server
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
              
              // Send terminal size to server
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
        
        if (terminalRef.current) {
          resizeObserver.observe(terminalRef.current);
        }
        
      } catch (err) {
        console.error('Failed to initialize terminal:', err);
        setError('Failed to initialize terminal: ' + err.message);
      }
    };
    
    // Start with a simple terminal first
    createSimpleTerminal();
    
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
          console.error('Error disposing terminal:', err);
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

      console.log('Connecting to WebSocket server...');
      const ws = new WebSocket('ws://localhost:3001');
      socketRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        
        if (xtermRef.current) {
          xtermRef.current.writeln('\x1b[32mConnected to terminal server\x1b[0m');
          
          // Send initial terminal size
          const { cols, rows } = xtermRef.current;
          ws.send(JSON.stringify({ 
            type: 'resize', 
            cols, 
            rows 
          }));
          
          // Set custom prompt to use username
          ws.send(JSON.stringify({
            type: 'input',
            data: 'export PS1="\\[\\e[32m\\]$(whoami)\\[\\e[0m\\]$ "\r'
          }));
        }
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'output' && xtermRef.current) {
            xtermRef.current.write(message.data);
          }
        } catch (err) {
          console.error('Error processing message:', err);
        }
      };

      ws.onerror = (error) => {
        if (!mountedRef.current) return;
        console.error('WebSocket error:', error);
        setIsConnected(false);
        setError('Failed to connect to terminal server. Make sure the server is running.');
        
        if (xtermRef.current) {
          xtermRef.current.writeln('\x1b[31mError: Failed to connect to terminal server\x1b[0m');
          xtermRef.current.writeln('\x1b[31mMake sure the server is running at ws://localhost:3001\x1b[0m');
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
          xtermRef.current.writeln('\x1b[31mDisconnected from terminal server\x1b[0m');
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
      console.error('Terminal connection error:', err);
      setError(`Terminal connection error: ${err.message}`);
      
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

  const clearTerminal = () => {
    if (xtermRef.current) {
      // If Lazygit is active, we need to terminate it first
      if (isLazygitActive && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        // Send escape key and q to exit Lazygit
        socketRef.current.send(JSON.stringify({
          type: 'input',
          data: '\u001b' // Escape key
        }));
        
        // Small delay to ensure escape is processed
        setTimeout(() => {
          socketRef.current.send(JSON.stringify({
            type: 'input',
            data: 'q' // Quit Lazygit
          }));
          
          // Wait for Lazygit to exit before clearing
          setTimeout(() => {
            performClear();
          }, 300);
        }, 100);
        
        // Update state
        setIsLazygitActive(false);
      } else {
        // If Lazygit is not active, clear immediately
        performClear();
      }
    }
  };
  
  // Helper function to perform the actual terminal clearing
  const performClear = () => {
    if (!xtermRef.current) return;
    
    // Clear the terminal display
    xtermRef.current.clear();
    
    // Reset terminal state
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      // Kill any running processes and clear the terminal
      socketRef.current.send(JSON.stringify({
        type: 'input',
        data: '\u0003' // Ctrl+C to interrupt any running process
      }));
      
      // Small delay to ensure Ctrl+C is processed
      setTimeout(() => {
        // Send clear and reset commands
        socketRef.current.send(JSON.stringify({
          type: 'input',
          data: 'clear && reset\r'
        }));
        
        // Re-initialize the prompt
        setTimeout(() => {
          if (xtermRef.current && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            xtermRef.current.writeln('\x1b[32mTerminal clear\x1b[0m');
            
            // Set custom prompt to use username again
            socketRef.current.send(JSON.stringify({
              type: 'input',
              data: 'export PS1="\\[\\e[32m\\]$(whoami)\\[\\e[0m\\]$ "\r'
            }));
          }
        }, 100);
      }, 100);
    } else {
      // If not connected, just show a message
      xtermRef.current.writeln('\x1b[32mTerminal cleared\x1b[0m');
    }
  };

  const launchLazygit = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && xtermRef.current) {
      // First ensure terminal is properly sized
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
          const { cols, rows } = xtermRef.current;
          socketRef.current.send(JSON.stringify({ 
            type: 'resize', 
            cols, 
            rows 
          }));
        } catch (e) {
          console.error('Error fitting terminal before lazygit:', e);
        }
      }
      
      // Send command to launch lazygit
      socketRef.current.send(JSON.stringify({
        type: 'input',
        data: 'lazygit\r'
      }));
      
      setIsLazygitActive(true);
      
      // Add message about exiting
      if (xtermRef.current) {
        xtermRef.current.writeln('\x1b[33mLaunching Lazygit...\x1b[0m');
        xtermRef.current.writeln('\x1b[33mPress "q" to quit Lazygit when finished\x1b[0m');
      }
    } else {
      setError('Cannot launch Lazygit: Terminal not connected');
    }
  };

  // Handle Lazygit exit detection
  useEffect(() => {
    if (!isLazygitActive) return;
    
    const checkForLazygitExit = (e) => {
      // Check for 'q' key press which might indicate exiting Lazygit
      if (e.key === 'q' && isLazygitActive) {
        // We don't immediately set to false as the user might be typing 'q' in another context
        // Instead, we'll check after a short delay if we're back at the prompt
        setTimeout(() => {
          if (xtermRef.current) {
            // This is a simple heuristic - we assume we're back at the prompt if Lazygit has exited
            setIsLazygitActive(false);
          }
        }, 500);
      }
    };
    
    window.addEventListener('keydown', checkForLazygitExit);
    
    return () => {
      window.removeEventListener('keydown', checkForLazygitExit);
    };
  }, [isLazygitActive]);

  // Render a fallback UI while xterm is loading
  if (!xtermLoaded) {
    return (
      <div className={`h-full w-full flex flex-col bg-gray-900 text-gray-200 font-mono ${className}`}>
        <div className="p-2 bg-gray-800 border-b border-gray-700 flex items-center">
          <div className="flex space-x-2 mr-4">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-center flex-grow">Terminal</div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400">Loading terminal...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full flex flex-col bg-gray-900 text-gray-200 font-mono ${className}`}>
      <div className="p-2 bg-gray-800 border-b border-gray-700 flex items-center">
        <div className="flex space-x-2 mr-4">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-center flex-grow">Terminal {isLazygitActive ? '- Lazygit Active' : ''}</div>
        <div className="flex space-x-2">
          <button 
            onClick={launchLazygit}
            className={`px-2 py-1 text-xs ${isLazygitActive 
              ? 'bg-green-700 hover:bg-green-600' 
              : 'bg-gray-700 hover:bg-gray-600'} rounded`}
            disabled={!isConnected}
          >
            {isLazygitActive ? 'Lazygit Active' : 'Launch Lazygit'}
          </button>
          <button 
            onClick={clearTerminal}
            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
          >
            Clear
          </button>
        </div>
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
        ref={terminalRef}
        className="flex-1 p-0 overflow-hidden"
        style={{ height: 'calc(100% - 80px)' }}
      />
      
      <div className="p-1 bg-gray-800 text-xs text-gray-500 flex justify-between">
        <span>{isConnected ? "Connected" : "Disconnected"}</span>
        <span>xterm.js terminal {isLazygitActive ? '- Lazygit Running' : ''}</span>
      </div>
    </div>
  );
};

export default XtermPanel;