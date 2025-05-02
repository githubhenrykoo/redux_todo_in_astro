import React, { useState, useEffect, useMemo } from 'react';
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

    const dispatch = useDispatch();
    
    // Use Redux selectors to get the selected hash and cards
    const selectedHash = useSelector(state => state?.content?.selectedHash || initialHash);
    const cards = useSelector(state => state?.content?.cards || {});
    
    // Keep track of execution history
    const [executionHistory, setExecutionHistory] = useState([]);

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
    
    // Execute script in the REPL
    const executeScript = () => {
        if (!scriptContent) {
            setError("No script content to execute");
            return;
        }
        
        // Update execution status
        setExecutionStatus('running');
        
        // Dispatch event to execute script in the PythonREPL panel
        dispatch({
            type: 'pythonrepl/executeScript',
            payload: {
                content: scriptContent,
                hash: scriptInfo.hash,
                filename: scriptInfo.filename
            }
        });
        
        // Add to execution history
        const executionEntry = {
            timestamp: new Date().toLocaleString(),
            hash: scriptInfo.hash,
            filename: scriptInfo.filename,
            status: 'executed'
        };
        
        setExecutionHistory(prev => [executionEntry, ...prev.slice(0, 9)]); // Keep last 10 entries
        
        // After a delay, assume execution is done (since we don't have direct feedback)
        setTimeout(() => {
            setExecutionStatus('success');
        }, 2000);
    };
    
    // Send individual line to REPL
    const executeSelectedLine = () => {
        // Get selected text from script content (would need a textarea ref to implement)
        const selectedText = window.getSelection().toString();
        
        if (!selectedText) {
            setError("No text selected to execute");
            return;
        }
        
        // Dispatch event to execute the line in the PythonREPL panel
        dispatch({
            type: 'pythonrepl/executeLine',
            payload: {
                content: selectedText,
                hash: scriptInfo.hash
            }
        });
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
            
            <div className="pse-script-container">
                <h3>Script Content</h3>
                <pre className="pse-script-content">{scriptContent}</pre>
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
