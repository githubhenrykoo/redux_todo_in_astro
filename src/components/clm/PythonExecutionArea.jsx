import React, { useState, useEffect } from 'react';
import { cleanScriptContent } from '../../utils/pythonScriptUtils';

/**
 * Execute Python script function
 * This is exported separately so it can be used by other components
 * @param {string} fileHash - Hash of the Python file to execute
 * @param {WebSocket} wsRef - WebSocket reference for communication with the Python server
 * @param {function} setPythonScriptOutput - Function to update the Python script output state
 * @param {function} setExecutionStatus - Function to update the execution status state
 */
export const executePythonScript = async (fileHash, wsRef, setPythonScriptOutput, setExecutionStatus) => {
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
        
        // Fetch the script content
        const response = await fetch(`/api/card-collection?action=get&hash=${fileHash}`);
        if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        let scriptContent = data.card?.content || '';
        
        if (!scriptContent) {
            throw new Error('Script content is empty');
        }
        
        // Handle Buffer JSON format from Node.js
        if (typeof scriptContent === 'object' && 
            scriptContent !== null && 
            scriptContent.type === 'Buffer' && 
            Array.isArray(scriptContent.data)) {
            // Convert the numeric array to a string
            const bytes = Array.from(scriptContent.data).map(byte => String.fromCharCode(byte)).join('');
            scriptContent = bytes;
            console.log('Converted Buffer JSON to string:', scriptContent.substring(0, 100) + '...');
        }
        
        // Clean the script content
        const cleanedContent = cleanScriptContent(scriptContent);
        console.log('Executing Python script with content:', cleanedContent);
        
        // Set up message handler for this execution
        const originalOnMessage = wsRef.onmessage;
        
        // Create a handler for WebSocket messages during script execution
        wsRef.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'output') {
                    // Clean ANSI escape sequences
                    const cleanOutput = data.data.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
                    console.log('Raw output:', JSON.stringify(cleanOutput));
                    
                    // Process the output to filter out echoed input and system messages
                    if (cleanOutput.includes('Python') || cleanOutput.includes('>>>')) {
                        // Detected Python environment, send the script
                        setTimeout(() => {
                            wsRef.send(JSON.stringify({
                                type: 'input',
                                data: cleanedContent + '\n'
                            }));
                        }, 500);
                    }
                    
                    // Check for actual output
                    if (cleanOutput.includes('print(') || cleanOutput.trim() === '') {
                        // Skip echoed input or empty lines
                        return;
                    }
                    
                    // Process output line by line
                    const lines = cleanOutput.split('\n');
                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (trimmedLine && !cleanedContent.includes(trimmedLine)) {
                            setPythonScriptOutput(prev => [...prev, trimmedLine]);
                        }
                    }
                }
            } catch (err) {
                console.error('Error processing WebSocket message:', err);
            }
        };
        
        // Start Python if needed
        wsRef.send(JSON.stringify({ 
            type: 'input', 
            data: 'python3\n' 
        }));
        
        // Set a timeout to restore the original handler and mark completion
        setTimeout(() => {
            // Restore original handler
            wsRef.onmessage = originalOnMessage;
            
            // Mark execution as complete
            setPythonScriptOutput(prev => [...prev, '=== Execution complete ===']);
            setExecutionStatus('success');
        }, 10000); // 10 second timeout
        
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
            
            {/* Output display */}
            {pythonScriptOutput.length > 0 && (
                <div className="python-output-container">
                    <h4>Script Output:</h4>
                    <pre className="python-output">
                        {pythonScriptOutput.join('\n')}
                    </pre>
                </div>
            )}
            
            {/* Show instructions if no output */}
            {pythonScriptOutput.length === 0 && (
                <div className="python-instructions">
                    <p>Click the "Execute Python" button next to a Python file in the Concrete Implementation section to run a script.</p>
                </div>
            )}
        </div>
    );
};

export default PythonExecutionArea;
