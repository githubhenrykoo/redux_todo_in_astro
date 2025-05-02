import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import '../../styles/python-script-execution.css';

// Import custom hooks
import { usePythonScript } from '../../hooks/usePythonScript';
import { usePythonExecution } from '../../hooks/usePythonExecution';

// Import components
import ScriptHeader from '../python/ScriptHeader';
import ExecutionControls from '../python/ExecutionControls';
import ScriptContent from '../python/ScriptContent';
import ExecutionOutput from '../python/ExecutionOutput';
import DirectREPLFrame from '../python/DirectREPLFrame';
import ExecutionHistory from '../python/ExecutionHistory';
import DocumentationTips from '../python/DocumentationTips';

/**
 * Python Script Execution Panel - displays and executes Python scripts
 */
const PythonScriptExecutionPanel = ({ initialHash = '' }) => {
    // References
    const inputRef = useRef(null);
    
    // Use custom hooks
    const { 
        loading, 
        error, 
        scriptContent, 
        scriptInfo, 
        scriptFile,
        setError
    } = usePythonScript(initialHash);
    
    const {
        scriptOutput,
        waitingForInput,
        userInput,
        executionStatus,
        executionHistory,
        setUserInput,
        executeDirectly,
        executeScript,
        executeSelectedLine,
        resetREPL,
        clearREPL,
        handleInputSubmit
    } = usePythonExecution(scriptContent, scriptInfo);
    
    // Get REPL output and status from Redux
    const replOutput = useSelector(state => state?.pythonrepl?.output || []);
    const replStatus = useSelector(state => state?.pythonrepl?.status || 'idle');
    
    // Subscribe to REPL output changes
    useEffect(() => {
        console.log("REPL Output Changed:", replOutput);
    }, [replOutput]);
    
    // Subscribe to REPL status changes
    useEffect(() => {
        console.log("REPL Status Changed:", replStatus);
    }, [replStatus]);

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
            {/* Script Header */}
            <ScriptHeader scriptInfo={scriptInfo} />
            
            {/* Execution Controls */}
            <ExecutionControls 
                executionStatus={executionStatus} 
                scriptContent={scriptContent}
                executeScript={executeScript}
                executeDirectly={executeDirectly}
                executeSelectedLine={executeSelectedLine}
                clearREPL={clearREPL}
                resetREPL={resetREPL}
            />
            
            {/* Error Display */}
            {error && (
                <div className="pse-warning">
                    <p>{error}</p>
                </div>
            )}
            
            <div className="pse-container">
                {/* Script Content */}
                <ScriptContent content={scriptContent} />
                
                {/* Output Section */}
                <div className="pse-output-section">
                    {/* Execution Output */}
                    <ExecutionOutput 
                        output={scriptOutput}
                        waitingForInput={waitingForInput}
                        userInput={userInput}
                        setUserInput={setUserInput}
                        handleInputSubmit={handleInputSubmit}
                        inputRef={inputRef}
                    />
                    
                    {/* Direct REPL Frame */}
                    <DirectREPLFrame />
                </div>
            </div>
            
            {/* Execution History */}
            <ExecutionHistory history={executionHistory} />
            
            {/* Documentation Tips */}
            <DocumentationTips />
        </div>
    );
};

export default PythonScriptExecutionPanel;
