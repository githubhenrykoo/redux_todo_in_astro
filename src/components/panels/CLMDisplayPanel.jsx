'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../../styles/clm-display.css';
import PythonExecutionArea from '../clm/PythonExecutionArea';
import LinkedFiles from '../clm/LinkedFiles';
import AbstractSpecification from '../clm/AbstractSpecification';
import ConcreteImplementation from '../clm/ConcreteImplementation';
import BalancedExpectations from '../clm/BalancedExpectations';

const CLMDisplayPanel = ({ initialHash = '' }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [rootClm, setRootClm] = useState(null);
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
    // Python script execution state
    const [pythonScriptOutput, setPythonScriptOutput] = useState([]);
    const [executionStatus, setExecutionStatus] = useState('idle'); // 'idle', 'running', 'success', 'error'
    const [wsRef, setWsRef] = useState(null);

    const dispatch = useDispatch();
    
    // Use Redux selectors to get the selected hash and cards
    const selectedHash = useSelector(state => state?.content?.selectedHash || initialHash);
    const cards = useSelector(state => state?.content?.cards || {});
    
    // Set up WebSocket connection for Python execution
    useEffect(() => {
        console.log('CLMDisplayPanel: Setting up WebSocket connection for Python execution');
        const ws = new WebSocket('ws://localhost:3010');
        
        ws.onopen = () => {
            console.log('CLMDisplayPanel: WebSocket connected');
            setWsRef(ws);
        };
        
        ws.onerror = (error) => {
            console.error('CLMDisplayPanel: WebSocket connection error:', error);
        };
        
        ws.onclose = () => {
            console.log('CLMDisplayPanel: WebSocket connection closed');
            setWsRef(null);
        };
        
        // Clean up on unmount
        return () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, []);
    
    // Get the root CLM card from Redux store
    const rootClmMemo = useMemo(() => {
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
        console.log('Root CLM:', rootClmMemo);
        // Clear any previous error
        setError(null);
        
        if (rootClmMemo) {
            if (rootClmMemo.dimensions) {
                loadDimensions(rootClmMemo.dimensions);
                // Search for related Balanced Expectations
                if (selectedHash) {
                    searchBalancedExpectations(selectedHash);
                }
            } else if (rootClmMemo.type === 'clm_document' && rootClmMemo.dimensions) {
                // Special handling for clm_document type
                loadDimensions(rootClmMemo.dimensions);
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
                setError(`Invalid CLM format: dimensions property is missing. Content type: ${typeof rootClmMemo}, Keys: ${Object.keys(rootClmMemo).join(', ')}`);
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
    }, [rootClmMemo]);

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
                    <pre>{JSON.stringify({rootClm: rootClmMemo, debug}, null, 2)}</pre>
                </div>
            </div>
        );
    }
    
    if (!rootClmMemo) {
        return <div className="clm-display-empty" style={{ overflowY: 'auto' }}>No CLM selected. Please select a CLM to view.</div>;
    }
    
    return (
        <div className="clm-display-panel" style={{ overflowY: 'auto' }}>
            <h2>{rootClmMemo.title || 'Untitled CLM'}</h2>
            
            {/* Debug Info - Comment out in production */}
            <div className="clm-debug-info" style={{ display: 'none' }}>
                <h3>Debug Info</h3>
                <pre>{JSON.stringify(debug, null, 2)}</pre>
            </div>
            
            {/* Display CLM in table format */}
            <table className="clm-table" width="600">
                <tbody>
                    {/* Abstract Specification Section */}
                    <AbstractSpecification 
                        context={context}
                        goal={goal}
                        successCriteria={successCriteria}
                    />
                    
                    {/* Concrete Implementation Section */}
                    <ConcreteImplementation 
                        inputs={inputs}
                        activities={activities}
                        outputs={outputs}
                        cards={cards}
                        wsRef={wsRef}
                        executionStatus={executionStatus}
                        setPythonScriptOutput={setPythonScriptOutput}
                        setExecutionStatus={setExecutionStatus}
                    />
                </tbody>
            </table>
            
            {/* Dimension Hash References */}
            <div className="clm-dimension-hashes">
                <h3>Dimension Hash References</h3>
                <ul>
                    {rootClmMemo?.dimensions?.abstractSpecification && (
                        <li><strong>Abstract Specification:</strong> <code>{rootClmMemo.dimensions.abstractSpecification}</code></li>
                    )}
                    {rootClmMemo?.dimensions?.concreteImplementation && (
                        <li><strong>Concrete Implementation:</strong> <code>{rootClmMemo.dimensions.concreteImplementation}</code></li>
                    )}
                </ul>
            </div>
            
            {/* Python Script Execution Output Section */}
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
            
            {/* Balanced Expectations Section */}
            <BalancedExpectations 
                balancedExpectations={balancedExpectations} 
                selectedHash={selectedHash}
            />

            {/* JSON Structure Display - Optional, can be commented out if not needed */}
            <div className="clm-root-json">
                <h3>Root CLM Structure</h3>
                <pre className="json-display">
{JSON.stringify({
  title: rootClmMemo?.title || 'Cubical Logic Model',
  type: rootClmMemo?.type || '',
  dimensions: {
    abstractSpecification: rootClmMemo?.dimensions?.abstractSpecification || '',
    concreteImplementation: rootClmMemo?.dimensions?.concreteImplementation || ''
  }
}, null, 2)}
                </pre>
            </div>
        </div>
    );
};

export default CLMDisplayPanel;
