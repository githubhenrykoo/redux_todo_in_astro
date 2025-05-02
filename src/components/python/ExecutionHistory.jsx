import React from 'react';

/**
 * Component for displaying execution history
 */
const ExecutionHistory = ({ history }) => {
    return (
        <div className="pse-execution-history">
            <h3>Execution History</h3>
            {history.length === 0 ? (
                <p className="pse-no-history">No execution history yet</p>
            ) : (
                <ul className="pse-history-list">
                    {history.map((entry, index) => (
                        <li key={index} className="pse-history-item">
                            <span className="pse-history-time">{entry.timestamp}</span>
                            <span className="pse-history-file">{entry.filename}</span>
                            <span className="pse-history-status">{entry.status}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ExecutionHistory;
