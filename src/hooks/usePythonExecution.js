import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { 
    executeScript as executeScriptAction, 
    resetREPL as resetREPLAction, 
    clearREPL as clearREPLAction, 
    addOutput,
    addToHistory as addToHistoryAction 
} from '../features/pythonreplSlice';
import { cleanAnsiCodes } from './usePythonScript';

/**
 * Custom hook for Python script execution functionality
 */
export const usePythonExecution = (scriptContent, scriptInfo) => {
    const [scriptOutput, setScriptOutput] = useState([]);
    const [waitingForInput, setWaitingForInput] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [executionStatus, setExecutionStatus] = useState('idle'); // idle, running, success, error
    const [executionHistory, setExecutionHistory] = useState([]);
    
    const dispatch = useDispatch();

    // Direct execution via WebSocket
    const executeDirectly = () => {
        // Display execution starting
        setScriptOutput(['=== Starting Direct Execution ===']);
        setExecutionStatus('running');
        
        // Get the actual text content from the UI component
        const displayedScriptContent = document.querySelector('.pse-script-content')?.textContent;
        
        if (!displayedScriptContent) {
            setScriptOutput(['Error: No script content found']);
            setExecutionStatus('error');
            return;
        }
        
        console.log('Using raw script content from UI');
        console.log('Script length:', displayedScriptContent.length);
        
        try {
            // Create a direct WebSocket connection to the Python server
            const ws = new WebSocket('ws://localhost:3010');
            
            // Track all output in this array
            const outputLines = ['=== Starting Direct Execution ===', 'Connecting to Python server...'];
            setScriptOutput([...outputLines]);
            
            // Set timeout for connection
            const connectionTimeout = setTimeout(() => {
                console.error('WebSocket connection timeout');
                outputLines.push('Error: WebSocket connection timeout');
                outputLines.push('Please make sure python-server.js is running on port 3010');
                outputLines.push('=== Script Execution Failed ===');
                setScriptOutput([...outputLines]);
                setExecutionStatus('error');
            }, 5000);
            
            ws.onopen = () => {
                console.log('Direct WebSocket connection established');
                clearTimeout(connectionTimeout);
                
                outputLines.push('Connected to Python server');
                setScriptOutput([...outputLines]);
                
                // First, let's check if Python is responding
                ws.send(JSON.stringify({
                    type: 'input',
                    data: 'print("Python REPL connection test")\n'
                }));
                
                // Short delay to ensure the test message is processed
                setTimeout(() => {
                    outputLines.push('Executing script...');
                    setScriptOutput([...outputLines]);
                    
                    // Now use the simpler approach - send the script directly
                    ws.send(JSON.stringify({
                        type: 'input',
                        data: displayedScriptContent + '\n'
                    }));
                    
                    // Wait for execution to complete
                    setTimeout(() => {
                        console.log('Execution completed, closing WebSocket');
                        
                        // Send a final marker to know we're done
                        ws.send(JSON.stringify({
                            type: 'input',
                            data: 'print("\\n=== Execution complete! ===")\n'
                        }));
                        
                        // Give it time to send the final message before closing
                        setTimeout(() => {
                            ws.close();
                            
                            // Mark execution as complete
                            setExecutionStatus('idle');
                            
                            // Add to execution history
                            const executionEntry = {
                                timestamp: new Date().toLocaleString(),
                                hash: scriptInfo.hash,
                                filename: scriptInfo.filename,
                                status: 'executed directly'
                            };
                            
                            setExecutionHistory(prev => [executionEntry, ...prev.slice(0, 9)]);
                        }, 500);
                    }, 2000);
                }, 1000);
            };
            
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'output') {
                        // Log raw data to see exactly what we're getting
                        console.log('Raw WebSocket output:', data.data);
                        
                        // Clean up the output from ANSI escape codes and control characters
                        const cleanOutput = cleanAnsiCodes(data.data);
                        console.log('Cleaned output:', cleanOutput);
                        
                        // Split by newlines and add each line
                        const lines = cleanOutput.split(/\n/);
                        for (const line of lines) {
                            if (line.trim()) {  // Only add non-empty lines
                                // Still filter some Python prompts but be less aggressive
                                if (!line.trim().match(/^(>>>|\.\.\.)\s*$/)) {
                                    outputLines.push(line);
                                }
                            }
                        }
                        
                        // Update UI with latest output
                        setScriptOutput([...outputLines]);
                    }
                } catch (err) {
                    console.error('Error processing WebSocket message:', err);
                    outputLines.push(`Error processing output: ${err.message}`);
                    setScriptOutput([...outputLines]);
                }
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                outputLines.push(`Error: WebSocket connection failed`);
                outputLines.push('Please make sure python-server.js is running on port 3010');
                outputLines.push('=== Script Execution Failed ===');
                setScriptOutput([...outputLines]);
                setExecutionStatus('error');
            };
            
            ws.onclose = () => {
                console.log('WebSocket connection closed');
                if (executionStatus === 'running') {
                    outputLines.push('Connection closed unexpectedly');
                    outputLines.push('=== Script Execution Incomplete ===');
                    setScriptOutput([...outputLines]);
                    setExecutionStatus('error');
                }
            };
        } catch (error) {
            console.error('Error in direct execution:', error);
            setScriptOutput([
                '=== Starting Direct Execution ===',
                `Error: ${error.message}`,
                'Please make sure python-server.js is running on port 3010',
                '=== Script Execution Failed ==='
            ]);
            setExecutionStatus('error');
        }
    };

    // Execute script via Redux
    const executeScript = () => {
        if (!scriptContent) {
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

    // Execute selected text/line
    const executeSelectedLine = () => {
        // Get selected text or current line
        const selection = window.getSelection();
        let selectedText = '';
        
        if (selection.rangeCount > 0) {
            selectedText = selection.toString();
        }
        
        if (!selectedText) {
            return false;
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
        
        return true;
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
        if (e) e.preventDefault();
        if (!userInput.trim() && !waitingForInput) return;
        
        // Send input to REPL
        dispatch({
            type: 'pythonrepl/submitInput',
            payload: {
                input: userInput
            }
        });
        
        // Add to our local output display too
        setScriptOutput(prev => [...prev, `> ${userInput}`]);
        
        // Clear input field and update state
        setUserInput('');
        setWaitingForInput(false);
    };

    return {
        scriptOutput,
        waitingForInput,
        userInput,
        executionStatus,
        executionHistory,
        setScriptOutput,
        setWaitingForInput,
        setUserInput,
        setExecutionStatus,
        executeDirectly,
        executeScript,
        executeSelectedLine,
        resetREPL,
        clearREPL,
        handleInputSubmit
    };
};
