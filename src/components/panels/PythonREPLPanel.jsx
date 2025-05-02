import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import '../../styles/pythonrepl.css';

const PythonREPLPanel = () => {
  const [connected, setConnected] = useState(false);
  const [wsStatus, setWsStatus] = useState('Disconnected');
  const [scriptContent, setScriptContent] = useState('');
  const [selectedHash, setSelectedHash] = useState('');
  const [scriptExecuting, setScriptExecuting] = useState(false);
  const [showScriptViewer, setShowScriptViewer] = useState(false);
  
  const wsRef = useRef(null);
  const terminalRef = useRef(null);
  const terminalDivRef = useRef(null);
  const fitAddonRef = useRef(null);
  
  // Get selected hash from Redux store
  const storeSelectedHash = useSelector(state => state?.content?.selectedHash);
  const cards = useSelector(state => state?.content?.cards || {});
  const dispatch = useDispatch();
  
  // Initialize terminal
  useEffect(() => {
    if (terminalDivRef.current && !terminalRef.current) {
      // Initialize xterm.js terminal
      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Menlo, monospace',
        theme: {
          background: '#1e1e1e',
          foreground: '#f0f0f0',
          cursor: '#f0f0f0',
          selection: 'rgba(170, 170, 170, 0.3)',
        }
      });
      
      // Add fit addon to resize terminal to container
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      
      // Save references
      terminalRef.current = term;
      fitAddonRef.current = fitAddon;
      
      // Open terminal in the container
      term.open(terminalDivRef.current);
      fitAddon.fit();
      
      // Handle terminal input
      term.onData(data => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'input',
            data: data
          }));
        }
      });
      
      // Connect to WebSocket when terminal is ready
      connectWebSocket();
      
      // Handle window resize
      const handleResize = () => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'resize',
              cols: terminalRef.current.cols,
              rows: terminalRef.current.rows
            }));
          }
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      // Clean up
      return () => {
        window.removeEventListener('resize', handleResize);
        if (terminalRef.current) {
          terminalRef.current.dispose();
        }
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    }
  }, []);
  
  // Handle selection change from store
  useEffect(() => {
    if (storeSelectedHash && storeSelectedHash !== selectedHash) {
      setSelectedHash(storeSelectedHash);
      fetchScript(storeSelectedHash);
    }
  }, [storeSelectedHash]);
  
  // Connect to WebSocket server
  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return; // Already connected
    }
    
    try {
      const ws = new WebSocket('ws://localhost:3010');
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        setWsStatus('Connected');
        
        // Send resize info right after connection
        if (terminalRef.current && fitAddonRef.current) {
          fitAddonRef.current.fit();
          ws.send(JSON.stringify({
            type: 'resize',
            cols: terminalRef.current.cols,
            rows: terminalRef.current.rows
          }));
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'output' && terminalRef.current) {
            terminalRef.current.write(message.data);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        setWsStatus('Disconnected');
        
        // Try to reconnect after a delay
        setTimeout(() => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            connectWebSocket();
          }
        }, 3000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsStatus('Error: Failed to connect');
      };
      
      wsRef.current = ws;
      
    } catch (err) {
      console.error('Error connecting to WebSocket:', err);
      setWsStatus('Error: ' + err.message);
    }
  };
  
  // Fetch script content from the database
  const fetchScript = async (hash) => {
    try {
      // Check if we already have the card in Redux store
      if (cards[hash]) {
        processCard(cards[hash]);
        return;
      }
      
      // Otherwise fetch from API
      const response = await fetch(`/api/card-collection?action=get&hash=${hash}`);
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success && data.card) {
        // Add to Redux store for future use
        dispatch({
          type: 'content/addCard',
          payload: {
            hash,
            card: data.card
          }
        });
        
        processCard(data.card);
      } else {
        throw new Error('Failed to fetch card: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching script:', error);
      setScriptContent('# Error fetching script: ' + error.message);
    }
  };
  
  // Process the fetched card content
  const processCard = (card) => {
    if (!card) return;
    
    // Check if the content is a Buffer (binary)
    if (card.contentType && 
        (card.contentType.mimeType === 'text/x-python-script' || 
         card.contentType.mimeType === 'text/x-python' ||
         card.contentType.extension === 'py')) {
      
      // Convert Buffer to string if needed
      if (card.content instanceof Uint8Array || 
          (typeof card.content === 'object' && card.content.type === 'Buffer')) {
        const buffer = card.content instanceof Uint8Array 
          ? card.content 
          : new Uint8Array(card.content.data);
        setScriptContent(new TextDecoder().decode(buffer));
      } else if (typeof card.content === 'string') {
        setScriptContent(card.content);
      } else {
        // Try to convert other formats to string
        try {
          setScriptContent(JSON.stringify(card.content, null, 2));
        } catch (e) {
          setScriptContent(String(card.content));
        }
      }
      
      // Show the script viewer
      setShowScriptViewer(true);
    } else {
      setScriptContent('# Selected file is not a Python script');
    }
  };
  
  // Execute the current script
  const executeScript = () => {
    if (!connected || !scriptContent) return;
    
    setScriptExecuting(true);
    
    // Break script into lines
    const lines = scriptContent.split('\n');
    
    // Function to send lines one by one with some delay
    const sendLine = (index) => {
      if (index >= lines.length) {
        setScriptExecuting(false);
        return;
      }
      
      const line = lines[index];
      
      // Skip empty lines
      if (!line.trim()) {
        setTimeout(() => sendLine(index + 1), 10);
        return;
      }
      
      // Send this line to the REPL
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'input',
          data: line + '\r'
        }));
        
        // Wait for execution before sending next line
        setTimeout(() => sendLine(index + 1), 100);
      } else {
        setScriptExecuting(false);
      }
    };
    
    // Start sending lines
    sendLine(0);
  };
  
  // Clear the terminal
  const clearTerminal = () => {
    if (terminalRef.current) {
      terminalRef.current.clear();
    }
  };
  
  // Reset the Python REPL
  const resetREPL = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Send Ctrl+C to interrupt any running code
      wsRef.current.send(JSON.stringify({
        type: 'input',
        data: '\x03'
      }));
      
      // Wait a bit and then try to restart the REPL
      setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'input',
            data: '\r'
          }));
        }
      }, 100);
    }
  };
  
  return (
    <div className="python-repl-panel">
      <div className="repl-header">
        <h2>Python REPL</h2>
        <div className="connection-status">
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
          <span className="status-text">{wsStatus}</span>
        </div>
      </div>
      
      {showScriptViewer && (
        <div className="script-viewer">
          <div className="script-header">
            <h3>Selected Script</h3>
            <div className="script-actions">
              <button 
                className="execute-button" 
                onClick={executeScript} 
                disabled={!connected || scriptExecuting}
              >
                {scriptExecuting ? 'Executing...' : 'Execute Script'}
              </button>
              <button 
                className="hide-button" 
                onClick={() => setShowScriptViewer(false)}
              >
                Hide
              </button>
            </div>
          </div>
          <pre className="script-content">{scriptContent}</pre>
        </div>
      )}
      
      <div className="terminal-section">
        <div className="terminal-header">
          <h3>Python Interactive Console</h3>
          <div className="terminal-actions">
            <button onClick={clearTerminal}>Clear</button>
            <button onClick={resetREPL}>Reset</button>
            {!showScriptViewer && selectedHash && (
              <button onClick={() => setShowScriptViewer(true)}>Show Script</button>
            )}
          </div>
        </div>
        <div className="terminal-container" ref={terminalDivRef}></div>
      </div>
      
      <div className="panel-footer">
        <p>
          Tip: Select a Python file from the catalog to view and execute it.
          The REPL maintains its state between executions.
        </p>
      </div>
    </div>
  );
};

export default PythonREPLPanel;
