import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addOutput, setStatus } from '../../features/pythonreplSlice';
import '../../styles/pythonrepl.css';

// Python REPL Component
const PythonREPL = ({ className = '' }) => {
  // State variables
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [xtermLoaded, setXtermLoaded] = useState(false);
  const [isPythonMode, setIsPythonMode] = useState(false);
  const [scriptContent, setScriptContent] = useState('');
  const [selectedHash, setSelectedHash] = useState('');
  const [showScriptViewer, setShowScriptViewer] = useState(false);
  const [scriptExecuting, setScriptExecuting] = useState(false);
  const [terminalTitle, setTerminalTitle] = useState('Python REPL');
  const [isTerminalLoading, setIsTerminalLoading] = useState(true);
  
  const consoleRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const mountedRef = useRef(false);
  const outputBufferRef = useRef([]);
  const outputTimeoutRef = useRef(null);

  // Get selected hash from Redux store
  const storeSelectedHash = useSelector(state => state?.content?.selectedHash);
  const cards = useSelector(state => state?.content?.cards || {});
  const executeScriptAction = useSelector(state => state?.pythonrepl?.executeScript);
  const resetReplAction = useSelector(state => state?.pythonrepl?.resetREPL);
  const clearReplAction = useSelector(state => state?.pythonrepl?.clearREPL);
  const inputSubmission = useSelector(state => state?.pythonrepl?.submitInput);
  const dispatch = useDispatch();

  // Handle selection change from store
  useEffect(() => {
    if (storeSelectedHash && storeSelectedHash !== selectedHash) {
      setSelectedHash(storeSelectedHash);
      fetchScript(storeSelectedHash);
    }
  }, [storeSelectedHash]);

  // Listen for executeScript Redux action
  useEffect(() => {
    if (executeScriptAction && executeScriptAction.payload) {
      const { content } = executeScriptAction.payload;
      if (content) {
        setScriptContent(content);
        executeScript(content);
      }
    }
  }, [executeScriptAction]);

  // Listen for resetREPL and clearREPL Redux actions
  useEffect(() => {
    if (resetReplAction) {
      resetREPL();
    }
  }, [resetReplAction]);

  useEffect(() => {
    if (clearReplAction) {
      clearTerminal();
    }
  }, [clearReplAction]);

  // Listen for input submission
  useEffect(() => {
    if (inputSubmission && inputSubmission.payload && inputSubmission.payload.input) {
      const { input } = inputSubmission.payload;
      
      // Send input to the terminal
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'input',
          data: input + '\r'
        }));
        
        // Add input to the terminal display
        if (xtermRef.current) {
          xtermRef.current.write(input + '\r');
        }
        
        // Reset status to running
        dispatch(setStatus({ status: 'running' }));
      }
    }
  }, [inputSubmission]);

  // Function to buffer and batch output updates to Redux
  const addOutputToRedux = (text) => {
    // Debug logging
    console.log('Adding to Redux:', text);
    
    // Add to local buffer
    outputBufferRef.current.push(text);
    
    // Clear existing timeout
    if (outputTimeoutRef.current) {
      clearTimeout(outputTimeoutRef.current);
    }
    
    // Set new timeout to dispatch buffered output
    outputTimeoutRef.current = setTimeout(() => {
      // Dispatch all buffered output
      if (outputBufferRef.current.length > 0) {
        outputBufferRef.current.forEach(line => {
          console.log('Dispatching output:', line);
          dispatch(addOutput({ output: line }));
        });
        // Clear buffer
        outputBufferRef.current = [];
      }
    }, 50); // Reduce batch time for more responsive updates
  };

  // Function to check if server is running via direct fetch
  const checkServerConnection = async () => {
    try {
      console.log("Checking if Python server is running...");
      const response = await fetch('http://localhost:3010/health', { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        console.log("Python server is running!");
        return true;
      } else {
        console.warn("Python server health check failed:", response.status);
        return false;
      }
    } catch (error) {
      console.error("Python server is not running:", error);
      return false;
    }
  };

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
        
        // Clean up event listener on component unmount
        return () => {
          window.removeEventListener('resize', handleResize);
        };
      } catch (err) {
        console.error('Failed to initialize Python console:', err);
        setError('Failed to initialize Python console: ' + err.message);
      }
    };
    
    // Start by creating a simple console
    createSimpleConsole();
    
    // Clean up on component unmount
    return () => {
      console.log('Cleaning up Python console');
      mountedRef.current = false;
      
      // Close WebSocket if it's open
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      // Clear reconnect timeout
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

  // Handle output from the Python server
  const handleSocketMessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'output') {
        // Add to terminal
        if (xtermRef.current) {
          xtermRef.current.write(data.data);
        }
        
        // Forward to the Script Execution Panel
        window.postMessage({
          type: 'pythonrepl/output',
          output: data.data
        }, '*');
        
        console.log('Python output:', data.data);
      }
    } catch (err) {
      console.error('Error handling websocket message:', err);
    }
  };

  // WebSocket connection for Python REPL
  useEffect(() => {
    // Only attempt to connect if the WebSocket isn't already connected
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      try {
        console.log('Connecting to Python WebSocket server...');
        socketRef.current = new WebSocket('ws://localhost:3010');
        
        socketRef.current.onopen = () => {
          console.log('Connected to Python WebSocket server');
          setIsConnected(true);
          
          if (xtermRef.current) {
            xtermRef.current.writeln('\x1b[32m=== Connected to Python REPL ===\x1b[0m');
          }
        };
        
        socketRef.current.onmessage = handleSocketMessage;
        
        socketRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
          
          if (xtermRef.current) {
            xtermRef.current.writeln('\x1b[31m=== Error connecting to Python REPL ===\x1b[0m');
          }
        };
        
        socketRef.current.onclose = () => {
          console.log('WebSocket connection closed');
          setIsConnected(false);
          
          if (xtermRef.current) {
            xtermRef.current.writeln('\x1b[31m=== Disconnected from Python REPL ===\x1b[0m');
          }
        };
      } catch (err) {
        console.error('Error establishing WebSocket connection:', err);
        setIsConnected(false);
      }
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

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

  useEffect(() => {
    // Update the terminal title based on the selected hash
    if (storeSelectedHash) {
      const card = cards[storeSelectedHash];
      const title = card?.metadata?.filename || card?.hash?.substring(0, 8);
      setTerminalTitle(title ? `Python: ${title}` : 'Python REPL');
    } else {
      setTerminalTitle('Python REPL');
    }

    // Start Python REPL automatically when component loads
    const autoStartREPL = () => {
      console.log("Auto-starting Python REPL");
      if (!isConnected && !isTerminalLoading) {
        startPythonREPL();
      }
    };
    
    // Add a short delay to let terminal finish loading
    if (xtermLoaded && !isPythonMode) {
      setTimeout(autoStartREPL, 1000);
    }
  }, [storeSelectedHash, xtermLoaded, isPythonMode]);

  // Function to get a direct copy of the latest REPL output
  const getLatestOutput = () => {
    return outputBufferRef.current.concat();
  };

  // Expose getLatestOutput method on window for direct panel communication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.pythonREPL = window.pythonREPL || {};
      window.pythonREPL.getLatestOutput = getLatestOutput;
      window.pythonREPL.sendCommand = (command) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: 'input',
            data: command + '\r'
          }));
          return true;
        }
        return false;
      };
      
      // Force flush all output to Redux store every second
      const intervalId = setInterval(() => {
        if (outputBufferRef.current.length > 0 && dispatch) {
          outputBufferRef.current.forEach(line => {
            dispatch(addOutput({ output: line }));
          });
          outputBufferRef.current = [];
        }
      }, 1000);
      
      return () => {
        clearInterval(intervalId);
        delete window.pythonREPL;
      };
    }
  }, [dispatch]);

  // Helper to flush output immediately
  const flushOutput = () => {
    if (outputBufferRef.current.length > 0 && dispatch) {
      outputBufferRef.current.forEach(line => {
        dispatch(addOutput({ output: line }));
      });
      outputBufferRef.current = [];
    }
  };

  // Add window message support for inter-component communication
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'PYTHON_REPL_REQUEST') {
        if (event.data.action === 'FLUSH_OUTPUT') {
          flushOutput();
        } else if (event.data.action === 'EXECUTE_SCRIPT') {
          const content = event.data.content;
          if (content) {
            executeScript(content);
          }
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Add a listener for dispatched events from the Script Execution Panel
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'pythonrepl/executeScript') {
        console.log('REPL received script execution request:', event.data);
        // Get the script content from the event
        const { content, filename } = event.data.payload;
        
        if (content && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          console.log(`Executing script: ${filename}`);
          
          // Clear any previous output
          if (xtermRef.current) {
            xtermRef.current.writeln('\x1b[33m--- Executing script: ' + filename + ' ---\x1b[0m');
          }
          
          // Execute the script directly
          socketRef.current.send(JSON.stringify({
            type: 'input',
            data: content + '\n'
          }));
        }
      }
    };
    
    // Add window event listener for message events
    window.addEventListener('message', handleMessage);
    
    // Also listen for Redux actions (direct dispatch events)
    const handleReduxAction = () => {
      console.log('Checking Redux action:', window.lastReduxAction);
      if (window.lastReduxAction && window.lastReduxAction.type === 'pythonrepl/executeScript') {
        console.log('Handling Redux action:', window.lastReduxAction);
        const { content, filename } = window.lastReduxAction.payload;
        
        if (content && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          console.log(`Executing script from Redux action: ${filename}`);
          
          // Clear any previous output
          if (xtermRef.current) {
            xtermRef.current.writeln('\x1b[33m--- Executing script: ' + filename + ' ---\x1b[0m');
          }
          
          // Execute the script directly
          socketRef.current.send(JSON.stringify({
            type: 'input',
            data: content + '\n'
          }));
        }
      }
    };
    
    // Check for Redux actions every 500ms
    const checkInterval = setInterval(handleReduxAction, 500);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(checkInterval);
    };
  }, []);

  // Add message handler to forward output to the Script Execution Panel
  useEffect(() => {
    // Function to handle terminal output and forward it
    const forwardOutput = (output) => {
      // Clean the output text
      const cleanOutput = output.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
      
      // Detect if this contains real script output
      const isScriptOutput = cleanOutput.includes("Hello, World!") ||
                             cleanOutput.includes("Nice to meet you") ||
                             cleanOutput.includes("countdown") ||
                             cleanOutput.includes("Blast off");
      
      if (isScriptOutput) {
        console.log('!!! DETECTED IMPORTANT SCRIPT OUTPUT !!!', cleanOutput);
        
        // Forward with special flag for script execution panel
        window.postMessage({
          type: 'pythonrepl/output',
          output: cleanOutput,
          isScriptOutput: true
        }, '*');
      } else {
        // Forward the cleaned output to the Script Execution Panel
        window.postMessage({
          type: 'pythonrepl/output',
          output: cleanOutput
        }, '*');
      }
      
      console.log('Forwarding output to Script Panel:', cleanOutput);
    };
    
    // Modify ws.onmessage to forward output
    const originalWsHandler = socketRef.current?.onmessage;
    if (socketRef.current) {
      socketRef.current.onmessage = (event) => {
        // Call the original handler first
        if (originalWsHandler) {
          originalWsHandler(event);
        }
        
        // Enhanced output forwarding
        try {
          // First try to parse as JSON
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'output') {
              // Log the raw output to help with debugging
              console.log('WEBSOCKET RAW OUTPUT:', data.data);
              
              // Simple script output detection
              if (data.data.includes("Hello, World!") || 
                  data.data.includes("Nice to meet you") || 
                  data.data.includes("countdown") || 
                  data.data.includes("Blast off")) {
                console.log('IMPORTANT SCRIPT OUTPUT DETECTED!', data.data);
                
                // Forward with high priority flag
                window.postMessage({
                  type: 'pythonrepl/output',
                  output: data.data,
                  isScriptOutput: true,
                  highPriority: true
                }, '*');
                
                // Broadcast again with another event type to ensure it's received
                window.postMessage({
                  type: 'pythonrepl/scriptOutput',
                  output: data.data
                }, '*');
                
                // Also attempt direct DOM update as a backup approach
                try {
                  const outputElement = document.querySelector('.python-output');
                  if (outputElement) {
                    // Parse and extract the important parts
                    const lines = data.data.split('\n')
                      .filter(line => !line.trim().startsWith('>>>') && !line.trim().startsWith('...'))
                      .map(line => line.trim());
                    
                    // Add to DOM directly
                    outputElement.textContent += '\n' + lines.join('\n');
                  }
                } catch (domErr) {
                  console.error('Failed direct DOM update:', domErr);
                }
              } else {
                // Regular output processing
                forwardOutput(data.data);
              }
            }
          } catch (jsonErr) {
            // If not JSON, forward the raw event data
            console.log('Forwarding raw WebSocket data:', event.data);
            window.postMessage({
              type: 'pythonrepl/output',
              output: String(event.data)
            }, '*');
          }
        } catch (err) {
          console.error('Error in enhanced output handling:', err);
        }
      };
    }
    
    return () => {
      // Restore the original handler when unmounting
      if (socketRef.current && originalWsHandler) {
        socketRef.current.onmessage = originalWsHandler;
      }
    };
  }, [socketRef.current]);

  // Render a fallback UI while xterm is loading
  if (!xtermLoaded) {
    return (
      <div className="python-repl-panel">
        <div className="repl-header">
          <h2>Python REPL</h2>
          <div className="connection-status">
            <span className="status-text">Loading...</span>
          </div>
        </div>
        <div className="terminal-section loading">
          <div className="loading-indicator">Loading Python console...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="python-repl-panel">
      <div className="repl-header">
        <h2>Python REPL</h2>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span className="status-text">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
    </div>
  );
};

// Export the component
const PythonREPLPanel = PythonREPL;
export default PythonREPLPanel;
