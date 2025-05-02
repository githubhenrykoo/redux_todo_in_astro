import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { executeScript as executeScriptAction, resetREPL as resetREPLAction, 
         clearREPL as clearREPLAction, submitInput as submitInputAction,
         addToHistory as addToHistoryAction, addOutput } from '../../features/pythonreplSlice';
import '../../styles/python-script-execution.css';

const PythonScriptExecutionPanel = ({ initialHash = '' }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [scriptContent, setScriptContent] = useState('');
    const [scriptOutput, setScriptOutput] = useState([]);
    const [waitingForInput, setWaitingForInput] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [scriptInfo, setScriptInfo] = useState({
        contentType: null,
        filename: 'No file selected',
        hash: '',
        timestamp: ''
    });
    const [executionStatus, setExecutionStatus] = useState('idle'); // idle, running, success, error
    
    const outputRef = useRef(null);
    const inputRef = useRef(null);
    const replFrameRef = useRef(null);

    const dispatch = useDispatch();
    
    // Use Redux selectors to get the selected hash and cards
    const selectedHash = useSelector(state => state?.content?.selectedHash || initialHash);
    const cards = useSelector(state => state?.content?.cards || {});
    const replOutput = useSelector(state => state?.pythonrepl?.output || []);
    const replStatus = useSelector(state => state?.pythonrepl?.status || 'idle');
    
    // Keep track of execution history
    const [executionHistory, setExecutionHistory] = useState([]);

    // Subscribe to REPL output changes
    useEffect(() => {
        // Debug the output changes
        console.log("REPL Output Changed:", replOutput);
        
        if (replOutput && replOutput.length > 0) {
            // Force update the script output with the latest from Redux
            setScriptOutput([...replOutput]);
            
            // Auto-scroll to the bottom of output
            if (outputRef.current) {
                outputRef.current.scrollTop = outputRef.current.scrollHeight;
            }
            
            // Check if waiting for input
            const lastLine = replOutput[replOutput.length - 1];
            if (typeof lastLine === 'string' && 
                (lastLine.includes('input(') || lastLine.endsWith(': '))) {
                setWaitingForInput(true);
                // Focus the input field
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }
        }
    }, [replOutput]);
    
    // Subscribe to REPL status changes
    useEffect(() => {
        console.log("REPL Status Changed:", replStatus);
        setExecutionStatus(replStatus);
        
        if (replStatus === 'waiting-for-input') {
            setWaitingForInput(true);
            // Focus the input field
            if (inputRef.current) {
                setTimeout(() => {
                    if (inputRef.current) {
                        inputRef.current.focus();
                    }
                }, 100);
            }
        } else if (replStatus === 'idle' && executionStatus === 'running') {
            // Script finished executing
            setWaitingForInput(false);
        }
    }, [replStatus]);

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
        setScriptOutput([]);
        setWaitingForInput(false);
        setUserInput('');
        setScriptInfo({
            contentType: null,
            filename: 'No file selected',
            hash: '',
            timestamp: ''
        });
        setExecutionStatus('idle');
        setError(null);
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
            
            // Check if file is a Python script based on content type
            const isPythonScript = file.contentType && 
                (file.contentType.mimeType === 'text/x-python-script' || 
                 file.contentType.mimeType === 'text/x-python' ||
                 file.contentType.extension === 'py' ||
                 (file.contentType.extension && file.contentType.extension.toLowerCase() === 'py') ||
                 (file.name && file.name.toLowerCase().endsWith('.py')));
            
            console.log('File content type:', file.contentType);
            console.log('Is Python script?', isPythonScript);
            
            if (!isPythonScript) {
                // Let's be more lenient - try to check if content looks like Python
                if (typeof file.content === 'string' && 
                    (file.content.includes('def ') || 
                     file.content.includes('import ') || 
                     file.content.includes('print(') || 
                     file.content.includes('class '))) {
                    console.log('Content appears to be Python based on keywords');
                } else {
                    throw new Error("Selected file is not a Python script");
                }
            }
            
            // Extract content from file
            let content = '';
            
            // Convert Buffer to string if needed
            if (file.content instanceof Uint8Array || 
                (typeof file.content === 'object' && file.content.type === 'Buffer')) {
                const buffer = file.content instanceof Uint8Array 
                    ? file.content 
                    : new Uint8Array(file.content.data);
                content = new TextDecoder().decode(buffer);
            } else if (typeof file.content === 'string') {
                content = file.content;
            } else {
                // Try to convert other formats to string
                try {
                    content = JSON.stringify(file.content, null, 2);
                } catch (e) {
                    content = String(file.content);
                }
            }
            
            // Clean any HTML-like content that might be in the script
            content = content.replace(/class=/g, 'data-class=')
                           .replace(/class="py-\w+"/g, '')
                           .replace(/<\/?[^>]+(>|$)/g, '');
                           
            console.log('Cleaned content:', content.substring(0, 100) + '...');
            
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
    
    // Helper to ensure content is text, not binary
    const ensureTextContent = (content) => {
        // If content is already a string, return it
        if (typeof content === 'string') {
            return content;
        }
        
        // Check if content is a Buffer or ArrayBuffer
        if (content instanceof ArrayBuffer || 
            (typeof Buffer !== 'undefined' && content instanceof Buffer) ||
            (content && typeof content === 'object' && content.buffer instanceof ArrayBuffer)) {
            // Convert to string using UTF-8 encoding
            try {
                if (typeof Buffer !== 'undefined') {
                    return Buffer.from(content).toString('utf-8');
                } else {
                    return new TextDecoder('utf-8').decode(content);
                }
            } catch (e) {
                console.error('Error converting binary content to text:', e);
                return String(content);
            }
        }
        
        // Fallback - try to convert to string
        return String(content);
    };
    
    // Helper to prepare script content for REPL execution
    const prepareScriptForREPL = (content) => {
        // Ensure content is text
        let textContent = ensureTextContent(content);
        
        // Remove shebang line if present
        textContent = textContent.replace(/^#!.*?\n/, '');
        
        // Handle potential script structure issues
        // If there are function definitions or imports, wrap execution in if __name__ block
        if (!textContent.includes('if __name__ == "__main__"') && 
            !textContent.includes("if __name__ == '__main__'")) {
            
            // Look for function definitions or imports at top level
            const hasTopLevelDefs = /^\s*(def|class|import|from)\s+/m.test(textContent);
            
            if (hasTopLevelDefs) {
                // Add explicit execution if there are top-level defs but no __main__ block
                textContent += '\n\n# Auto-added by execution panel\nif __name__ == "__main__":\n';
                
                // Find all top-level function definitions
                const funcMatches = textContent.match(/^\s*def\s+(\w+)/mg);
                if (funcMatches && funcMatches.length > 0) {
                    // Call the first defined function (often 'main')
                    const funcName = funcMatches[0].trim().split(/\s+/)[1];
                    textContent += `    ${funcName}()\n`;
                }
            }
        }
        
        return textContent;
    };

    // Override executeScript to dispatch the action
    const executeScript = () => {
        if (!scriptContent) {
            setError("No script content to execute");
            return;
        }
        
        // Clear previous output
        setScriptOutput([]);
        
        // Reset the Python REPL first - using direct action creator
        dispatch(resetREPLAction());
        
        // Add a clear message to show execution is starting
        dispatch(addOutput({ output: '=== Starting Script Execution ===' }));
        
        // Wait for the reset to take effect
        setTimeout(() => {
            console.log("Executing script:", scriptInfo.filename);
            setWaitingForInput(false);
            
            // Update execution status
            setExecutionStatus('running');
            
            // Use window.postMessage for direct inter-component communication
            window.postMessage({
                type: 'PYTHON_REPL_REQUEST',
                action: 'EXECUTE_SCRIPT',
                content: scriptContent
            }, '*');
            
            // Force flush output after a delay to ensure we get results
            setTimeout(() => {
                window.postMessage({
                    type: 'PYTHON_REPL_REQUEST',
                    action: 'FLUSH_OUTPUT'
                }, '*');
                
                // Check if we have output using window.pythonREPL if available
                if (window.pythonREPL && window.pythonREPL.getLatestOutput) {
                    const directOutput = window.pythonREPL.getLatestOutput();
                    if (directOutput && directOutput.length > 0) {
                        // Directly add any pending output to our local state
                        setScriptOutput(prev => [...prev, ...directOutput]);
                    }
                }
            }, 2000);
            
            // Also use normal Redux channels
            dispatch(executeScriptAction({
                content: scriptContent,
                hash: scriptInfo.hash,
                filename: scriptInfo.filename
            }));
            
            // Add to execution history
            const executionEntry = {
                timestamp: new Date().toLocaleString(),
                hash: scriptInfo.hash,
                filename: scriptInfo.filename,
                status: 'executed'
            };
            
            setExecutionHistory(prev => [executionEntry, ...prev.slice(0, 9)]); // Keep last 10 entries
            
            // Also add to Redux history
            dispatch(addToHistoryAction({
                status: 'executed',
                details: {
                    timestamp: new Date().toISOString(),
                    filename: scriptInfo.filename
                }
            }));
            
            // Add a fake "executing" message to show activity even if real output is delayed
            dispatch(addOutput({ output: `Executing ${scriptInfo.filename || "script"}...` }));
        }, 100);
    };
    
    // Create a polling mechanism to check for output
    useEffect(() => {
        let pollInterval;
        
        if (executionStatus === 'running') {
            // Poll for output every second while running
            pollInterval = setInterval(() => {
                // Try to get output directly from the Python REPL
                if (window.pythonREPL && window.pythonREPL.getLatestOutput) {
                    const directOutput = window.pythonREPL.getLatestOutput();
                    if (directOutput && directOutput.length > 0) {
                        // Update our local output state
                        setScriptOutput(prev => {
                            // Only add new lines
                            const newLines = directOutput.filter(line => !prev.includes(line));
                            if (newLines.length > 0) {
                                return [...prev, ...newLines];
                            }
                            return prev;
                        });
                    }
                }
                
                // Also force flush output to Redux
                window.postMessage({
                    type: 'PYTHON_REPL_REQUEST',
                    action: 'FLUSH_OUTPUT'
                }, '*');
            }, 1000);
        }
        
        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, [executionStatus]);

    // Directly execute the Python script using WebSocket - paste whole script at once
    const executeDirectly = () => {
        // Display execution starting
        setScriptOutput(['=== Starting Direct Execution ===']);
        setExecutionStatus('running');
        
        // Get the actual text content from the UI component
        const displayedScriptContent = document.querySelector('.pse-script-content')?.textContent || scriptContent;
        
        // Prepare the script content for the REPL
        const textContent = prepareScriptForREPL(displayedScriptContent);
        
        console.log('Using prepared script content');
        console.log('Script content type:', typeof textContent);
        console.log('First 50 chars:', textContent.substring(0, 50));
        
        // Send the script to the REPL iframe if it's available
        if (replFrameRef.current && replFrameRef.current.contentWindow) {
            console.log('Sending script to REPL iframe');
            replFrameRef.current.contentWindow.postMessage(
                { type: 'execute-script', script: textContent },
                '*'
            );
        } else {
            console.warn('REPL iframe not available');
        }
        
        try {
            // Create a direct WebSocket connection to the Python server
            const ws = new WebSocket('ws://localhost:3010');
            
            // Track all output in this array
            const outputLines = ['=== Starting Direct Execution ==='];
            
            ws.onopen = () => {
                console.log('Direct WebSocket connection established');
                
                // First clear any existing state by sending a blank line
                ws.send(JSON.stringify({
                    type: 'input',
                    data: '\r'
                }));
                
                // Execute the entire script at once by pasting it directly
                setTimeout(() => {
                    console.log('Sending entire script at once');
                    
                    // Send the entire script as one message
                    ws.send(JSON.stringify({
                        type: 'input',
                        data: textContent + '\r'
                    }));
                    
                    // Wait for execution to complete
                    setTimeout(() => {
                        ws.close();
                        
                        // Mark execution as complete
                        setExecutionStatus('idle');
                        
                        // Add completion marker
                        outputLines.push('=== Script Execution Complete ===');
                        setScriptOutput([...outputLines]);
                        
                        // Add to execution history
                        const executionEntry = {
                            timestamp: new Date().toLocaleString(),
                            hash: scriptInfo.hash,
                            filename: scriptInfo.filename,
                            status: 'executed directly'
                        };
                        
                        setExecutionHistory(prev => [executionEntry, ...prev.slice(0, 9)]);
                    }, 2000);
                }, 500);
            };
            
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'output') {
                        // Process output data
                        console.log('Received output:', data.data);
                        
                        // Split by newlines and add each line
                        const lines = data.data.split(/\r?\n/);
                        for (const line of lines) {
                            if (line.trim()) {
                                outputLines.push(line);
                            }
                        }
                        
                        // Update UI with latest output
                        setScriptOutput([...outputLines]);
                    }
                } catch (err) {
                    console.error('Error processing WebSocket message:', err);
                }
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                outputLines.push(`Error: WebSocket connection failed`);
                outputLines.push('=== Script Execution Failed ===');
                setScriptOutput([...outputLines]);
                setExecutionStatus('error');
            };
            
            ws.onclose = () => {
                console.log('WebSocket connection closed');
            };
        } catch (error) {
            console.error('Error in direct execution:', error);
            setScriptOutput([
                '=== Starting Direct Execution ===',
                `Error: ${error.message}`,
                '=== Script Execution Failed ==='
            ]);
            setExecutionStatus('error');
        }
    };

    // Send individual line to REPL
    const executeSelectedLine = () => {
        // Get selected text or current line
        const selection = window.getSelection();
        let selectedText = '';
        
        if (selection.rangeCount > 0) {
            selectedText = selection.toString();
        }
        
        if (!selectedText) {
            setError("No text selected");
            return;
        }
        
        // Dispatch to execute the selected line
        dispatch({
            type: 'pythonrepl/executeLine',
            payload: {
                content: selectedText,
                hash: scriptInfo.hash,
                filename: scriptInfo.filename
            }
        });
    };

    // Reset the REPL
    const resetREPL = () => {
        dispatch(resetREPLAction());
        setScriptOutput([]);
        setWaitingForInput(false);
        setUserInput('');
        setExecutionStatus('idle');
    };

    // Clear the REPL
    const clearREPL = () => {
        dispatch(clearREPLAction());
        setScriptOutput([]);
        setWaitingForInput(false);
    };

    // Handle user input submission
    const handleInputSubmit = (e) => {
        e.preventDefault();
        if (!userInput.trim() && !waitingForInput) return;
        
        // Send input to REPL
        dispatch(submitInputAction({
            input: userInput
        }));
        
        // Add to our local output display too
        setScriptOutput(prev => [...prev, `> ${userInput}`]);
        
        // Clear input field and update state
        setUserInput('');
        setWaitingForInput(false);
    };
    
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
                        <li>View results and interact with the script below</li>
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
                    onClick={executeDirectly}
                    disabled={executionStatus === 'running'}
                >
                    Execute Locally
                </button>
                
                <button 
                    className="pse-execute-selected-btn"
                    onClick={executeSelectedLine}
                    disabled={executionStatus === 'running'}
                >
                    Execute Selected Line
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
                    <div className="pse-output" ref={outputRef}>
                        {scriptOutput.length === 0 ? (
                            <div className="pse-no-output">No output yet. Execute the script to see results here.</div>
                        ) : (
                            <div className="pse-output-content">
                                {scriptOutput.map((line, index) => (
                                    <div key={index} className={`pse-output-line ${line.includes('input(') ? 'input-prompt' : ''}`}>
                                        {line}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Direct REPL output display */}
                    <div className="pse-direct-repl">
                        <h4>Direct REPL Output</h4>
                        <iframe 
                            src="/repl-frame.html" 
                            className="pse-repl-frame"
                            title="Python REPL"
                            ref={replFrameRef}
                        ></iframe>
                    </div>
                    
                    {waitingForInput && (
                        <form className="pse-input-form" onSubmit={handleInputSubmit}>
                            <input 
                                type="text"
                                ref={inputRef}
                                className="pse-input-field"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="Type your input here and press Enter"
                                autoFocus
                            />
                            <button type="submit" className="pse-input-submit">Submit</button>
                        </form>
                    )}
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
                    <li>Input fields will appear when the script requests user input</li>
                    <li>Variables defined in one execution are available in subsequent executions</li>
                    <li>Click "Reset REPL" if you want to clear all defined variables and start fresh</li>
                </ul>
            </div>
        </div>
    );
};

export default PythonScriptExecutionPanel;
