'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../../styles/clm-display.css';

const CLMDisplayPanel = ({ initialHash = '' }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dimensions, setDimensions] = useState({
        abstractSpecification: null,
        concreteImplementation: null
    });
    const [balancedExpectations, setBalancedExpectations] = useState([]);
    const [debug, setDebug] = useState({
        lastFetchedHash: null,
        apiResponse: null,
        dimensionData: null
    });

    const dispatch = useDispatch();
    
    // Use Redux selectors to get the selected hash and cards
    const selectedHash = useSelector(state => state?.content?.selectedHash || initialHash);
    const cards = useSelector(state => state?.content?.cards || {});
    
    // Get the root CLM card from Redux store
    const rootClm = useMemo(() => {
        // Find the card by hash
        const selectedCard = selectedHash ? cards[selectedHash] : null;
        if (selectedCard && selectedCard.content) {
            try {
                // If content is a string, try to parse it
                const content = typeof selectedCard.content === 'string' 
                    ? JSON.parse(selectedCard.content) 
                    : selectedCard.content;
                
                // Filter out createdAt if it exists in the content
                const { createdAt, ...filteredContent } = content;
                return filteredContent;
            } catch (err) {
                console.error('Error parsing CLM content:', err);
                return selectedCard.content;
            }
        }
        return null;
    }, [cards, selectedHash]);

    // Load dimensions when root CLM changes
    useEffect(() => {
        console.log('Root CLM:', rootClm);
        // Clear any previous error
        setError(null);
        
        if (rootClm) {
            if (rootClm.dimensions) {
                loadDimensions(rootClm.dimensions);
                // Search for related Balanced Expectations
                if (selectedHash) {
                    searchBalancedExpectations(selectedHash);
                }
            } else if (rootClm.type === 'clm_document' && rootClm.dimensions) {
                // Special handling for clm_document type
                loadDimensions(rootClm.dimensions);
                // Search for related Balanced Expectations
                if (selectedHash) {
                    searchBalancedExpectations(selectedHash);
                }
            } else {
                // Reset dimensions if no dimensions property
                setDimensions({
                    abstractSpecification: null,
                    concreteImplementation: null
                });
                
                // Set error for debugging
                setError(`Invalid CLM format: dimensions property is missing. Content type: ${typeof rootClm}, Keys: ${Object.keys(rootClm).join(', ')}`);
            }
        } else {
            // Reset dimensions if no root CLM
            setDimensions({
                abstractSpecification: null,
                concreteImplementation: null
            });
            // Reset balanced expectations too
            setBalancedExpectations([]);
        }
    }, [rootClm]);

    // Load all dimensions from the Redux store or fetch if needed
    const loadDimensions = async (dimensionHashes) => {
        try {
            // If dimensionHashes is undefined or null, throw an error
            if (!dimensionHashes) {
                throw new Error("Dimension hashes are undefined");
            }
            
            setLoading(true);
            setError(null);
            console.log('Loading dimensions:', dimensionHashes);
            
            // Check if abstract specification is already in Redux store
            let abstractSpec = null;
            if (dimensionHashes.abstractSpecification) {
                const abstractHash = dimensionHashes.abstractSpecification;
                
                // Check if the card is already in the Redux store
                if (cards[abstractHash]) {
                    console.log(`Found Abstract Specification in Redux store: ${abstractHash}`);
                    abstractSpec = typeof cards[abstractHash].content === 'string' 
                        ? JSON.parse(cards[abstractHash].content) 
                        : cards[abstractHash].content;
                } else {
                    // Fetch the abstract specification dimension
                    console.log(`Fetching Abstract Specification: ${abstractHash}`);
                    abstractSpec = await fetchDimension('abstractSpecification', abstractHash);
                }
            }

            // Check if concrete implementation is already in Redux store
            let concreteImpl = null;
            if (dimensionHashes.concreteImplementation) {
                const concreteHash = dimensionHashes.concreteImplementation;
                
                // Check if the card is already in the Redux store
                if (cards[concreteHash]) {
                    console.log(`Found Concrete Implementation in Redux store: ${concreteHash}`);
                    concreteImpl = typeof cards[concreteHash].content === 'string' 
                        ? JSON.parse(cards[concreteHash].content) 
                        : cards[concreteHash].content;
                } else {
                    // Fetch the concrete implementation dimension
                    console.log(`Fetching Concrete Implementation: ${concreteHash}`);
                    concreteImpl = await fetchDimension('concreteImplementation', concreteHash);
                }
            }

            // Update dimensions in state
            setDimensions({
                abstractSpecification: abstractSpec,
                concreteImplementation: concreteImpl
            });

            // Save for debugging
            setDebug(prev => ({
                ...prev,
                dimensionData: {
                    abstractSpecification: abstractSpec,
                    concreteImplementation: concreteImpl
                }
            }));
            
        } catch (error) {
            console.error('Error loading dimensions:', error);
            setError(`Error loading dimensions: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    // Search for Balanced Expectations that reference this CLM
    const searchBalancedExpectations = async (clmHash) => {
        try {
            const response = await fetch(`/api/card-collection?action=searchByContent&query=${clmHash}`);
            if (!response.ok) {
                throw new Error(`API returned ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Search results for Balanced Expectations:', data);
            
            // Filter results to find only Balanced Expectations that reference this CLM
            const balancedExpectationsFound = data.cards?.filter(card => {
                try {
                    const content = typeof card.content === 'string' 
                        ? JSON.parse(card.content) 
                        : card.content;
                    
                    return content.dimensionType === 'balancedExpectations' && 
                           content.clmReference === clmHash;
                } catch (err) {
                    console.error('Error parsing card content:', err);
                    return false;
                }
            }) || [];
            
            setBalancedExpectations(balancedExpectationsFound);
            
        } catch (error) {
            console.error('Error searching for Balanced Expectations:', error);
            // Don't set an error state for this, just log it
        }
    };

    // Helper function to fetch a single dimension by hash
    const fetchDimension = async (dimensionType, hash) => {
        try {
            console.log(`Fetching ${dimensionType} dimension with hash ${hash}`);
            
            // Update debug state
            setDebug(prev => ({
                ...prev,
                lastFetchedHash: hash
            }));
            
            // Make the API call
            const response = await fetch(`/api/card-collection?action=get&hash=${hash}`);
            
            // Check if response is OK
            if (!response.ok) {
                throw new Error(`API returned ${response.status}: ${response.statusText}`);
            }
            
            // Parse the response JSON
            const responseData = await response.json();
            console.log(`${dimensionType} API response:`, responseData);
            
            // Update debug state with the response data
            setDebug(prev => ({
                ...prev,
                apiResponse: responseData
            }));
            
            // Extract content from the response data
            let content = null;
            if (responseData.card && responseData.card.content) {
                content = typeof responseData.card.content === 'string'
                    ? JSON.parse(responseData.card.content)
                    : responseData.card.content;
            }
            
            // Dispatch to Redux store to cache the dimension
            if (content && hash) {
                dispatch({
                    type: 'content/addCard',
                    payload: {
                        hash,
                        card: responseData.card
                    }
                });
            }
            
            return content;
        } catch (error) {
            console.error(`Error fetching ${dimensionType} dimension:`, error);
            setError(`Error fetching ${dimensionType} dimension: ${error.message}`);
            return null;
        }
    };
    
    // Helper function to format content based on type
    const formatContent = (content) => {
        if (!content) {
            return null;
        }
        
        if (typeof content === 'string') {
            return content;
        }
        
        if (Array.isArray(content)) {
            return content.join('\n');
        }
        
        if (typeof content === 'object') {
            try {
                return JSON.stringify(content, null, 2);
            } catch (e) {
                return `Error formatting content: ${e.message}`;
            }
        }
        
        return String(content);
    };
    
    // Helper function to detect and format file references
    const formatLinkedFiles = (content) => {
        if (!content) return null;
        
        // If content is a string but contains linkedFiles marker
        if (typeof content === 'string' && content.includes('linkedFiles:')) {
            const parts = content.split('linkedFiles:');
            return (
                <div>
                    <div>{parts[0]}</div>
                    <div className="linked-files-section">
                        <h4>Linked Files</h4>
                        <div className="linked-files-list">
                            {parts[1].trim().split('\n').map((fileHash, idx) => (
                                <div key={idx} className="linked-file-item">
                                    <span className="file-hash">{fileHash.trim()}</span>
                                    <button 
                                        className="view-file-btn"
                                        onClick={() => {
                                            // Dispatch to view this file
                                            dispatch({
                                                type: 'content/setSelectedHash',
                                                payload: fileHash.trim()
                                            });
                                        }}
                                    >
                                        View
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }
        
        // If content is an object with linkedFiles property
        if (typeof content === 'object' && content.linkedFiles) {
            const { linkedFiles, ...restContent } = content;
            const mainContent = Object.keys(restContent).length > 0 
                ? formatContent(restContent) 
                : '';
                
            return (
                <div>
                    <div>{mainContent}</div>
                    <div className="linked-files-section">
                        <h4>Linked Files</h4>
                        <div className="linked-files-list">
                            {Array.isArray(linkedFiles) 
                                ? linkedFiles.map((fileHash, idx) => (
                                    <div key={idx} className="linked-file-item">
                                        <span className="file-hash">{fileHash}</span>
                                        <button 
                                            className="view-file-btn"
                                            onClick={() => {
                                                // Dispatch to view this file
                                                dispatch({
                                                    type: 'content/setSelectedHash',
                                                    payload: fileHash
                                                });
                                            }}
                                        >
                                            View
                                        </button>
                                    </div>
                                ))
                                : (
                                    <div className="linked-file-item">
                                        <span className="file-hash">{linkedFiles}</span>
                                        <button 
                                            className="view-file-btn"
                                            onClick={() => {
                                                // Dispatch to view this file
                                                dispatch({
                                                    type: 'content/setSelectedHash',
                                                    payload: linkedFiles
                                                });
                                            }}
                                        >
                                            View
                                        </button>
                                    </div>
                                )
                            }
                        </div>
                    </div>
                </div>
            );
        }
        
        return formatContent(content);
    };
    
    // Extract content from dimensions for display
    const abstractSpec = dimensions.abstractSpecification || {};
    const context = abstractSpec.context;
    const goal = abstractSpec.goal;
    const successCriteria = abstractSpec.successCriteria;
    
    const concreteImpl = dimensions.concreteImplementation || {};
    const inputs = concreteImpl.inputs;
    const activities = concreteImpl.activities;
    const outputs = concreteImpl.outputs;
    
    if (loading) {
        return <div className="clm-display-loading">Loading CLM dimensions...</div>;
    }
    
    if (error) {
        return (
            <div className="clm-display-error">
                <h2>Error Loading CLM</h2>
                <p>{error}</p>
                <div className="debug-info">
                    <h3>Debug Information</h3>
                    <pre>{JSON.stringify({rootClm, debug}, null, 2)}</pre>
                </div>
            </div>
        );
    }
    
    if (!rootClm) {
        return <div className="clm-display-empty">No CLM selected. Please select a CLM to view.</div>;
    }
    
    return (
        <div className="clm-display-panel">
            <h2>{rootClm.title || 'Untitled CLM'}</h2>
            
            {/* Debug Info - Comment out in production */}
            <div className="clm-debug-info" style={{ display: 'none' }}>
                <h3>Debug Info</h3>
                <pre>{JSON.stringify(debug, null, 2)}</pre>
            </div>
            
            {/* Display CLM in table format */}
            <table className="clm-table" width="600">
                {/* Abstract Specification Section */}
                <tbody>
                    <tr>
                        <th colSpan={6}><a href="#abstract-specification">Abstract Specification</a></th>
                    </tr>
                    <tr>
                        <th colSpan={1}><a href="#context">Context</a></th>
                        <td colSpan={5} style={{ wordWrap: 'break-word' }}>
                            {formatContent(context) || 'No context available'}
                        </td>
                    </tr>
                    <tr>
                        <th colSpan={1}><a href="#goal">Goal</a></th>
                        <td colSpan={5} style={{ wordWrap: 'break-word' }}>
                            {formatContent(goal) || 'No goal available'}
                        </td>
                    </tr>
                    <tr>
                        <th colSpan={1}><a href="#success-criteria">Success Criteria</a></th>
                        <td colSpan={5} style={{ wordWrap: 'break-word' }}>
                            {formatContent(successCriteria) || 'No success criteria available'}
                        </td>
                    </tr>
                    
                    {/* Concrete Implementation Section */}
                    <tr>
                        <th colSpan={6}><a href="#concrete-implementation">Concrete Implementation</a></th>
                    </tr>
                    <tr>
                        <th colSpan={2}><a href="#inputs">Inputs</a></th>
                        <th colSpan={2}><a href="#activities">Activities</a></th>
                        <th colSpan={2}><a href="#outputs">Outputs</a></th>
                    </tr>
                    <tr>
                        <td colSpan={2} style={{ wordWrap: 'break-word' }}>
                            {formatLinkedFiles(inputs) || 'No inputs available'}
                        </td>
                        <td colSpan={2} style={{ wordWrap: 'break-word' }}>
                            {formatLinkedFiles(activities) || 'No activities available'}
                        </td>
                        <td colSpan={2} style={{ wordWrap: 'break-word' }}>
                            {formatLinkedFiles(outputs) || 'No outputs available'}
                        </td>
                    </tr>
                </tbody>
            </table>
            
            {/* Dimension Hash References */}
            <div className="clm-dimension-hashes">
                <h3>Dimension Hash References</h3>
                <ul>
                    {rootClm?.dimensions?.abstractSpecification && (
                        <li><strong>Abstract Specification:</strong> <code>{rootClm.dimensions.abstractSpecification}</code></li>
                    )}
                    {rootClm?.dimensions?.concreteImplementation && (
                        <li><strong>Concrete Implementation:</strong> <code>{rootClm.dimensions.concreteImplementation}</code></li>
                    )}
                </ul>
            </div>
            
            {/* Balanced Expectations Section - Shows any found Balanced Expectations that reference this CLM */}
            {balancedExpectations.length > 0 && (
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
            )}
            
            {/* Display empty message if no Balanced Expectations found */}
            {balancedExpectations.length === 0 && selectedHash && (
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
            )}

            {/* JSON Structure Display - Optional, can be commented out if not needed */}
            <div className="clm-root-json">
                <h3>Root CLM Structure</h3>
                <pre className="json-display">
{JSON.stringify({
  title: rootClm?.title || 'Cubical Logic Model',
  type: rootClm?.type || '',
  dimensions: {
    abstractSpecification: rootClm?.dimensions?.abstractSpecification || '',
    concreteImplementation: rootClm?.dimensions?.concreteImplementation || ''
  }
}, null, 2)}
                </pre>
            </div>
        </div>
    );
};

export default CLMDisplayPanel;
