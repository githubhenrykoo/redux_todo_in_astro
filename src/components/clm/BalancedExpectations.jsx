import React from 'react';
import { useDispatch } from 'react-redux';

/**
 * Component to display Balanced Expectations catalog for a CLM
 */
const BalancedExpectations = ({ balancedExpectations, selectedHash }) => {
    const dispatch = useDispatch();
    
    if (balancedExpectations.length === 0) {
        return (
            <div className="balanced-expectations-empty">
                <h3>Balanced Expectations Catalog</h3>
                <p>No Balanced Expectations found for this CLM.</p>
                <button 
                    className="create-be-button"
                    onClick={() => {
                        // Dispatch an action to open the Balanced Expectations creation form
                        dispatch({
                            type: 'ui/openCreateBEForm',
                            payload: {
                                clmHash: selectedHash
                            }
                        });
                    }}
                >
                    Create New Balanced Expectation
                </button>
            </div>
        );
    }
    
    return (
        <div className="balanced-expectations-section">
            <h3>Balanced Expectations Catalog</h3>
            <p>The following Balanced Expectations reference this CLM:</p>
            
            <table className="be-catalog-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Hash</th>
                        <th>Output Reference</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {balancedExpectations.map((beCard, index) => {
                        const beContent = typeof beCard.content === 'string' 
                            ? JSON.parse(beCard.content) 
                            : beCard.content;
                        
                        // Format timestamp if available
                        const timestamp = beCard.g_time || beCard.timestamp || '';
                        const formattedDate = timestamp ? new Date(timestamp).toLocaleString() : 'N/A';
                        
                        return (
                            <tr key={index} className="be-catalog-item">
                                <td>{index + 1}</td>
                                <td>
                                    <code className="hash-value">{beCard.hash?.substring(0, 12)}...</code>
                                </td>
                                <td>
                                    {beContent.outputReference ? (
                                        <code className="hash-value">{beContent.outputReference.substring(0, 12)}...</code>
                                    ) : 'N/A'}
                                </td>
                                <td>{formattedDate}</td>
                                <td>
                                    <button 
                                        className="be-view-button"
                                        onClick={() => {
                                            // Dispatch to view this BE card
                                            dispatch({
                                                type: 'content/setSelectedHash',
                                                payload: beCard.hash
                                            });
                                        }}
                                    >
                                        View
                                    </button>
                                    {beContent.outputReference && (
                                        <button 
                                            className="output-view-button"
                                            onClick={() => {
                                                // Dispatch to view the output
                                                dispatch({
                                                    type: 'content/setSelectedHash',
                                                    payload: beContent.outputReference
                                                });
                                            }}
                                        >
                                            View Output
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            
            {/* Add a button to create a new Balanced Expectation for this CLM */}
            <div className="be-actions">
                <button 
                    className="create-be-button"
                    onClick={() => {
                        // Dispatch an action to open the Balanced Expectations creation form
                        dispatch({
                            type: 'ui/openCreateBEForm',
                            payload: {
                                clmHash: selectedHash
                            }
                        });
                    }}
                >
                    Create New Balanced Expectation
                </button>
            </div>
        </div>
    );
};

export default BalancedExpectations;
