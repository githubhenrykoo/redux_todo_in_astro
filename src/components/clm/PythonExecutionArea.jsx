import React, { useState, useEffect } from 'react';

/**
 * Clean Python script content function
 * This function fixes common Python syntax issues like excessive docstring quotes, indentation problems, and commands executed as python code
 */
const cleanScriptContent = (content) => {
    // Fix common syntax issues
    let cleaned = content;
    
    // Replace excessive docstring quotes with standard triple quotes
    cleaned = cleaned.replace(/"{6,}/g, '"""');
    cleaned = cleaned.replace(/'{6,}/g, "'''");
    
    // Fix indentation in common cases
    const lines = cleaned.split('\n');
    let fixedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Fix common indentation issues
        if (line.match(/^\s*def\s+/) && !line.endsWith(':')) {
            line = line + ':';
        }
        
        fixedLines.push(line);
    }
    
    cleaned = fixedLines.join('\n');
    
    // Fix other common errors
    cleaned = cleaned.replace(/^python3$/m, '');
    
    return cleaned;
};

const executeScript = async (wsRef, scriptContent, setPythonScriptOutput, setExecutionStatus) => {
    try {
        // Clean the script content
        const cleanedContent = cleanScriptContent(scriptContent);
        console.log('Executing Python script with content:', cleanedContent);
        
        // Start Python execution sequence
        console.log('Starting Python execution sequence');
        
        // Reset output and clear state
        setPythonScriptOutput(["=== Script Input ===", cleanedContent, "=== End Input ===", "=== Starting Execution ==="]);
        setExecutionStatus('running');
        
        // Flag to track if we've already sent the script
        let scriptSent = false;
        
        // Flag to track if we've detected Python running
        let pythonRunning = false;
        
        // Set up message handler for this execution
        const originalOnMessage = wsRef.onmessage;
        
        // Add a specialized timer to automatically end execution
        const executionTimer = setTimeout(() => {
            // Restore original handler
            wsRef.onmessage = originalOnMessage;
            
            // Mark execution as complete
            setPythonScriptOutput(prev => [...prev, "=== Execution completed (timeout) ==="]);
            setExecutionStatus('timeout');
        }, 10000); // 10 second timeout
        
        // Create a handler for WebSocket messages during script execution
        wsRef.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'output') {
                    // Clean ANSI escape sequences
                    const cleanOutput = data.data.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
                    console.log('Raw output:', JSON.stringify(cleanOutput));
                    
                    // Check if Python is running
                    if (cleanOutput.includes('Python') || cleanOutput.includes('>>>')) {
                        pythonRunning = true;
                        
                        // Only send the script once, and only after detecting Python
                        if (!scriptSent && pythonRunning) {
                            console.log('Python detected, sending complete script');
                            
                            // Wrap the script properly to avoid execution issues
                            const wrappedScript = `
exec('''
${cleanedContent}
''')
`;
                            
                            // Send as a single payload
                            wsRef.send(JSON.stringify({
                                type: 'input',
                                data: wrappedScript
                            }));
                            
                            // Mark that we've sent the script
                            scriptSent = true;
                        }
                    }
                    
                    // Process the output
                    const lines = cleanOutput.split('\n');
                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        
                        // Skip prompts and input echoes
                        if (trimmedLine.startsWith('>>>') || 
                            trimmedLine.startsWith('...') || 
                            trimmedLine === '' ||
                            trimmedLine === '\\') {
                            continue;
                        }
                        
                        // Add real output
                        setPythonScriptOutput(prev => {
                            // Avoid duplicates
                            if (prev.length > 0 && prev[prev.length - 1] === trimmedLine) {
                                return prev;
                            }
                            return [...prev, trimmedLine];
                        });
                        
                        // Check for errors
                        if (trimmedLine.includes('Error:') || 
                            trimmedLine.includes('Exception:') ||
                            trimmedLine.includes('Traceback')) {
                            setExecutionStatus('error');
                        }
                    }
                    
                    // Check for execution completion
                    if (scriptSent && cleanOutput.includes('>>>') && !cleanOutput.includes('...')) {
                        // Code has finished executing when we see the prompt again
                        clearTimeout(executionTimer);
                        
                        // Restore original handler
                        wsRef.onmessage = originalOnMessage;
                        
                        // Final success message
                        setPythonScriptOutput(prev => {
                            // Only add completion message if not already there
                            if (prev[prev.length - 1].includes("=== Execution completed")) {
                                return prev;
                            }
                            
                            const hasError = prev.some(line => 
                                line.includes("Error") || 
                                line.includes("Exception") || 
                                line.includes("Traceback")
                            );
                            
                            if (hasError) {
                                return [...prev, "=== Execution completed with errors ==="];
                            } else {
                                return [...prev, "=== Execution completed successfully ==="];
                            }
                        });
                        
                        // Set final status
                        setExecutionStatus(prevStatus => prevStatus === 'error' ? 'error' : 'success');
                    }
                }
            } catch (error) {
                console.error('Error processing WebSocket message:', error);
            }
        };
        
        // Start by sending the 'python3' command if needed
        if (!pythonRunning) {
            console.log('Sending initial python3 command');
            wsRef.send(JSON.stringify({ 
                type: 'input', 
                data: 'python3\n' 
            }));
        }
        
    } catch (error) {
        console.error('Error executing Python script:', error);
        setPythonScriptOutput(prev => [...prev, `Error: ${error.message}`]);
        setExecutionStatus('error');
    }
};

