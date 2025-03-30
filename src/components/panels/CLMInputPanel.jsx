import React, { useState, useEffect, useCallback } from 'react';
import DimensionNavigation from './clm/DimensionNavigation';
import SaveButton from './clm/SaveButton';
import AbstractSpecification from './clm/AbstractSpecification';
import ConcreteImplementation from './clm/ConcreteImplementation';
import BalancedExpectations from './clm/BalancedExpectations';
import CubicalLogicModel from './clm/CubicalLogicModel';

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
        },
        // Balanced Expectations dimension
        balancedExpectations: {
            practicalBoundaries: '',
            evaluationMetrics: '',
            feedbackLoops: ''
        },
        // Cubical Logic Model dimension
        cubicalLogicModel: {
            abstractSpecification: {
                context: '',
                goal: '',
                successCriteria: ''
            },
            concreteImplementation: {
                inputs: '',
                activities: '',
                outputs: ''
            },
            balancedExpectations: {
                practicalBoundaries: '',
                evaluationMetrics: '',
                feedbackLoops: ''
            }
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

    // Auto-update a specific dimension
    const updateDimension = async (dimension, content) => {
        if (!currentClmHash || !autoSaveEnabled) return;
        
        try {
            const response = await fetch('/api/update-clm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    clmHash: currentClmHash,
                    dimension,
                    content
                })
            });

            if (!response.ok) {
                console.error('Error auto-updating CLM dimension:', dimension);
                return;
            }

            const result = await response.json();
            setCurrentClmHash(result.newClmHash);
            setLastUpdated(new Date().toISOString());
            console.log(`${dimension} auto-updated successfully with hash: ${result.dimensionHash.substring(0, 10)}...`);
        } catch (error) {
            console.error('Error in auto-update:', error);
        }
    };

    // Debounced update function
    const debouncedUpdate = useCallback(
        debounce((dimension, content) => {
            updateDimension(dimension, content);
        }, 2000),
        [currentClmHash, autoSaveEnabled]
    );

    // Handle input changes for all dimensions
    const handleInputChange = (dimension, section, field, value) => {
        if (dimension === 'cubicalLogicModel') {
            // Handle nested structure for Cubical Logic Model
            setClmData(prevState => ({
                ...prevState,
                [dimension]: {
                    ...prevState[dimension],
                    [section]: {
                        ...prevState[dimension][section],
                        [field]: value
                    }
                }
            }));
        } else {
            // Handle flat structure for other dimensions
            setClmData(prevState => ({
                ...prevState,
                [dimension]: {
                    ...prevState[dimension],
                    [field]: value
                }
            }));
        }

        // Trigger auto-save if enabled
        if (autoSaveEnabled && currentClmHash) {
            debouncedUpdate(dimension, generateJsonData(dimension));
        }
    };

    // Utility function to generate JSON data with optional custom data
    const generateJsonData = (dimension, data = clmData) => {
        switch(dimension) {
            case 'abstractSpecification':
                return {
                    dimension_type: "abstract_specification",
                    context: data.abstractSpecification.context,
                    goal: data.abstractSpecification.goal,
                    success_criteria: data.abstractSpecification.successCriteria
                };
            
            case 'concreteImplementation':
                return {
                    dimension_type: "concrete_implementation",
                    inputs: data.concreteImplementation.inputs,
                    activities: data.concreteImplementation.activities,
                    outputs: data.concreteImplementation.outputs
                };
            
            case 'balancedExpectations':
                return {
                    dimension_type: "balanced_expectations",
                    practical_boundaries: data.balancedExpectations.practicalBoundaries,
                    evaluation_metrics: data.balancedExpectations.evaluationMetrics,
                    feedback_loops: data.balancedExpectations.feedbackLoops
                };
            
            case 'cubicalLogicModel':
                return {
                    dimension_type: "cubical_logic_model",
                    abstract_specification: {
                        context: data.cubicalLogicModel.abstractSpecification.context,
                        goal: data.cubicalLogicModel.abstractSpecification.goal,
                        success_criteria: data.cubicalLogicModel.abstractSpecification.successCriteria
                    },
                    concrete_implementation: {
                        inputs: data.cubicalLogicModel.concreteImplementation.inputs,
                        activities: data.cubicalLogicModel.concreteImplementation.activities,
                        outputs: data.cubicalLogicModel.concreteImplementation.outputs
                    },
                    balanced_expectations: {
                        practical_boundaries: data.cubicalLogicModel.balancedExpectations.practicalBoundaries,
                        evaluation_metrics: data.cubicalLogicModel.balancedExpectations.evaluationMetrics,
                        feedback_loops: data.cubicalLogicModel.balancedExpectations.feedbackLoops
                    }
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
            // Generate JSON-formatted content for each dimension MCard
            const abstractSpecificationJson = generateJsonData('abstractSpecification');
            const concreteImplementationJson = generateJsonData('concreteImplementation');
            const balancedExpectationsJson = generateJsonData('balancedExpectations');
            const cubicalLogicModelJson = generateJsonData('cubicalLogicModel');

            // Prepare the root CLM MCard JSON
            const rootClmJson = {
                title: documentTitle,
                content: {
                    dimensions: {
                        abstract_specification: abstractSpecificationJson,
                        concrete_implementation: concreteImplementationJson,
                        balanced_expectations: balancedExpectationsJson
                    }
                }
            };

            // Store in database using the new store-clm endpoint
            const response = await fetch('/api/store-clm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: documentTitle,
                    content: rootClmJson
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save CLM data');
            }

            const result = await response.json();
            // Store the CLM hash for future updates
            setCurrentClmHash(result.clmHash);
            setLastUpdated(new Date().toISOString());
            
            setSaveMessage({ 
                type: 'success', 
                text: `CLM data saved successfully! Hash: ${result.clmHash.substring(0, 10)}...` 
            });
            
        } catch (error) {
            console.error('Error saving CLM data:', error);
            console.log('Detailed error data:', {
                title: documentTitle,
                abstractSpecification: generateJsonData('abstractSpecification'),
                concreteImplementation: generateJsonData('concreteImplementation'),
                balancedExpectations: generateJsonData('balancedExpectations')
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
            case 'balancedExpectations':
                return (
                    <BalancedExpectations 
                        data={clmData.balancedExpectations}
                        onChange={handleInputChange}
                        generateJsonData={generateJsonData}
                    />
                );
            case 'cubicalLogicModel':
                return (
                    <CubicalLogicModel 
                        data={clmData.cubicalLogicModel}
                        onChange={handleInputChange}
                        generateJsonData={generateJsonData}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="h-full bg-white overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header with Navigation and Save Button */}
                <div className="flex justify-between items-center border-b pb-4">
                    <div className="tabs">
                        <button 
                            className={activeDimension === 'abstractSpecification' ? 'active' : ''} 
                            onClick={() => setActiveDimension('abstractSpecification')}
                        >
                            Abstract Specification
                        </button>
                        <button 
                            className={activeDimension === 'concreteImplementation' ? 'active' : ''} 
                            onClick={() => setActiveDimension('concreteImplementation')}
                        >
                            Concrete Implementation
                        </button>
                        <button 
                            className={activeDimension === 'balancedExpectations' ? 'active' : ''} 
                            onClick={() => setActiveDimension('balancedExpectations')}
                        >
                            Balanced Expectations
                        </button>
                        <button 
                            className={activeDimension === 'cubicalLogicModel' ? 'active' : ''} 
                            onClick={() => setActiveDimension('cubicalLogicModel')}
                        >
                            Cubical Logic Model
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
