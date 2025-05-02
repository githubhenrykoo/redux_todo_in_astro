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

    // Function to clean HTML/class attributes from script content
    const cleanScriptContent = (content) => {
        if (!content) return '';
        
        // Remove HTML-like class attributes and tags
        return content
            .replace(/class=["'][\w\s-]+["']/g, '') // Remove class attributes
            .replace(/class="py-\w+"/g, '')         // Remove specific py-* classes
            .replace(/<\/?[^>]+(>|$)/g, '')         // Remove HTML tags
            .replace(/["']py-\w+["']/g, '')         // Remove quoted py-* classes
            .trim();
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
    
    // Execute script in the REPL
    const executeScript = () => {
        if (!scriptContent) {
            setError("No script content to execute");
            return;
        }
        
        // Clear previous output
        setScriptOutput(['=== Executing script: ' + scriptInfo.filename + ' ===']);
        
        // Update execution status
        setExecutionStatus('running');
        
        // Prepare the script content
        const lines = scriptContent.split('\n');
        
        // Remove shebang line if present
        if (lines.length > 0 && lines[0].startsWith('#!')) {
            lines.shift();
        }
        
        // Execute directly through our WebSocket connection if available
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            console.log('Executing script directly via WebSocket, line by line');
            
            // This is a much simpler approach - just send each line one by one
            // with a slight delay between lines to avoid overwhelming the REPL
            let lineIndex = 0;
            
            // Function to send the next line
            const sendNextLine = () => {
                if (lineIndex < lines.length) {
                    const line = lines[lineIndex].trim();
                    lineIndex++;
                    
                    // Skip empty lines
                    if (!line) {
                        setTimeout(sendNextLine, 10);
                        return;
                    }
                    
                    // Send the line to the REPL
                    wsRef.current.send(JSON.stringify({
                        type: 'input',
                        data: line + '\n'
                    }));
                    
                    // Schedule the next line with a delay
                    setTimeout(sendNextLine, 100);
                } else {
                    // All lines sent
                    setScriptOutput(prev => [...prev, "✅ Script execution completed"]);
                    setExecutionStatus('success');
                }
            };
            
            // Start sending lines
            sendNextLine();
        } else {
            // Fall back to dispatch-based execution
            console.log('WebSocket not connected, using dispatch for execution');
            
            // Use multiple communication methods to ensure the message gets through
            
            // 1. Dispatch to Redux
            dispatch({
                type: 'pythonrepl/executeScript',
                payload: {
                    content: lines.join('\n'),
                    hash: scriptInfo.hash,
                    filename: scriptInfo.filename
                }
            });
            
            // 2. Direct window messaging
            window.postMessage({
                type: 'pythonrepl/executeScript',
                payload: {
                    content: lines.join('\n'),
                    hash: scriptInfo.hash,
                    filename: scriptInfo.filename
                }
            }, '*');
            
            // 3. Store the action in a global variable for polling
            window.lastReduxAction = {
                type: 'pythonrepl/executeScript',
                payload: {
                    content: lines.join('\n'),
                    hash: scriptInfo.hash,
                    filename: scriptInfo.filename
                }
            };
        }
        
        console.log('Script execution requested:', scriptInfo.filename);
        
        // Add to execution history
        const executionEntry = {
            timestamp: new Date().toLocaleString(),
            hash: scriptInfo.hash,
            filename: scriptInfo.filename,
            status: 'executed'
        };
        
        setExecutionHistory(prev => [executionEntry, ...prev.slice(0, 9)]); // Keep last 10 entries
    };
    
    // Function to test the Python connection with a simple command
    const testConnection = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            // Send a simple Python print statement
            wsRef.current.send(JSON.stringify({
                type: 'input',
                data: 'print("Hello from Python! This is a connection test.")\n'
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
    const resetREPL = () => {
        dispatch({
            type: 'pythonrepl/resetREPL',
            payload: {}
        });
    };
    
    // Clear the REPL
    const clearREPL = () => {
        dispatch({
            type: 'pythonrepl/clearREPL',
            payload: {}
        });
    };
    
    // Direct WebSocket connection for script output
    useEffect(() => {
        // Connect to Python WebSocket server
        try {
            console.log('PythonScriptExecution: Connecting to WebSocket server');
            const ws = new WebSocket('ws://localhost:3010');
            wsRef.current = ws;
            
            ws.onopen = () => {
                console.log('PythonScriptExecution: Connected to WebSocket server');
                setWsConnected(true);
                setScriptOutput(prev => [...prev, "=== Connected to Python server ==="])
            };
            
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('PythonScriptExecution: Received message', data);
                    
                    if (data.type === 'output') {
                        // Clean ANSI escape sequences
                        const cleanOutput = data.data.replace(
                            /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, 
                            ''
                        );
                        
                        // Handle script execution markers
                        if (cleanOutput.includes('=== Executing script:')) {
                            // Start of script execution - already added by our component
                            return;
                        }
                        
                        // Handle successful execution marker
                        if (cleanOutput.includes('=== Script executed successfully ===')) {
                            setScriptOutput(prev => [...prev, "✅ Script executed successfully"]);
                            return;
                        }
                        
                        // Handle error messages
                        if (cleanOutput.includes('=== Error:')) {
                            const errorMatch = cleanOutput.match(/=== Error: ([^=]+) ===([\s\S]*)/);
                            if (errorMatch) {
                                const errorType = errorMatch[1].trim();
                                const errorMessage = errorMatch[2].trim();
                                setScriptOutput(prev => [...prev, `❌ Error: ${errorType}`, errorMessage]);
                            } else {
                                setScriptOutput(prev => [...prev, "❌ Error executing script"]);
                            }
                            return;
                        }
                        
                        // Filter out input echo lines (starting with >>> or ...)
                        if (!cleanOutput.trim().startsWith('>>>') && 
                            !cleanOutput.trim().startsWith('...') &&
                            cleanOutput.trim()) {
                            
                            // Remove trailing prompts
                            const filteredOutput = cleanOutput.replace(/>>>\s*$/, '').replace(/\.\.\.\s*$/, '');
                            
                            if (filteredOutput.trim()) {
                                setScriptOutput(prev => [...prev, filteredOutput]);
                                console.log('Added output:', filteredOutput);
                            }
                        }
                    }
                } catch (err) {
                    console.error('Error handling WebSocket message:', err);
                    // Try to handle raw data
                    setScriptOutput(prev => [...prev, String(event.data)]);
                }
            };
            
            ws.onerror = (error) => {
                console.error('PythonScriptExecution: WebSocket error', error);
                setScriptOutput(prev => [...prev, "=== Error connecting to Python server ==="])
            };
            
            ws.onclose = () => {
                console.log('PythonScriptExecution: WebSocket connection closed');
                setWsConnected(false);
                setScriptOutput(prev => [...prev, "=== Disconnected from Python server ==="])
            };
            
            return () => {
                if (wsRef.current) {
                    wsRef.current.close();
                }
            };
        } catch (err) {
            console.error('PythonScriptExecution: Error setting up WebSocket', err);
        }
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
                    onClick={testConnection}
                >
                    Test Python Connection
                </button>
                
                <div className="pse-repl-controls">
                    <button onClick={clearREPL}>Clear REPL</button>
                    <button onClick={resetREPL}>Reset REPL</button>
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
                        {wsConnected ? (
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
