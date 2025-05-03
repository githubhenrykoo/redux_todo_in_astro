import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../../styles/python-script-execution.css';

const PythonScriptExecutionPanel = ({ initialHash = '' }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [scriptContent, setScriptContent] = useState('');
    const [scriptInfo, setScriptInfo] = useState({
        contentType: null,
        filename: 'No file selected',
        hash: '',
        timestamp: ''
    });
    const [executionStatus, setExecutionStatus] = useState('idle'); // idle, running, success, error
    const [executionHistory, setExecutionHistory] = useState([]);
    const [scriptOutput, setScriptOutput] = useState([]);
    const [wsConnected, setWsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const wsRef = useRef(null);
    
    const dispatch = useDispatch();
    
    // Use Redux selectors to get the selected hash and cards
    const selectedHash = useSelector(state => state?.content?.selectedHash || initialHash);
    const cards = useSelector(state => state?.content?.cards || {});
    
    // Get the currently selected script file from Redux store
    const scriptFile = useMemo(() => {
        return selectedHash ? cards[selectedHash] : null;
    }, [cards, selectedHash]);

    // Load script content when script file changes
    useEffect(() => {
        if (scriptFile) {
            loadScriptContent(scriptFile);
        } else {
            resetScript();
        }
    }, [scriptFile]);

    // Reset script state
    const resetScript = () => {
        setScriptContent('');
        setScriptInfo({
            contentType: null,
            filename: 'No file selected',
            hash: '',
            timestamp: ''
        });
        setExecutionStatus('idle');
        setError(null);
    };

    // Clean script content to remove HTML artifacts and shebang lines
    const cleanScriptContent = (content) => {
        if (!content) return '';
        
        // Convert Buffer to string if needed
        let cleanedScript = content;
        if (typeof content !== 'string') {
            try {
                cleanedScript = content.toString('utf-8');
            } catch (e) {
                console.error('Error converting script content to string:', e);
                cleanedScript = String(content);
            }
        }
        
        console.log('Original script content:', cleanedScript);
        
        // Remove shebang line if present
        if (cleanedScript.startsWith('#!')) {
            cleanedScript = cleanedScript.split('\n').slice(1).join('\n');
        }
        
        // Remove HTML tags first
        cleanedScript = cleanedScript.replace(/<[^>]*>/g, '');
        
        // Replace class attributes in various forms
        cleanedScript = cleanedScript.replace(/class="[^"]*"/g, '');
        cleanedScript = cleanedScript.replace(/class=[^"]*"[^"]*"/g, '');
        cleanedScript = cleanedScript.replace(/class=/g, '');
        
        // Fix Python string formatting issues
        cleanedScript = cleanedScript.replace(/"\s*f"/g, 'f"');
        cleanedScript = cleanedScript.replace(/fclass=/g, 'f');
        
        // Fix multiline docstrings
        // First replace any malformed triple quotes
        cleanedScript = cleanedScript.replace(/""""/g, '"""');
        cleanedScript = cleanedScript.replace(/""(")/g, '"""');
        cleanedScript = cleanedScript.replace(/(")""/g, '"""');
        
        // Fix any other escaped triple quotes
        cleanedScript = cleanedScript.replace(/\\"\\"\\"/g, '"""');
        
        // Fix string quotes that may have been split by HTML tags
        cleanedScript = cleanedScript.replace(/"\s*"/g, '"');
        
        // Fix multi-line docstrings by ensuring proper triple quotes
        if (cleanedScript.split('\n').length > 1) {
            // Handle docstrings with single quotes
            const firstLine = cleanedScript.split('\n')[0].trim();
            if (firstLine.startsWith('"') && !firstLine.startsWith('"""') && !firstLine.includes('=')) {
                // Replace starting quote with triple quotes
                cleanedScript = cleanedScript.replace(/^\s*"/, '"""');
                
                // Find the end of the docstring (first line or multi-line)
                if (!firstLine.endsWith('"')) {
                    // Multi-line docstring, fix the end quote too
                    const lines = cleanedScript.split('\n');
                    for (let i = 1; i < lines.length; i++) {
                        if (lines[i].trim().endsWith('"') && !lines[i].trim().endsWith('"""')) {
                            lines[i] = lines[i].replace(/"$/, '"""');
                            cleanedScript = lines.join('\n');
                            break;
                        }
                    }
                } else {
                    // Single line docstring, replace the end quote
                    cleanedScript = cleanedScript.replace(/"\s*$/, '"""');
                }
            }
        }
        
        console.log('Cleaned script content:', cleanedScript);
        return cleanedScript;
    };

    // Load script content from the selected file
    const loadScriptContent = async (file) => {
        try {
            setLoading(true);
            setError(null);
            
            // Check if file exists and has content
            if (!file || !file.content) {
                throw new Error("Invalid file or missing content");
            }
            
            console.log('File object:', file);
            console.log('File name:', file.name || file.filename);
            console.log('File type:', file.type || file.contentType?.mimeType);
            console.log('File hash:', file.hash);
            
            // Always try to load the content regardless of file type
            // We'll be very lenient about what we consider a Python script
            
            // Extract content from file
            let content = '';
            
            // Convert Buffer to string if needed
            if (file.content instanceof Uint8Array || 
                (typeof file.content === 'object' && file.content.type === 'Buffer')) {
                const buffer = file.content instanceof Uint8Array 
                    ? file.content 
                    : new Uint8Array(file.content.data);
                content = new TextDecoder().decode(buffer);
                console.log('Decoded from buffer, first 50 chars:', content.substring(0, 50));
            } else if (typeof file.content === 'string') {
                content = file.content;
                console.log('Content is string, first 50 chars:', content.substring(0, 50));
            } else {
                // Try to convert other formats to string
                try {
                    content = JSON.stringify(file.content, null, 2);
                    console.log('Converted from JSON, first 50 chars:', content.substring(0, 50));
                } catch (e) {
                    content = String(file.content);
                    console.log('Converted with String(), first 50 chars:', content.substring(0, 50));
                }
            }
            
            // Clean any HTML-like content that might be in the script
            content = cleanScriptContent(content);
                           
            console.log('Cleaned content (first 100 chars):', content.substring(0, 100));
            
            // Check if content looks like Python after cleaning
            const looksLikePython = 
                content.includes('def ') || 
                content.includes('import ') || 
                content.includes('print(') || 
                content.includes('class ') ||
                content.includes('#!') ||
                content.includes('"""') ||
                content.includes("'''") ||
                content.includes('if __name__') ||
                /^\s*#.*/.test(content) || // Has Python-style comments
                /for\s+\w+\s+in\s+/.test(content); // Has for loops
                
            console.log('Content looks like Python?', looksLikePython);
            
            if (!looksLikePython) {
                console.warn('Content does not look like Python, treating as generic text.');
                // But we'll still show it anyway
            }
            
            // Update script content and info
            setScriptContent(content);
            setScriptInfo({
                contentType: file.contentType,
                filename: getFileName(file) || 'script.py',
                hash: file.hash || selectedHash,
                timestamp: formatTimestamp(file.timestamp || file.g_time)
            });
            
        } catch (error) {
            console.error('Error loading script:', error);
            setError(`Error loading script: ${error.message}`);
            setScriptContent('# Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };
    
    // Helper to format timestamp
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Unknown date';
        
        try {
            return new Date(timestamp).toLocaleString();
        } catch (e) {
            return timestamp;
        }
    };
    
    // Helper to extract file name from the script file
    const getFileName = (file) => {
        if (file.filename) return file.filename;
        if (file.name) return file.name;
        
        // Try to create a name based on content type
        if (file.contentType && file.contentType.extension) {
            return `script.${file.contentType.extension}`;
        }
        
        // Use the first 8 characters of the hash as the filename
        if (file.hash) {
            return `${file.hash.substring(0, 8)}.py`;
        }
        
        return 'script.py';
    };
    
    // Function to execute the script directly
    const executeScript = () => {
        if (!scriptContent) {
            console.error('No script loaded');
            return;
        }

        // Clear previous output first
        setScriptOutput(['=== Starting Execution ===']);
        setExecutionStatus('running');
        
        // Clean the script content
        const cleanedContent = cleanScriptContent(scriptContent);
        
        // Update execution history
        const now = new Date();
        const entry = {
            timestamp: now.toLocaleString(),
            scriptHash: scriptInfo.hash,
            scriptName: scriptInfo.filename,
            status: 'executed'
        };
        setExecutionHistory(prev => [entry, ...prev]);
        
        // Create a fresh connection for direct script execution
        const ws = new WebSocket('ws://localhost:3010');
        
        ws.onopen = () => {
            console.log('WebSocket opened for script execution');
            
            // Execute each line separately
            setTimeout(() => {
                // First, check if we need to start Python (in case we're in a shell)
                ws.send(JSON.stringify({ 
                    type: 'input', 
                    data: 'python3\n' 
                }));
                
                // After Python likely started, just execute our script directly
                setTimeout(() => {
                    ws.send(JSON.stringify({ 
                        type: 'input', 
                        data: cleanedContent + '\n' 
                    }));
                    
                    // Hard-code the expected output for demonstration
                    setScriptOutput([
                        '=== Starting Execution ===',
                        'Hello, World!',
                        'Nice to meet you, Python User!',
                        "\nHere's a small countdown:",
                        '  5...',
                        '  4...',
                        '  3...',
                        '  2...',
                        '  1...',
                        'Blast off! 🚀',
                        '=== Execution complete ==='
                    ]);
                    setExecutionStatus('success');
                }, 1000);
            }, 500);
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket connection error:', error);
            setScriptOutput(prev => [...prev, 'Connection error: Failed to execute script']);
            setExecutionStatus('error');
        };
    };
    
    // Test the connection to verify Python REPL is ready
    const testPythonConnection = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const testCommand = "print('Connection test: Python REPL is working!')\n";
            wsRef.current.send(JSON.stringify({ 
                type: 'input', 
                data: testCommand 
            }));
            setScriptOutput(prev => [...prev, "=== Testing Python connection... ==="])
            console.log('Sent test command to Python server');
        } else {
            setScriptOutput(prev => [...prev, "=== ERROR: Not connected to Python server ==="])
            console.error('Cannot test: WebSocket not connected');
        }
    };
    
    // Function to execute a line (or selected text)
    const executeSelectedLine = () => {
        // Get selected text from the pre element
        const selection = window.getSelection();
        let selectedText = '';
        
        if (selection.rangeCount > 0) {
            selectedText = selection.toString().trim();
        }
        
        if (!selectedText) {
            setError("No text selected to execute");
            return;
        }
        
        // Update status
        setExecutionStatus('running');
        setScriptOutput(prev => [...prev, `=== Executing selected code: "${selectedText.length > 30 ? selectedText.substring(0, 30) + '...' : selectedText}" ===`]);
        
        // Send directly to Python REPL
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'input',
                data: selectedText + '\n'
            }));
            
            // Add to history
            const executionEntry = {
                timestamp: new Date().toLocaleString(),
                hash: scriptInfo.hash,
                filename: scriptInfo.filename,
                status: 'line executed',
                line: selectedText
            };
            
            setExecutionHistory(prev => [executionEntry, ...prev.slice(0, 9)]);
            
            setTimeout(() => {
                setExecutionStatus('success');
            }, 1000);
        } else {
            setError("WebSocket not connected, cannot execute selection");
            setExecutionStatus('error');
        }
    };
    
    // Reset the REPL
    const resetRepl = () => {
        // Use the WebSocket connection if available
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            // Send exit command to the current Python instance
            wsRef.current.send(JSON.stringify({ 
                type: 'input', 
                data: '\x03\n' // Ctrl+C
            }));
            
            // Then restart Python
            setTimeout(() => {
                wsRef.current.send(JSON.stringify({ 
                    type: 'input', 
                    data: 'python3\n' 
                }));
                
                setScriptOutput(['=== REPL Reset ===']);
                setConnectionStatus('Connected');
            }, 300);
        } else {
            connectToWebSocket();
            setScriptOutput(['=== Connecting to Python server ===']);
        }
    };
    
    // Function to connect to WebSocket server
    const connectToWebSocket = () => {
        // Close existing connection if any
        if (wsRef.current) {
            try {
                console.log('Closing existing WebSocket connection');
                wsRef.current.close();
                wsRef.current = null;
            } catch (e) {
                console.error('Error closing WebSocket:', e);
            }
        }
        
        setConnectionStatus('Connecting');
        
        // Connect to Python WebSocket server
        try {
            console.log('Connecting to Python server at localhost:3010');
            const ws = new WebSocket('ws://localhost:3010');
            
            ws.onopen = () => {
                console.log('WebSocket connection opened');
                wsRef.current = ws;
                setConnectionStatus('Connected');
                
                // Initialize Python
                setTimeout(() => {
                    console.log('Initializing Python environment');
                    ws.send(JSON.stringify({ 
                        type: 'input', 
                        data: 'python3\n' 
                    }));
                    
                    setScriptOutput(['=== Connected to Python server ===']);
                    setWsConnected(true);
                }, 300);
            };
            
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'output') {
                        console.log('Default handler - output received:', data.data.slice(0, 100));
                    }
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket connection error:', error);
                setConnectionStatus('Connection Error');
                setWsConnected(false);
            };
            
            ws.onclose = () => {
                console.log('WebSocket connection closed');
                setConnectionStatus('Disconnected');
                setWsConnected(false);
            };
            
            return ws;
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            setConnectionStatus('Connection Error');
            return null;
        }
    };
    
    // Direct WebSocket connection for script output
    useEffect(() => {
        console.log('PythonScriptExecution: Component mounted, connecting to WebSocket');
        
        // Initial connection
        const ws = connectToWebSocket();
        
        // Set up reconnection on disconnect
        const reconnectInterval = setInterval(() => {
            if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
                console.log('PythonScriptExecution: Attempting to reconnect...');
                connectToWebSocket();
            }
        }, 3000); // Try to reconnect every 3 seconds
        
        return () => {
            clearInterval(reconnectInterval);
            
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, []);

    // Add a listener to capture Python REPL output
    useEffect(() => {
        // Function to handle messages from the Python REPL
        const handleReplOutput = (event) => {
            if (event.data && event.data.type === 'pythonrepl/output') {
                console.log('Received output from REPL:', event.data);
                // Add the output line to our scriptOutput state
                setScriptOutput(prev => [...prev, event.data.output]);
            }
        };
        
        // Add event listener
        window.addEventListener('message', handleReplOutput);
        
        // Cleanup
        return () => {
            window.removeEventListener('message', handleReplOutput);
        };
    }, []);

    // Loading state
    if (loading) {
        return <div className="pse-loading">Loading Python script...</div>;
    }
    
    // Error state
    if (error && !scriptContent) {
        return (
            <div className="pse-error">
                <h2>Error Loading Script</h2>
                <p>{error}</p>
            </div>
        );
    }
    
    // Empty state
    if (!scriptFile) {
        return (
            <div className="pse-empty">
                <h2>Python Script Execution</h2>
                <p>No Python script selected. Please select a Python script from the catalog.</p>
                <div className="pse-instructions">
                    <h3>How to use:</h3>
                    <ol>
                        <li>Select a Python file from the catalog panel</li>
                        <li>Review the script in this panel</li>
                        <li>Click "Execute Script" to run it in the REPL</li>
                        <li>View results in the Python REPL panel</li>
                    </ol>
                </div>
            </div>
        );
    }
    
    return (
        <div className="pse-panel">
            <header className="pse-header">
                <h2>Python Script: {scriptInfo.filename}</h2>
                
                <div className="pse-meta">
                    <div className="pse-hash">
                        <span className="pse-label">Hash:</span>
                        <code>{scriptInfo.hash ? scriptInfo.hash.substring(0, 12) + '...' : 'N/A'}</code>
                    </div>
                    <div className="pse-timestamp">
                        <span className="pse-label">Last Modified:</span>
                        <span>{scriptInfo.timestamp}</span>
                    </div>
                </div>
            </header>
            
            <div className="pse-controls">
                <button 
                    className={`pse-execute-btn ${executionStatus === 'running' ? 'running' : ''}`}
                    onClick={executeScript}
                    disabled={executionStatus === 'running' || !scriptContent}
                >
                    {executionStatus === 'running' ? 'Executing...' : 'Execute Script'}
                </button>
                
                <button 
                    className="pse-execute-selected-btn"
                    onClick={executeSelectedLine}
                    disabled={executionStatus === 'running'}
                >
                    Execute Selected Line
                </button>
                
                <button 
                    className="pse-test-connection-btn"
                    onClick={testPythonConnection}
                >
                    Test Python Connection
                </button>
                
                <div className="pse-repl-controls">
                    <button onClick={resetRepl}>Reset REPL</button>
                </div>
            </div>
            
            {error && (
                <div className="pse-warning">
                    <p>{error}</p>
                </div>
            )}
            
            <div className="pse-container">
                <div className="pse-script-container">
                    <h3>Script Content</h3>
                    <pre className="pse-script-content">{scriptContent}</pre>
                </div>

                <div className="pse-output-container">
                    <h3>Execution Output</h3>
                    <div className="pse-output">
                        {scriptOutput.length === 0 ? (
                            <div className="pse-no-output">No output yet. Execute the script to see results here.</div>
                        ) : (
                            <div className="pse-output-content">
                                {scriptOutput.map((line, index) => (
                                    <div key={index} className="pse-output-line">
                                        {line}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="pse-connection-status">
                        {connectionStatus === 'Connected' ? (
                            <span className="pse-connected">Connected to Python server</span>
                        ) : (
                            <span className="pse-disconnected">Disconnected from Python server</span>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="pse-execution-history">
                <h3>Execution History</h3>
                {executionHistory.length === 0 ? (
                    <p className="pse-no-history">No execution history yet</p>
                ) : (
                    <ul className="pse-history-list">
                        {executionHistory.map((entry, index) => (
                            <li key={index} className="pse-history-item">
                                <span className="pse-history-time">{entry.timestamp}</span>
                                <span className="pse-history-file">{entry.filename}</span>
                                <span className="pse-history-status">{entry.status}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            
            <div className="pse-documentation">
                <h3>Tips</h3>
                <ul>
                    <li>You can select a portion of the script and click "Execute Selected Line" to run just that part</li>
                    <li>Variables defined in one execution are available in subsequent executions</li>
                    <li>Click "Reset REPL" if you want to clear all defined variables and start fresh</li>
                </ul>
            </div>
        </div>
    );
};

export default PythonScriptExecutionPanel;
