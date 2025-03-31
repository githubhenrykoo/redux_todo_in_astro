'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../../styles/clm-display.css';

const CLMDisplayPanel = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dimensions, setDimensions] = useState({
        abstractSpecification: null,
        concreteImplementation: null,
        balancedExpectations: null
    });

    const dispatch = useDispatch();
    
    // Use Redux selectors to get the selected hash and cards
    const selectedHash = useSelector(state => state?.content?.selectedHash);
    const cards = useSelector(state => state?.content?.cards || {});
    
    // Get the root CLM card from Redux store
    const rootClm = useMemo(() => {
        // Find the card by hash
        const selectedCard = selectedHash ? cards[selectedHash] : null;
        return selectedCard ? selectedCard.content : null;
    }, [cards, selectedHash]);

    // Load dimensions when root CLM changes
    useEffect(() => {
        if (rootClm && rootClm.dimensions) {
            loadDimensions(rootClm.dimensions);
        } else {
            // Reset dimensions if no root CLM
            setDimensions({
                abstractSpecification: null,
                concreteImplementation: null,
                balancedExpectations: null
            });
            
            // If rootClm exists but dimensions are missing, set error
            if (rootClm && !rootClm.dimensions) {
                setError("Invalid CLM format: dimensions property is missing");
            }
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
            
            // Check if abstract specification is already in Redux store
            let abstractSpec = null;
            if (dimensionHashes.abstractSpecification) {
                const abstractHash = dimensionHashes.abstractSpecification;
                if (cards[abstractHash]) {
                    abstractSpec = cards[abstractHash].content;
                } else {
                    // If not in store, fetch it
                    abstractSpec = await fetchDimension(abstractHash);
                }
                setDimensions(prev => ({ ...prev, abstractSpecification: abstractSpec }));
            }
            
            // Check if concrete implementation is already in Redux store
            let concreteImpl = null;
            if (dimensionHashes.concreteImplementation) {
                const concreteHash = dimensionHashes.concreteImplementation;
                if (cards[concreteHash]) {
                    concreteImpl = cards[concreteHash].content;
                } else {
                    // If not in store, fetch it
                    concreteImpl = await fetchDimension(concreteHash);
                }
                setDimensions(prev => ({ ...prev, concreteImplementation: concreteImpl }));
            }
            
            // Check if balanced expectations is already in Redux store
            let balancedExp = null;
            if (dimensionHashes.balancedExpectations) {
                const balancedHash = dimensionHashes.balancedExpectations;
                if (cards[balancedHash]) {
                    balancedExp = cards[balancedHash].content;
                } else {
                    // If not in store, fetch it
                    balancedExp = await fetchDimension(balancedHash);
                }
                setDimensions(prev => ({ ...prev, balancedExpectations: balancedExp }));
            }
        } catch (error) {
            console.error('Error loading dimensions:', error);
            setError(`Error loading dimension data: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to fetch a single dimension by hash
    const fetchDimension = async (hash) => {
        const response = await fetch('/api/card-collection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'get',
                hash: hash
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch dimension: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Failed to retrieve dimension data');
        }

        return result.card.content;
    };

    // Helper function to format content based on type
    const formatContent = (content) => {
        if (!content) return '';
        
        // If content is already a string, return it
        if (typeof content === 'string') return content;
        
        // If it's an object (parsed JSON), stringify it for display
        if (typeof content === 'object') {
            try {
                return JSON.stringify(content, null, 2);
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
        return <div className="clm-display-error">{error}</div>;
    }

    // Show placeholder if no CLM is selected
    if (!selectedHash || !rootClm) {
        return <div className="clm-display-placeholder">
            <h3>CLM Viewer</h3>
            <p>Select a CLM from the content panel to view it</p>
        </div>;
    }

    // Show error if dimensions couldn't be loaded
    if (!dimensions.abstractSpecification || !dimensions.concreteImplementation || !dimensions.balancedExpectations) {
        return <div className="clm-display-error">
            <h3>Incomplete CLM Data</h3>
            <p>Unable to load all dimensions for this CLM. Some dimension hashes may be invalid or unavailable.</p>
            <div className="clm-incomplete-details">
                <p>CLM Hash: <code>{selectedHash}</code></p>
                <p>Missing dimensions:</p>
                <ul>
                    {!dimensions.abstractSpecification && rootClm?.dimensions?.abstractSpecification && 
                        <li>Abstract Specification ({rootClm.dimensions.abstractSpecification})</li>}
                    {!dimensions.concreteImplementation && rootClm?.dimensions?.concreteImplementation && 
                        <li>Concrete Implementation ({rootClm.dimensions.concreteImplementation})</li>}
                    {!dimensions.balancedExpectations && rootClm?.dimensions?.balancedExpectations && 
                        <li>Balanced Expectations ({rootClm.dimensions.balancedExpectations})</li>}
                </ul>
            </div>
        </div>;
    }

    // Extract the abstract specification dimension data
    const { context, goal, successCriteria } = dimensions.abstractSpecification || {};
    
    // Extract the concrete implementation dimension data
    const { inputs, activities, outputs } = dimensions.concreteImplementation || {};
    
    // Extract the balanced expectations dimension data
    const { practicalBoundaries, evaluationMetrics, feedbackLoops } = dimensions.balancedExpectations || {};

    return (
        <div className="clm-display-panel">
            <h2 className="clm-title">{rootClm?.title || 'Cubical Logic Model'}</h2>
            
            <div className="clm-metadata">
                <p><strong>CLM Hash:</strong> <code>{selectedHash?.substring(0, 10) || 'N/A'}...</code></p>
            </div>
            
            <table className="clm-table">
                <tbody>
                    {/* Abstract Specification Section */}
                    <tr>
                        <th colSpan={6}>
                            <a href="#abstract-specification">Abstract Specification</a>
                            {rootClm?.dimensions?.abstractSpecification && (
                                <small className="dimension-hash">Hash: {rootClm.dimensions.abstractSpecification.substring(0, 8)}...</small>
                            )}
                        </th>
                    </tr>
                    <tr>
                        <th colSpan={1}><a href="#context">Context</a></th>
                        <td colSpan={5} style={{ wordWrap: 'break-word' }}>
                            {formatContent(context)}
                        </td>
                    </tr>
                    <tr>
                        <th colSpan={1}><a href="#goal">Goal</a></th>
                        <td colSpan={5} style={{ wordWrap: 'break-word' }}>
                            {formatContent(goal)}
                        </td>
                    </tr>
                    <tr>
                        <th colSpan={1}><a href="#success-criteria">Success Criteria</a></th>
                        <td colSpan={5} style={{ wordWrap: 'break-word' }}>
                            {formatContent(successCriteria)}
                        </td>
                    </tr>
                    
                    {/* Concrete Implementation Section */}
                    <tr>
                        <th colSpan={6}>
                            <a href="#concrete-implementation">Concrete Implementation</a>
                            {rootClm?.dimensions?.concreteImplementation && (
                                <small className="dimension-hash">Hash: {rootClm.dimensions.concreteImplementation.substring(0, 8)}...</small>
                            )}
                        </th>
                    </tr>
                    <tr>
                        <th colSpan={2}><a href="#inputs">Inputs</a></th>
                        <th colSpan={2}><a href="#activities">Activities</a></th>
                        <th colSpan={2}><a href="#outputs">Outputs</a></th>
                    </tr>
                    <tr>
                        <td colSpan={2} style={{ wordWrap: 'break-word' }}>
                            {formatContent(inputs)}
                        </td>
                        <td colSpan={2} style={{ wordWrap: 'break-word' }}>
                            {formatContent(activities)}
                        </td>
                        <td colSpan={2} style={{ wordWrap: 'break-word' }}>
                            {formatContent(outputs)}
                        </td>
                    </tr>

                    {/* Balanced Expectations Section */}
                    <tr>
                        <th colSpan={6}>
                            <a href="#balanced-expectations">Balanced Expectations</a>
                            {rootClm?.dimensions?.balancedExpectations && (
                                <small className="dimension-hash">Hash: {rootClm.dimensions.balancedExpectations.substring(0, 8)}...</small>
                            )}
                        </th>
                    </tr>
                    <tr>
                        <th colSpan={2}><a href="#practical-boundaries">Practical Boundaries</a></th>
                        <td colSpan={4} style={{ wordWrap: 'break-word' }}>
                            {formatContent(practicalBoundaries)}
                        </td>
                    </tr>
                    <tr>
                        <th colSpan={2}><a href="#evaluation-metrics">Evaluation Metrics</a></th>
                        <td colSpan={4} style={{ wordWrap: 'break-word' }}>
                            {formatContent(evaluationMetrics)}
                        </td>
                    </tr>
                    <tr>
                        <th colSpan={2}><a href="#feedback-loops">Feedback Loops</a></th>
                        <td colSpan={4} style={{ wordWrap: 'break-word' }}>
                            {formatContent(feedbackLoops)}
                        </td>
                    </tr>
                </tbody>
            </table>
            
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
