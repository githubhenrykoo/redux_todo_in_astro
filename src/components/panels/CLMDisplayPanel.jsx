'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../../styles/clm-display.css';

const CLMDisplayPanel = ({ initialHash = '' }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dimensions, setDimensions] = useState({
        abstractSpecification: null,
        concreteImplementation: null,
        balancedExpectations: null
    });
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
            } else if (rootClm.type === 'clm_document' && rootClm.dimensions) {
                // Special handling for clm_document type
                loadDimensions(rootClm.dimensions);
            } else {
                // Reset dimensions if no dimensions property
                setDimensions({
                    abstractSpecification: null,
                    concreteImplementation: null,
                    balancedExpectations: null
                });
                
                // Set error for debugging
                setError(`Invalid CLM format: dimensions property is missing. Content type: ${typeof rootClm}, Keys: ${Object.keys(rootClm).join(', ')}`);
            }
        } else {
            // Reset dimensions if no root CLM
            setDimensions({
                abstractSpecification: null,
                concreteImplementation: null,
                balancedExpectations: null
            });
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
                    // If not in store, fetch it
                    console.log(`Fetching Abstract Specification: ${abstractHash}`);
                    abstractSpec = await fetchDimension('abstractSpecification', abstractHash);
                }
                
                if (abstractSpec) {
                    setDimensions(prev => ({ ...prev, abstractSpecification: abstractSpec }));
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
                    // If not in store, fetch it
                    console.log(`Fetching Concrete Implementation: ${concreteHash}`);
                    concreteImpl = await fetchDimension('concreteImplementation', concreteHash);
                }
                
                if (concreteImpl) {
                    setDimensions(prev => ({ ...prev, concreteImplementation: concreteImpl }));
                }
            }
            
            // Check if balanced expectations is already in Redux store
            let balancedExp = null;
            if (dimensionHashes.balancedExpectations) {
                const balancedHash = dimensionHashes.balancedExpectations;
                
                // Check if the card is already in the Redux store
                if (cards[balancedHash]) {
                    console.log(`Found Balanced Expectations in Redux store: ${balancedHash}`);
                    balancedExp = typeof cards[balancedHash].content === 'string' 
                        ? JSON.parse(cards[balancedHash].content)
                        : cards[balancedHash].content;
                } else {
                    // If not in store, fetch it
                    console.log(`Fetching Balanced Expectations: ${balancedHash}`);
                    balancedExp = await fetchDimension('balancedExpectations', balancedHash);
                }
                
                if (balancedExp) {
                    setDimensions(prev => ({ ...prev, balancedExpectations: balancedExp }));
                }
            }
        } catch (error) {
            console.error('Error loading dimensions:', error);
            setError(`Error loading dimension data: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to fetch a single dimension by hash
    const fetchDimension = async (dimensionType, hash) => {
        setDebug(prev => ({ ...prev, lastFetchedHash: hash }));
        
        try {
            console.log(`Fetching dimension ${dimensionType} with hash: ${hash}`);
            
            // Construct the URL with query parameters for a GET request
            const url = new URL('/api/card-collection', window.location.origin);
            url.searchParams.append('action', 'get');
            url.searchParams.append('hash', hash);
            
            console.log(`API Request URL:`, url.toString());
            
            // Use fetch with GET method
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            console.log(`API Response status: ${response.status}`);
            
            // Store the raw response text for debugging
            const responseText = await response.text();
            
            setDebug(prev => ({ 
                ...prev, 
                apiResponse: {
                    status: response.status,
                    text: responseText.substring(0, 500) // Limit to first 500 chars for UI
                }
            }));
            
            if (!response.ok) {
                throw new Error(`Failed to fetch dimension: ${response.status}\nResponse: ${responseText.substring(0, 100)}...`);
            }
            
            // Parse the response text
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
            }
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to retrieve dimension data');
            }
            
            console.log(`Successfully retrieved dimension:`, result.card);
            
            // Store dimension data for debugging
            setDebug(prev => ({ 
                ...prev, 
                dimensionData: result.card 
            }));
            
            // Parse content if it's a string
            const content = typeof result.card.content === 'string' 
                ? JSON.parse(result.card.content) 
                : result.card.content;
                
            return content;
        } catch (error) {
            console.error(`Error fetching dimension ${dimensionType}:`, error);
            throw error;
        }
    };

    // Helper function to format content based on type
    const formatContent = (content) => {
        if (!content) return '';
        
        // If content is already a string, return it
        if (typeof content === 'string') return content;
        
        // If it's an object (parsed JSON), stringify it for display
        if (typeof content === 'object') {
            try {
                // Filter out createdAt if it exists
                const { createdAt, ...filteredContent } = content;
                return JSON.stringify(filteredContent, null, 2);
            } catch (e) {
                console.error('Error stringifying content:', e);
            }
        }
        
        // Fallback: convert to string
        return String(content);
    };

    // Show loading state while dimensions are being loaded
    if (loading) {
        return <div className="clm-display-loading">Loading CLM dimensions...</div>;
    }

    // Show error message if there was a problem
    if (error) {
        return <div className="clm-display-error">
            <h3>Error</h3>
            <p>{error}</p>
            
            {/* Debug information */}
            <div className="debug-section">
                <h4>Debug Information</h4>
                
                <div className="debug-item">
                    <h5>Last Fetched Hash:</h5>
                    <pre>{debug.lastFetchedHash || 'None'}</pre>
                </div>
                
                {debug.apiResponse && (
                    <div className="debug-item">
                        <h5>API Response:</h5>
                        <p>Status: {debug.apiResponse.status}</p>
                        <pre>{debug.apiResponse.text || 'No response text'}</pre>
                    </div>
                )}
                
                <div className="debug-item">
                    <h5>Dimension Hash References:</h5>
                    <ul>
                        {rootClm?.dimensions?.abstractSpecification && (
                            <li><strong>Abstract Specification:</strong> <code>{rootClm.dimensions.abstractSpecification}</code></li>
                        )}
                        {rootClm?.dimensions?.concreteImplementation && (
                            <li><strong>Concrete Implementation:</strong> <code>{rootClm.dimensions.concreteImplementation}</code></li>
                        )}
                        {rootClm?.dimensions?.balancedExpectations && (
                            <li><strong>Balanced Expectations:</strong> <code>{rootClm.dimensions.balancedExpectations}</code></li>
                        )}
                    </ul>
                </div>
            </div>
        </div>;
    }

    // Show placeholder if no CLM is selected
    if (!selectedHash || !rootClm) {
        return <div className="clm-display-placeholder">
            <h3>CLM Viewer</h3>
            <p>Select a CLM from the content panel to view it</p>
        </div>;
    }

    return (
        <div className="clm-display-panel">
            <h2 className="clm-title">{rootClm?.title || 'Cubical Logic Model'}</h2>
            
            <div className="clm-metadata">
                <p><strong>CLM Hash:</strong> <code>{selectedHash || 'N/A'}</code></p>
                {rootClm?.type && <p><strong>Type:</strong> <code>{rootClm.type}</code></p>}
            </div>
            
            {/* Root CLM JSON Structure Display */}
            <div className="clm-root-json">
                <h3>Root CLM Structure</h3>
                <pre className="json-display">
{JSON.stringify({
  title: rootClm?.title || 'Cubical Logic Model',
  type: rootClm?.type || '',
  dimensions: {
    abstractSpecification: rootClm?.dimensions?.abstractSpecification || '',
    concreteImplementation: rootClm?.dimensions?.concreteImplementation || '',
    balancedExpectations: rootClm?.dimensions?.balancedExpectations || ''
  }
}, null, 2)}
                </pre>
            </div>
            
            {/* Balanced Expectations Catalog Display */}
            {dimensions.balancedExpectations && (
                <div className="balanced-expectations-catalog">
                    <h3>Balanced Expectations Dimension</h3>
                    <div className="catalog-item">
                        <div className="catalog-header">
                            <span className="dimension-type">dimensionType: balancedExpectations</span>
                            <span className="dimension-hash">Hash: {rootClm?.dimensions?.balancedExpectations?.substring(0, 10) || 'N/A'}...</span>
                        </div>
                        
                        <div className="catalog-content">
                            <div className="catalog-section">
                                <h4>CLM Reference</h4>
                                <p>{dimensions.balancedExpectations.clmReference || 'sha256:clm123...'}</p>
                            </div>
                            
                            <div className="catalog-section">
                                <h4>Practical Boundaries</h4>
                                <p>{dimensions.balancedExpectations.practicalBoundaries || 'System constraints and error handling strategies'}</p>
                            </div>
                            
                            <div className="catalog-section">
                                <h4>Evaluation Metrics</h4>
                                <p>{dimensions.balancedExpectations.evaluationMetrics || 'Performance indicators and monitoring thresholds'}</p>
                            </div>
                            
                            <div className="catalog-section">
                                <h4>Feedback Loops</h4>
                                <p>{dimensions.balancedExpectations.feedbackLoops || 'User feedback channels and continuous improvement processes'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* JSON Structure of Balanced Expectations */}
            {dimensions.balancedExpectations && (
                <div className="balanced-expectations-json">
                    <h3>Balanced Expectations JSON</h3>
                    <pre className="json-display">
{JSON.stringify({
  dimensionType: "balancedExpectations",
  clmReference: dimensions.balancedExpectations.clmReference || "sha256:clm123...",
  practicalBoundaries: dimensions.balancedExpectations.practicalBoundaries || "System constraints and error handling strategies",
  evaluationMetrics: dimensions.balancedExpectations.evaluationMetrics || "Performance indicators and monitoring thresholds",
  feedbackLoops: dimensions.balancedExpectations.feedbackLoops || "User feedback channels and continuous improvement processes"
}, null, 2)}
                    </pre>
                </div>
            )}
            
            {/* Display available dimensions */}
            <div className="balanced-expectations-catalog">
                <h3>Available Dimensions</h3>
                <div className="catalog-item">
                    <div className="catalog-header">
                        <span className="dimension-type">Dimension Status</span>
                    </div>
                    
                    <div className="catalog-content">
                        {rootClm?.dimensions?.abstractSpecification && (
                            <div className="catalog-section">
                                <h4>Abstract Specification</h4>
                                <p>Hash: <code>{rootClm.dimensions.abstractSpecification}</code></p>
                                <p>Status: {dimensions.abstractSpecification ? '✅ Loaded' : '❌ Not Loaded'}</p>
                            </div>
                        )}
                        
                        {rootClm?.dimensions?.concreteImplementation && (
                            <div className="catalog-section">
                                <h4>Concrete Implementation</h4>
                                <p>Hash: <code>{rootClm.dimensions.concreteImplementation}</code></p>
                                <p>Status: {dimensions.concreteImplementation ? '✅ Loaded' : '❌ Not Loaded'}</p>
                            </div>
                        )}
                        
                        {rootClm?.dimensions?.balancedExpectations && (
                            <div className="catalog-section">
                                <h4>Balanced Expectations</h4>
                                <p>Hash: <code>{rootClm.dimensions.balancedExpectations}</code></p>
                                <p>Status: {dimensions.balancedExpectations ? '✅ Loaded' : '❌ Not Loaded'}</p>
                            </div>
                        )}
                        
                        {!rootClm?.dimensions?.balancedExpectations && (
                            <div className="catalog-section">
                                <h4>Balanced Expectations</h4>
                                <p>This dimension is not available in the current CLM document.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
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
                    {rootClm?.dimensions?.balancedExpectations && (
                        <li><strong>Balanced Expectations:</strong> <code>{rootClm.dimensions.balancedExpectations}</code></li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default CLMDisplayPanel;
