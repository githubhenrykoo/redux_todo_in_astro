import React from 'react';

/**
 * Component for displaying script header information
 */
const ScriptHeader = ({ scriptInfo }) => {
    return (
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
    );
};

export default ScriptHeader;
