import React from 'react';

/**
 * Component for displaying usage tips
 */
const DocumentationTips = () => {
    return (
        <div className="pse-documentation">
            <h3>Tips</h3>
            <ul>
                <li>You can select a portion of the script and click "Execute Selected Line" to run just that part</li>
                <li>Input fields will appear when the script requests user input</li>
                <li>Variables defined in one execution are available in subsequent executions</li>
                <li>Click "Reset REPL" if you want to clear all defined variables and start fresh</li>
            </ul>
        </div>
    );
};

export default DocumentationTips;
