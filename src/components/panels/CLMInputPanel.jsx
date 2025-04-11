import React, { useState, useEffect, useCallback } from 'react';
import SaveButton from './clm/SaveButton';
import AbstractSpecification from './clm/AbstractSpecification';
import ConcreteImplementation from './clm/ConcreteImplementation';

const CLMInputPanel = () => {
    // Title state
    const [documentTitle, setDocumentTitle] = useState('');

    // State structure following the three dimension MCards approach
    const [clmData, setClmData] = useState({
        // Abstract Specification dimension
        abstractSpecification: {
            context: '',
            goal: '',
            successCriteria: ''
        },
        // Concrete Implementation dimension
        concreteImplementation: {
            inputs: '',
            activities: '',
            outputs: ''
        }
    });
    
    // Track which dimension is currently active in the UI
    const [activeDimension, setActiveDimension] = useState('abstractSpecification');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);
    const [currentClmHash, setCurrentClmHash] = useState(null);
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Debounce function for auto-updates
    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    };

    // Auto-update a specific dimension - defined using useCallback to memoize
    const updateDimension = useCallback(async (dimension, content) => {
        if (!currentClmHash || !autoSaveEnabled) return;
        
        try {
            // Create dimension update payload following CLM_for_CLM_Mcard.md structure
            const dimensionUpdate = {
                parentHash: currentClmHash,
                dimension: dimension,
                type: 'clm_dimension_update',
                timestamp: new Date().toISOString(),
                // Include the dimension content with proper structure
                content: content  // This already has the correct dimensionType field from generateJsonData
            };

            console.log(`Starting update for ${dimension} dimension`);

            // Use the card-collection API with action=add to update the dimension
            const response = await fetch('/api/card-collection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'add',
                    card: {
                        content: dimensionUpdate
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error auto-updating CLM dimension:', {
                    dimension,
                    status: response.status,
                    error: errorText
                });
                return;
            }

            const result = await response.json();
            if (result.success) {
                setCurrentClmHash(result.hash);
                setLastUpdated(new Date().toISOString());
                console.log(`${dimension} auto-updated successfully with hash: ${result.hash.substring(0, 10)}...`);
            } else {
                console.error('Failed to auto-update:', result.error);
            }
        } catch (error) {
            console.error('Error in auto-update:', error);
        }
    }, [currentClmHash, autoSaveEnabled]);

    // Create debounced function outside of useCallback to avoid circular dependencies
    const debouncedUpdateFn = debounce((updateFn, dimension, content) => {
        console.log(`Debounced update for ${dimension} dimension triggered`);
        updateFn(dimension, content);
    }, 2000);
    
    // Handle input changes for all dimensions
    const handleInputChange = (dimension, section, field, value) => {
        console.log(`CLMInputPanel handleInputChange called:`, {
            dimension, section, field, value
        });

        // If field is undefined but value is, then we're receiving params in a different order
        // This happens when dimension components call handleInputChange(dimension, null, key, value)
        if (value === undefined && field !== undefined) {
            // Rearrange parameters to account for dimension components' call pattern
            value = field;
            field = section;
            section = null;
        }

        console.log(`After parameter normalization:`, {
            dimension, section, field, value
        });

        // Update local state first
        if (section) {
            // This handles nested structures (legacy format)
            setClmData(prevState => {
                console.log("Updating with section:", { dimension, section, field, value });
                return {
                    ...prevState,
                    [dimension]: {
                        ...prevState[dimension],
                        [section]: {
                            ...prevState[dimension][section],
                            [field]: value
                        }
                    }
                };
            });
        } else {
            // This handles direct field updates from dimension components
            setClmData(prevState => {
                console.log("Updating directly:", { dimension, field, value });
                return {
                    ...prevState,
                    [dimension]: {
                        ...prevState[dimension],
                        [field]: value
                    }
                };
            });
        }

        // Trigger auto-save if enabled, but don't block input
        if (autoSaveEnabled && currentClmHash) {
            // Use a setTimeout to avoid blocking the UI thread during state updates
            setTimeout(() => {
                const jsonData = generateJsonData(dimension);
                debouncedUpdateFn(updateDimension, dimension, jsonData);
            }, 0);
        }
    };

    // Utility function to generate JSON data with optional custom data
    const generateJsonData = (dimension, data = clmData) => {
        switch(dimension) {
            case 'abstractSpecification':
                return {
                    dimensionType: "abstractSpecification",
                    context: data.abstractSpecification.context,
                    goal: data.abstractSpecification.goal,
                    successCriteria: data.abstractSpecification.successCriteria
                };
            
            case 'concreteImplementation':
                return {
                    dimensionType: "concreteImplementation",
                    inputs: data.concreteImplementation.inputs,
                    activities: data.concreteImplementation.activities,
                    outputs: data.concreteImplementation.outputs
                };
            
            default:
                return {};
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveMessage(null);

        // Validate title
        if (!documentTitle.trim()) {
            setSaveMessage({ type: 'error', text: 'Please enter a document title' });
            setIsSaving(false);
            return;
        }

        try {
            // Step 1: Generate JSON-formatted content for each dimension MCard
            const abstractSpecificationJson = generateJsonData('abstractSpecification');
            const concreteImplementationJson = generateJsonData('concreteImplementation');
            
            // Step 2: Store each dimension as its own MCard to get hash references
            // First, save Abstract Specification dimension
            console.log("Saving Abstract Specification dimension...");
            const abstractSpecResponse = await fetch('/api/card-collection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'add',
                    card: {
                        content: abstractSpecificationJson
                    }
                })
            });
            
            if (!abstractSpecResponse.ok) {
                throw new Error(`Failed to save Abstract Specification: ${abstractSpecResponse.status}`);
            }
            const abstractSpecResult = await abstractSpecResponse.json();
            const abstractSpecHash = abstractSpecResult.hash;
            
            // Next, save Concrete Implementation dimension
            console.log("Saving Concrete Implementation dimension...");
            const concreteImplResponse = await fetch('/api/card-collection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'add',
                    card: {
                        content: concreteImplementationJson
                    }
                })
            });
            
            if (!concreteImplResponse.ok) {
                throw new Error(`Failed to save Concrete Implementation: ${concreteImplResponse.status}`);
            }
            const concreteImplResult = await concreteImplResponse.json();
            const concreteImplHash = concreteImplResult.hash;

            // Step 3: Create the root CLM MCard with references to the dimension hashes
            console.log("Creating root CLM with dimension hash references...");
            const rootClmJson = {
                title: documentTitle,
                type: 'clm_document',
                // Reference only Abstract Specification and Concrete Implementation dimensions by hash
                dimensions: {
                    abstractSpecification: abstractSpecHash,
                    concreteImplementation: concreteImplHash
                }
            };

            // Step 4: Store the root CLM MCard
            console.log("Saving root CLM...");
            const rootClmResponse = await fetch('/api/card-collection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'add',
                    card: {
                        content: rootClmJson
                    }
                })
            });

            // Improved error handling to diagnose issues
            if (!rootClmResponse.ok) {
                const errorText = await rootClmResponse.text();
                console.error('Server response error:', {
                    status: rootClmResponse.status,
                    statusText: rootClmResponse.statusText,
                    responseText: errorText
                });
                
                let errorMessage;
                try {
                    // Try to parse the error as JSON
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || 'Failed to save CLM data';
                } catch (e) {
                    // If it's not valid JSON (like HTML), provide a more helpful error
                    errorMessage = `Server error (${rootClmResponse.status}): The API endpoint may not exist or returned HTML instead of JSON`;
                }
                
                throw new Error(errorMessage);
            }

            const result = await rootClmResponse.json();
            
            if (result.success) {
                // Store the CLM hash for future updates
                const clmHash = result.hash;
                setCurrentClmHash(clmHash);
                
                setLastUpdated(new Date().toISOString());
                
                setSaveMessage({ 
                    type: 'success', 
                    text: `CLM data saved successfully! Hash: ${clmHash.substring(0, 10)}...` 
                });
            } else {
                throw new Error(result.error || 'Failed to save CLM data');
            }
            
        } catch (error) {
            console.error('Error saving CLM data:', error);
            console.log('Detailed error data:', {
                title: documentTitle,
                abstractSpecification: generateJsonData('abstractSpecification'),
                concreteImplementation: generateJsonData('concreteImplementation')
            });
            setSaveMessage({ 
                type: 'error', 
                text: `Failed to save CLM data: ${error.message || 'Unknown error'}` 
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Toggle auto-save feature
    const toggleAutoSave = () => {
        setAutoSaveEnabled(prev => !prev);
    };

    // Utility function to generate SHA-256 hash (implementation that works in both browser and Node.js)
    async function generateHash(content) {
        // Cross-environment compatible TextEncoder
        const getTextEncoder = () => {
            // Browser environment
            if (typeof window !== 'undefined' && window.TextEncoder) {
                return new window.TextEncoder();
            }
            
            // Node.js environment
            if (typeof TextEncoder !== 'undefined') {
                return new TextEncoder();
            }
            
            // Fallback implementation for environments without TextEncoder
            return {
                encode: (str) => {
                    const utf8 = [];
                    for (let i = 0; i < str.length; i++) {
                        let charcode = str.charCodeAt(i);
                        if (charcode < 0x80) utf8.push(charcode);
                        else if (charcode < 0x800) {
                            utf8.push(0xc0 | (charcode >> 6), 
                                      0x80 | (charcode & 0x3f));
                        }
                        else if (charcode < 0xd800 || charcode >= 0xe000) {
                            utf8.push(0xe0 | (charcode >> 12), 
                                      0x80 | ((charcode>>6) & 0x3f), 
                                      0x80 | (charcode & 0x3f));
                        }
                        else {
                            i++;
                            charcode = 0x10000 + (((charcode & 0x3ff) << 10)
                                      | (str.charCodeAt(i) & 0x3ff));
                            utf8.push(0xf0 | (charcode >>18), 
                                      0x80 | ((charcode>>12) & 0x3f), 
                                      0x80 | ((charcode>>6) & 0x3f), 
                                      0x80 | (charcode & 0x3f));
                        }
                    }
                    return new Uint8Array(utf8);
                }
            };
        };

        const encoder = getTextEncoder();
        const data = encoder.encode(content);
        
        // Use the appropriate crypto API based on environment
        let hashBuffer;
        
        if (typeof window !== 'undefined' && window.crypto) {
            // Browser environment
            hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        } else if (typeof crypto !== 'undefined') {
            // Node.js environment or modern browser
            hashBuffer = await crypto.subtle.digest('SHA-256', data);
        } else {
            // Fallback - in real implementation would use a JS-based SHA-256
            throw new Error('Crypto API not available');
        }
        
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return 'sha256:' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Render appropriate content based on active dimension
    const renderDimensionContent = () => {
        switch(activeDimension) {
            case 'abstractSpecification':
                return (
                    <AbstractSpecification 
                        data={clmData.abstractSpecification}
                        onChange={handleInputChange}
                        generateJsonData={generateJsonData}
                    />
                );
            case 'concreteImplementation':
                return (
                    <ConcreteImplementation 
                        data={clmData.concreteImplementation}
                        onChange={handleInputChange}
                        generateJsonData={generateJsonData}
                    />
                );
            default:
                return null;
        }
    };

    useEffect(() => {
        // Make sure this function is updated when dependencies change
    }, [updateDimension]);

    return (
        <div className="h-full bg-white overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header with Navigation and Save Button */}
                <div className="flex flex-col md:flex-row justify-between items-center border-b pb-4">
                    <div className="tabs w-full md:w-auto mb-4 md:mb-0">
                        <button 
                            className={`px-4 py-2 rounded-md mr-2 ${activeDimension === 'abstractSpecification' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                            onClick={() => setActiveDimension('abstractSpecification')}
                        >
                            Abstract Specification
                        </button>
                        <button 
                            className={`px-4 py-2 rounded-md ${activeDimension === 'concreteImplementation' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                            onClick={() => setActiveDimension('concreteImplementation')}
                        >
                            Concrete Implementation
                        </button>
                    </div>
                    <SaveButton 
                        onSave={handleSubmit} 
                        isSaving={isSaving} 
                    />
                </div>

                {/* Save Message */}
                {saveMessage && (
                    <div className={`p-3 rounded text-sm text-center ${
                        saveMessage.type === 'success' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                    }`}>
                        {saveMessage.text}
                    </div>
                )}

                {/* Auto-save Status */}
                {currentClmHash && (
                    <div className="flex justify-between items-center mb-4 text-sm">
                        <div className="flex items-center">
                            <span className="text-gray-600 mr-2">Auto-save:</span>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                <input 
                                    type="checkbox" 
                                    name="toggle" 
                                    id="auto-save-toggle" 
                                    checked={autoSaveEnabled}
                                    onChange={toggleAutoSave}
                                    className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer focus:outline-none transition-transform duration-200 ease-in"
                                    style={{
                                        transform: autoSaveEnabled ? 'translateX(100%)' : 'translateX(0)',
                                        borderColor: autoSaveEnabled ? '#48BB78' : '#F56565'
                                    }}
                                />
                                <label 
                                    htmlFor="auto-save-toggle" 
                                    className="block overflow-hidden h-6 rounded-full cursor-pointer"
                                    style={{ backgroundColor: autoSaveEnabled ? '#9AE6B4' : '#FED7D7' }}
                                ></label>
                            </div>
                            <span className={autoSaveEnabled ? 'text-green-600' : 'text-red-600'}>
                                {autoSaveEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        {lastUpdated && (
                            <div className="text-gray-600">
                                Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                )}

                {/* Title Input Field */}
                <div className="mb-6">
                    <label className="block text-lg font-semibold text-gray-700 mb-2" htmlFor="title">Cubical Logic Model Title</label>
                    <input 
                        id="title" 
                        type="text" 
                        value={documentTitle} 
                        onChange={(e) => setDocumentTitle(e.target.value)} 
                        placeholder="Enter a title for your CLM document..."
                        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-base"
                    />
                </div>

                {/* Active Dimension Content */}
                {renderDimensionContent()}
            </div>
        </div>
    );
};

export default CLMInputPanel;
