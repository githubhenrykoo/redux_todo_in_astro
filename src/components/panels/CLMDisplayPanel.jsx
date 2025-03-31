import React, { useState, useEffect } from 'react';
import '../../styles/clm-display.css';

// Make parameters optional and accept proper types
const CLMDisplayPanel = ({ clmHash = null, initialHash = '' }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rootClm, setRootClm] = useState(null);
    const [dimensions, setDimensions] = useState({
        abstractSpecification: null,
        concreteImplementation: null,
        balancedExpectations: null
    });

    // If clmHash is not provided as a prop, try to get it from initialHash or URL
    useEffect(() => {
        const hashToUse = clmHash || initialHash;
        
        if (!hashToUse && typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const hashFromUrl = urlParams.get('hash');
            if (hashFromUrl) {
                console.log(`Getting CLM hash from URL: ${hashFromUrl}`);
                loadClmData(hashFromUrl);
            } else {
                setError("No CLM hash provided");
                setLoading(false);
            }
        } else if (hashToUse) {
            loadClmData(hashToUse);
        } else {
            setError("No CLM hash provided and not running in browser");
            setLoading(false);
        }
    }, [clmHash, initialHash]);

    // Main function to load CLM data
    const loadClmData = async (hash) => {
        try {
            setLoading(true);
            setError(null);
            
            console.log(`Fetching root CLM with hash: ${hash}`);
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
                throw new Error(`Failed to fetch CLM: ${response.status}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to retrieve CLM data');
            }

            console.log('Root CLM received:', result.card);
            setRootClm(result.card.content);
            
            // Now fetch each dimension by its hash
            await fetchDimensions(result.card.content.dimensions);
        } catch (error) {
            console.error('Error fetching CLM:', error);
            setError(`Error loading CLM: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Fetch each dimension by hash
    const fetchDimensions = async (dimensionHashes) => {
        try {
            // Fetch abstract specification
            if (dimensionHashes.abstractSpecification) {
                console.log(`Fetching Abstract Specification with hash: ${dimensionHashes.abstractSpecification}`);
                const abstractSpec = await fetchDimension(dimensionHashes.abstractSpecification);
                setDimensions(prev => ({ ...prev, abstractSpecification: abstractSpec }));
            }

            // Fetch concrete implementation
            if (dimensionHashes.concreteImplementation) {
                console.log(`Fetching Concrete Implementation with hash: ${dimensionHashes.concreteImplementation}`);
                const concreteImpl = await fetchDimension(dimensionHashes.concreteImplementation);
                setDimensions(prev => ({ ...prev, concreteImplementation: concreteImpl }));
            }

            // Fetch balanced expectations
            if (dimensionHashes.balancedExpectations) {
                console.log(`Fetching Balanced Expectations with hash: ${dimensionHashes.balancedExpectations}`);
                const balancedExp = await fetchDimension(dimensionHashes.balancedExpectations);
                setDimensions(prev => ({ ...prev, balancedExpectations: balancedExp }));
            }
        } catch (error) {
            console.error('Error fetching dimensions:', error);
            setError(`Error loading dimension data: ${error.message}`);
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

    if (loading) {
        return <div className="clm-display-loading">Loading CLM data...</div>;
    }

    if (error) {
        return <div className="clm-display-error">{error}</div>;
    }

    if (!rootClm || !dimensions.abstractSpecification || !dimensions.concreteImplementation || !dimensions.balancedExpectations) {
        return <div className="clm-display-error">Unable to load complete CLM data</div>;
    }

    // Extract the abstract specification dimension data
    const { context, goal, successCriteria } = dimensions.abstractSpecification;
    
    // Extract the concrete implementation dimension data
    const { inputs, activities, outputs } = dimensions.concreteImplementation;
    
    // Extract the balanced expectations dimension data
    const { practicalBoundaries, evaluationMetrics, feedbackLoops } = dimensions.balancedExpectations;

    return (
        <div className="clm-display-panel">
            <h2 className="clm-title">{rootClm.title || 'Cubical Logic Model'}</h2>
            
            <div className="clm-metadata">
                <p><strong>Created:</strong> {new Date(rootClm.createdAt).toLocaleString()}</p>
                <p><strong>CLM Hash:</strong> <code>{clmHash.substring(0, 10)}...</code></p>
            </div>
            
            <table className="clm-table">
                <tbody>
                    {/* Abstract Specification Section */}
                    <tr>
                        <th colSpan={6}>
                            <a href="#abstract-specification">Abstract Specification</a>
                            <small className="dimension-hash">Hash: {rootClm.dimensions.abstractSpecification.substring(0, 8)}...</small>
                        </th>
                    </tr>
                    <tr>
                        <th colSpan={1}><a href="#context">Context</a></th>
                        <td colSpan={5} style={{ wordWrap: 'break-word' }}>
                            {context}
                        </td>
                    </tr>
                    <tr>
                        <th colSpan={1}><a href="#goal">Goal</a></th>
                        <td colSpan={5} style={{ wordWrap: 'break-word' }}>
                            {goal}
                        </td>
                    </tr>
                    <tr>
                        <th colSpan={1}><a href="#success-criteria">Success Criteria</a></th>
                        <td colSpan={5} style={{ wordWrap: 'break-word' }}>
                            {successCriteria}
                        </td>
                    </tr>
                    
                    {/* Concrete Implementation Section */}
                    <tr>
                        <th colSpan={6}>
                            <a href="#concrete-implementation">Concrete Implementation</a>
                            <small className="dimension-hash">Hash: {rootClm.dimensions.concreteImplementation.substring(0, 8)}...</small>
                        </th>
                    </tr>
                    <tr>
                        <th colSpan={2}><a href="#inputs">Inputs</a></th>
                        <th colSpan={2}><a href="#activities">Activities</a></th>
                        <th colSpan={2}><a href="#outputs">Outputs</a></th>
                    </tr>
                    <tr>
                        <td colSpan={2} style={{ wordWrap: 'break-word' }}>
                            {inputs}
                        </td>
                        <td colSpan={2} style={{ wordWrap: 'break-word' }}>
                            {activities}
                        </td>
                        <td colSpan={2} style={{ wordWrap: 'break-word' }}>
                            {outputs}
                        </td>
                    </tr>

                    {/* Balanced Expectations Section */}
                    <tr>
                        <th colSpan={6}>
                            <a href="#balanced-expectations">Balanced Expectations</a>
                            <small className="dimension-hash">Hash: {rootClm.dimensions.balancedExpectations.substring(0, 8)}...</small>
                        </th>
                    </tr>
                    <tr>
                        <th colSpan={2}><a href="#practical-boundaries">Practical Boundaries</a></th>
                        <td colSpan={4} style={{ wordWrap: 'break-word' }}>
                            {practicalBoundaries}
                        </td>
                    </tr>
                    <tr>
                        <th colSpan={2}><a href="#evaluation-metrics">Evaluation Metrics</a></th>
                        <td colSpan={4} style={{ wordWrap: 'break-word' }}>
                            {evaluationMetrics}
                        </td>
                    </tr>
                    <tr>
                        <th colSpan={2}><a href="#feedback-loops">Feedback Loops</a></th>
                        <td colSpan={4} style={{ wordWrap: 'break-word' }}>
                            {feedbackLoops}
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <div className="clm-dimension-hashes">
                <h3>Dimension Hash References</h3>
                <ul>
                    <li><strong>Abstract Specification:</strong> <code>{rootClm.dimensions.abstractSpecification}</code></li>
                    <li><strong>Concrete Implementation:</strong> <code>{rootClm.dimensions.concreteImplementation}</code></li>
                    <li><strong>Balanced Expectations:</strong> <code>{rootClm.dimensions.balancedExpectations}</code></li>
                </ul>
            </div>
        </div>
    );
};

export default CLMDisplayPanel;