/**
 * Execute Python script function
 * This is exported separately so it can be used by other components
 */
export const executePythonScript = async (fileHash, wsRef, setPythonScriptOutput, setExecutionStatus, scriptFile = null) => {
    if (!wsRef || wsRef.readyState !== WebSocket.OPEN) {
        console.error('WebSocket not connected');
        setPythonScriptOutput(['Error: Python server not connected. Please try again.']);
        setExecutionStatus('error');
        return;
    }
    
    try {
        // Clear previous output and set status to running
        setPythonScriptOutput(['=== Starting Execution ===']);
        setExecutionStatus('running');
        
        // Get the script content
        let scriptContent = '';
        
        if (scriptFile) {
            // Use directly provided script file
            console.log('Using provided script file:', scriptFile);
            
            // Extract content from file
            if (scriptFile.content instanceof Uint8Array || 
               (typeof scriptFile.content === 'object' && scriptFile.content.type === 'Buffer')) {
                const buffer = scriptFile.content instanceof Uint8Array 
                    ? scriptFile.content 
                    : new Uint8Array(scriptFile.content.data);
                scriptContent = new TextDecoder().decode(buffer);
                console.log('Decoded content from buffer', scriptContent.substring(0, 50) + '...');
            } else if (typeof scriptFile.content === 'string') {
                scriptContent = scriptFile.content;
                console.log('Content is string', scriptContent.substring(0, 50) + '...');
            } else {
                // Try to convert other formats to string
                try {
                    scriptContent = JSON.stringify(scriptFile.content, null, 2);
                    console.log('Converted content from JSON', scriptContent.substring(0, 50) + '...');
                } catch (e) {
                    scriptContent = String(scriptFile.content);
                    console.log('Converted with String()', scriptContent.substring(0, 50) + '...');
                }
            }
        } else {
            // Fetch from API
            console.log('Fetching script content from API for hash:', fileHash);
            const response = await fetch(`/api/card-collection?action=get&hash=${fileHash}`);
            if (!response.ok) {
                throw new Error(`API returned ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            if (!data.card?.content) {
                throw new Error('Script content is empty');
            }
            
            // Handle Buffer JSON format from Node.js
            if (typeof data.card.content === 'object' && 
                data.card.content !== null && 
                data.card.content.type === 'Buffer' && 
                Array.isArray(data.card.content.data)) {
                // Convert the numeric array to a string
                const bytes = Array.from(data.card.content.data).map(byte => String.fromCharCode(byte)).join('');
                scriptContent = bytes;
                console.log('Converted Buffer JSON to string:', scriptContent.substring(0, 100) + '...');
            } else if (typeof data.card.content === 'string') {
                scriptContent = data.card.content;
                console.log('API returned string content:', scriptContent.substring(0, 100) + '...');
            } else {
                // Try to convert other formats to string
                try {
                    scriptContent = JSON.stringify(data.card.content, null, 2);
                    console.log('Converted API content from JSON', scriptContent.substring(0, 50) + '...');
                } catch (e) {
                    scriptContent = String(data.card.content);
                    console.log('Converted API content with String()', scriptContent.substring(0, 50) + '...');
                }
            }
        }
        
        if (!scriptContent) {
            throw new Error('Failed to extract script content');
        }
        
        await executeScript(wsRef, scriptContent, setPythonScriptOutput, setExecutionStatus);
        
    } catch (error) {
        console.error('Error executing Python script:', error);
        setPythonScriptOutput(prev => [...prev, `Error: ${error.message}`]);
        setExecutionStatus('error');
    }
};

/**
 * Component for executing Python scripts within the CLM Display Panel
 */
const PythonExecutionArea = () => {
    const [pythonScriptOutput, setPythonScriptOutput] = useState([]);
    const [executionStatus, setExecutionStatus] = useState('idle'); // 'idle', 'running', 'success', 'error'
    const [wsRef, setWsRef] = useState(null);
    
    // Set up WebSocket connection for Python execution
    useEffect(() => {
        console.log('PythonExecutionArea: Setting up WebSocket connection');
        const ws = new WebSocket('ws://localhost:3010');
        
        ws.onopen = () => {
            console.log('PythonExecutionArea: WebSocket connected');
            setWsRef(ws);
        };
        
        ws.onerror = (error) => {
            console.error('PythonExecutionArea: WebSocket connection error:', error);
        };
        
        ws.onclose = () => {
            console.log('PythonExecutionArea: WebSocket connection closed');
            setWsRef(null);
        };
        
        // Clean up on unmount
        return () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, []);
    
    return (
        <div className="python-execution-area">
            <h3>Python Script Execution</h3>
            
            {/* Show execution status */}
            <div className={`execution-status ${executionStatus}`}>
                Status: {executionStatus === 'idle' ? 'Ready' : 
                        executionStatus === 'running' ? 'Running...' : 
                        executionStatus === 'success' ? 'Completed Successfully' : 'Error'}
            </div>
            
            {/* Output display with scrolling capability */}
            {pythonScriptOutput.length > 0 && (
                <div className="python-output-container">
                    <h4>Script Output:</h4>
                    <div className="python-output-wrapper" style={{ maxHeight: '400px', overflow: 'auto' }}>
                        <pre className="python-output" tabIndex="0">
                            {pythonScriptOutput.join('\n')}
                        </pre>
                    </div>
                </div>
            )}
            
            {/* Show instructions if no output */}
            {pythonScriptOutput.length === 0 && (
                <div className="python-instructions">
                    <p>Click the "Execute Python" button next to a Python file in the Concrete Implementation section to run a script.</p>
                </div>
            )}
            
            {/* Optional: Add scroll-to-bottom button if needed */}
            {pythonScriptOutput.length > 20 && (
                <button 
                    className="scroll-to-bottom-btn"
                    onClick={() => {
                        const outputWrapper = document.querySelector('.python-output-wrapper');
                        if (outputWrapper) {
                            outputWrapper.scrollTop = outputWrapper.scrollHeight;
                        }
                    }}
                >
                    Scroll to Bottom
                </button>
            )}
        </div>
    );
};

export default PythonExecutionArea;
