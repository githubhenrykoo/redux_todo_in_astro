'use client';

import { useState, useEffect, useMemo, createContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../../styles/clm-display.css';
import AbstractSpecification from '../clm/AbstractSpecification';
import ConcreteImplementation from '../clm/ConcreteImplementation';
import BalancedExpectations from '../clm/BalancedExpectations';
import PythonREPLPanel from './PythonREPLPanel';

// Create a context to share the hideExecuteButtons state
export const CLMContext = createContext({ hideExecuteButtons: false });

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
    
    const dispatch = useDispatch();
    
    // Use Redux selectors to get the selected hash and cards
    const selectedHash = useSelector(state => state?.content?.selectedHash || initialHash);
    const cards = useSelector(state => state?.content?.cards || {});
    
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
    
    // Handle execution of the CLM
    const handleExecuteCLM = () => {
        console.log('Executing CLM:', rootClmMemo?.title);
        
        // First, dispatch action to clear the REPL output
        dispatch({
            type: 'pythonrepl/clearREPL'
        });
        
        // Add header showing which CLM is being executed
        dispatch({
            type: 'pythonrepl/addOutput',
            payload: {
                output: `====== EXECUTING CLM: ${rootClmMemo.title || 'Untitled CLM'} ======\n`
            }
        });

        // Find all Python files referenced in the CLM
        let pythonFiles = [];
        
        // Direct debug output to see what we're working with
        console.log('Dimensions data:', dimensions);
        
        // Check the concrete implementation for linked files
        if (dimensions.concreteImplementation) {
            console.log('Found concrete implementation:', dimensions.concreteImplementation);
            
            // Check inputs section
            if (dimensions.concreteImplementation.inputs) {
                console.log('Processing inputs:', dimensions.concreteImplementation.inputs);
                const inputFiles = extractLinkedFiles(dimensions.concreteImplementation.inputs);
                console.log('Found input files:', inputFiles);
                pythonFiles = [...pythonFiles, ...inputFiles];
            }
            
            // Check activities section
            if (dimensions.concreteImplementation.activities) {
                console.log('Processing activities:', dimensions.concreteImplementation.activities);
                const activityFiles = extractLinkedFiles(dimensions.concreteImplementation.activities);
                console.log('Found activity files:', activityFiles);
                pythonFiles = [...pythonFiles, ...activityFiles];
            }
        }
        
        // If no files found, check for linkedFiles directly in the root CLM
        if (pythonFiles.length === 0 && rootClmMemo.linkedFiles) {
            console.log('Checking root CLM for linkedFiles:', rootClmMemo.linkedFiles);
            if (Array.isArray(rootClmMemo.linkedFiles)) {
                pythonFiles = rootClmMemo.linkedFiles;
            } else if (typeof rootClmMemo.linkedFiles === 'string') {
                pythonFiles = [rootClmMemo.linkedFiles];
            }
        }
        
        console.log('Total Python files found:', pythonFiles.length, pythonFiles);
        
        if (pythonFiles.length > 0) {
            // Execute each file in sequence
            pythonFiles.forEach((fileHash, index) => {
                if (index > 0) {
                    // Add separator between files
                    dispatch({
                        type: 'pythonrepl/addOutput',
                        payload: {
                            output: "\n----- Next Python File -----\n"
                        }
                    });
                }
                
                // Clean up the file hash
                const cleanHash = fileHash.trim();
                console.log(`Executing file ${index + 1}:`, cleanHash);
                
                // Attempt to get the file from Redux cache
                const pythonFile = cards[cleanHash];
                if (pythonFile && pythonFile.content) {
                    console.log('Found file in Redux cache:', pythonFile);
                    
                    // Convert content to string if needed
                    let scriptContent = '';
                    if (typeof pythonFile.content === 'string') {
                        scriptContent = pythonFile.content;
                    } else if (pythonFile.content && pythonFile.content.type === 'Buffer') {
                        // Handle Buffer JSON format
                        const buffer = new Uint8Array(pythonFile.content.data);
                        scriptContent = new TextDecoder().decode(buffer);
                    } else if (pythonFile.content instanceof Uint8Array) {
                        scriptContent = new TextDecoder().decode(pythonFile.content);
                    }
                    
                    // Execute the script
                    dispatch({
                        type: 'pythonrepl/executeScript',
                        payload: {
                            content: scriptContent,
                            hash: cleanHash,
                            filename: pythonFile.metadata?.filename || `File ${index + 1}`
                        }
                    });
                } else {
                    // File not in cache, tell user we need to fetch it
                    console.log('File not found in cache:', cleanHash);
                    dispatch({
                        type: 'pythonrepl/addOutput',
                        payload: {
                            output: `Attempting to fetch file ${cleanHash.substring(0, 16)}... from database`
                        }
                    });
                    
                    // Fetch the file content
                    fetchAndExecuteFile(cleanHash, index);
                }
            });
        } else {
            // No Python files found
            console.log('No Python files found in the CLM');
            dispatch({
                type: 'pythonrepl/addOutput',
                payload: {
                    output: "No Python files found in this CLM"
                }
            });
        }
    };
    
    // Async function to fetch and execute a file
    const fetchAndExecuteFile = async (fileHash, index) => {
        try {
            // Fetch the file
            const response = await fetch(`/api/card-collection?action=get&hash=${fileHash}`);
            
            if (!response.ok) {
                throw new Error(`API returned ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Fetched file:', data);
            
            if (data.card && data.card.content) {
                // Cache the card in Redux
                dispatch({
                    type: 'content/addCard',
                    payload: {
                        hash: fileHash,
                        card: data.card
                    }
                });
                
                // Convert content to string if needed
                let scriptContent = '';
                if (typeof data.card.content === 'string') {
                    scriptContent = data.card.content;
                } else if (data.card.content && data.card.content.type === 'Buffer') {
                    // Handle Buffer JSON format
                    const buffer = new Uint8Array(data.card.content.data);
                    scriptContent = new TextDecoder().decode(buffer);
                } else if (data.card.content instanceof Uint8Array) {
                    scriptContent = new TextDecoder().decode(data.card.content);
                }
                
                // Execute the script
                dispatch({
                    type: 'pythonrepl/executeScript',
                    payload: {
                        content: scriptContent,
                        hash: fileHash,
                        filename: data.card.metadata?.filename || `File ${index + 1}`
                    }
                });
            } else {
                throw new Error('File content not found in API response');
            }
        } catch (error) {
            console.error('Error fetching file:', error);
            dispatch({
                type: 'pythonrepl/addOutput',
                payload: {
                    output: `Error fetching file: ${error.message}`
                }
            });
        }
    };
    
    // Helper function to extract linked files from content
    const extractLinkedFiles = (content) => {
        const files = [];
        
        // No content
        if (!content) return files;
        
        console.log('Extracting linked files from:', content, 'Type:', typeof content);
        
        // Check if content is a string with linkedFiles marker
        if (typeof content === 'string') {
            // Check for "linkedFiles:" format
            if (content.includes('linkedFiles:')) {
                const parts = content.split('linkedFiles:');
                if (parts.length > 1) {
                    const fileLines = parts[1].trim().split('\n');
                    fileLines.forEach(line => {
                        const trimmedLine = line.trim();
                        if (trimmedLine) {
                            files.push(trimmedLine);
                        }
                    });
                }
            } 
            // Check if the string itself is a file hash (common pattern)
            else if (content.match(/^[0-9a-f]{16,64}$/i)) {
                files.push(content);
            }
        }
        
        // Check if content is an object with linkedFiles property
        else if (typeof content === 'object' && content !== null) {
            // Direct linkedFiles property
            if (content.linkedFiles) {
                if (Array.isArray(content.linkedFiles)) {
                    content.linkedFiles.forEach(hash => {
                        if (hash && hash.trim()) {
                            files.push(hash.trim());
                        }
                    });
                } else if (typeof content.linkedFiles === 'string') {
                    files.push(content.linkedFiles.trim());
                }
            }
            
            // Handle case where content itself is a file hash object
            else if (content.hash && typeof content.hash === 'string') {
                files.push(content.hash.trim());
            }
        }
        
        return files;
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
        <div className="clm-display-panel">
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
            
            {loading ? (
                <div className="loading">Loading...</div>
            ) : (
                <div className="clm-dimensions">
                    {/* Abstract Specification Section */}
                    <div className="dimension abstract-specification">
                        <h2 className="text-lg font-semibold mb-4">Abstract Specification</h2>
                        {dimensions.abstractSpecification ? (
                            <div className="grid grid-cols-1 gap-4">
                                <div className="col-span-1">
                                    <div className="bg-card rounded-lg p-4">
                                        <h3 className="text-primary font-medium mb-2">Context</h3>
                                        <div className="text-card-foreground">
                                            {dimensions.abstractSpecification.context || 'No context specified'}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-1">
                                    <div className="bg-card rounded-lg p-4">
                                        <h3 className="text-primary font-medium mb-2">Goal</h3>
                                        <div className="text-card-foreground">
                                            {dimensions.abstractSpecification.goal || 'No goal specified'}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-1">
                                    <div className="bg-card rounded-lg p-4">
                                        <h3 className="text-primary font-medium mb-2">Success Criteria</h3>
                                        <div className="text-card-foreground">
                                            {dimensions.abstractSpecification.successCriteria || 'No success criteria specified'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="no-dimension">
                                No Abstract Specification available
                            </div>
                        )}
                    </div>

                    {/* Concrete Implementation Section */}
                    <ConcreteImplementation 
                        inputs={inputs}
                        activities={activities}
                        outputs={outputs}
                        cards={cards}
                    />
                </div>
            )}
        </div>
    );
};

export default CLMDisplayPanel;
