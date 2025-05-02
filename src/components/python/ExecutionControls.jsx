import React from 'react';

/**
 * Component for script execution controls
 */
const ExecutionControls = ({ 
    executionStatus, 
    scriptContent, 
    executeScript, 
    executeDirectly,
    executeSelectedLine,
    clearREPL,
    resetREPL
}) => {
    return (
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
    );
};

export default ExecutionControls;
