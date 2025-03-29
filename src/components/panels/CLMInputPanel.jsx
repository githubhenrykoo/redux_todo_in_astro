import React, { useState } from 'react';
import DimensionNavigation from './clm/DimensionNavigation';
import SaveButton from './clm/SaveButton';
import AbstractSpecification from './clm/AbstractSpecification';
import ConcreteImplementation from './clm/ConcreteImplementation';
import BalancedExpectations from './clm/BalancedExpectations';

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
        }
    });
    
    // Track which dimension is currently active in the UI
    const [activeDimension, setActiveDimension] = useState('abstractSpecification');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);

    // Handle input changes
    const handleInputChange = (dimension, section, value) => {
        setClmData(prev => ({
            ...prev,
            [dimension]: {
                ...prev[dimension],
                [section]: value
            }
        }));
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
            // Generate YAML-formatted content for each dimension MCard
            const abstractSpecificationYaml = generateYamlPreview('abstractSpecification');
            const concreteImplementationYaml = generateYamlPreview('concreteImplementation');
            const balancedExpectationsYaml = generateYamlPreview('balancedExpectations');

            // Prepare the root CLM MCard YAML
            const rootClmYaml = `title: "${documentTitle.replace(/"/g, '\\"')}"
created: "${new Date().toISOString()}"
dimensions:
  abstract_specification: "${await generateHash(abstractSpecificationYaml)}"
  concrete_implementation: "${await generateHash(concreteImplementationYaml)}"
  balanced_expectations: "${await generateHash(balancedExpectationsYaml)}"`;

            // Store in database
            const response = await fetch('/api/store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: documentTitle,
                    content: {
                        rootClm: rootClmYaml,
                        dimensions: {
                            abstractSpecification: abstractSpecificationYaml,
                            concreteImplementation: concreteImplementationYaml,
                            balancedExpectations: balancedExpectationsYaml
                        }
                    },
                    timestamp: new Date().toISOString(),
                    format: 'clm'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save CLM data');
            }

            const result = await response.json();
            setSaveMessage({ type: 'success', text: 'CLM data saved successfully!' });
            
        } catch (error) {
            console.error('Error saving CLM data:', error);
            setSaveMessage({ type: 'error', text: error.message || 'Failed to save CLM data' });
        } finally {
            setIsSaving(false);
        }
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

    // Utility function to generate YAML preview
    const generateYamlPreview = (dimension) => {
        switch(dimension) {
            case 'abstractSpecification':
                return `dimension_type: "abstract_specification"
context: "${clmData.abstractSpecification.context.replace(/"/g, '\\"')}"
goal: "${clmData.abstractSpecification.goal.replace(/"/g, '\\"')}"
success_criteria: "${clmData.abstractSpecification.successCriteria.replace(/"/g, '\\"')}"`;
            
            case 'concreteImplementation':
                return `dimension_type: "concrete_implementation"
inputs: "${clmData.concreteImplementation.inputs.replace(/"/g, '\\"')}"
activities: "${clmData.concreteImplementation.activities.replace(/"/g, '\\"')}"
outputs: "${clmData.concreteImplementation.outputs.replace(/"/g, '\\"')}"`;
            
            case 'balancedExpectations':
                return `dimension_type: "balanced_expectations"
practical_boundaries: "${clmData.balancedExpectations.practicalBoundaries.replace(/"/g, '\\"')}"
evaluation_metrics: "${clmData.balancedExpectations.evaluationMetrics.replace(/"/g, '\\"')}"
feedback_loops: "${clmData.balancedExpectations.feedbackLoops.replace(/"/g, '\\"')}"`;
            
            default:
                return '';
        }
    };

    // Render appropriate content based on active dimension
    const renderDimensionContent = () => {
        switch(activeDimension) {
            case 'abstractSpecification':
                return (
                    <AbstractSpecification 
                        data={clmData.abstractSpecification}
                        onChange={handleInputChange}
                        generateYamlPreview={generateYamlPreview}
                    />
                );
            case 'concreteImplementation':
                return (
                    <ConcreteImplementation 
                        data={clmData.concreteImplementation}
                        onChange={handleInputChange}
                        generateYamlPreview={generateYamlPreview}
                    />
                );
            case 'balancedExpectations':
                return (
                    <BalancedExpectations 
                        data={clmData.balancedExpectations}
                        onChange={handleInputChange}
                        generateYamlPreview={generateYamlPreview}
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
                    <DimensionNavigation 
                        activeDimension={activeDimension} 
                        onDimensionChange={setActiveDimension} 
                    />
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
