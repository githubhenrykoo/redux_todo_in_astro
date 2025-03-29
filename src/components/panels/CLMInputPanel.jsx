import React, { useState } from 'react';

const CLMInputPanel = () => {
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

    // Handle form submission - to be implemented later
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveMessage(null);

        try {
            // Generate YAML-formatted content for each dimension MCard
            const abstractSpecificationYaml = `dimension_type: "abstract_specification"
context: "${clmData.abstractSpecification.context.replace(/"/g, '\\"')}"
goal: "${clmData.abstractSpecification.goal.replace(/"/g, '\\"')}"
success_criteria: "${clmData.abstractSpecification.successCriteria.replace(/"/g, '\\"')}"`;

            const concreteImplementationYaml = `dimension_type: "concrete_implementation"
inputs: "${clmData.concreteImplementation.inputs.replace(/"/g, '\\"')}"
activities: "${clmData.concreteImplementation.activities.replace(/"/g, '\\"')}"
outputs: "${clmData.concreteImplementation.outputs.replace(/"/g, '\\"')}"`;

            const balancedExpectationsYaml = `dimension_type: "balanced_expectations"
practical_boundaries: "${clmData.balancedExpectations.practicalBoundaries.replace(/"/g, '\\"')}"
evaluation_metrics: "${clmData.balancedExpectations.evaluationMetrics.replace(/"/g, '\\"')}"
feedback_loops: "${clmData.balancedExpectations.feedbackLoops.replace(/"/g, '\\"')}"`;

            // Prepare the root CLM MCard YAML
            const rootClmYaml = `title: "CLM Document"
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
                    title: 'CLM Document',
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

        // Utility function to generate SHA-256 hash (mock implementation)
        async function generateHash(content) {
            const encoder = new TextEncoder();
            const data = encoder.encode(content);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return 'sha256:' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }
    };

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

    return (
        <div className="h-full bg-white overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Dimension Navigation and Save Button Container */}
                <div className="flex justify-between items-center border-b pb-4">
                    {/* Dimension Navigation Buttons */}
                    <div className="flex space-x-4">
                        {[
                            { key: 'abstractSpecification', label: 'Abstract Specification' },
                            { key: 'concreteImplementation', label: 'Concrete Implementation' },
                            { key: 'balancedExpectations', label: 'Balanced Expectations' }
                        ].map(dimension => (
                            <button
                                key={dimension.key}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    activeDimension === dimension.key 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                                onClick={() => setActiveDimension(dimension.key)}
                            >
                                {dimension.label}
                            </button>
                        ))}
                    </div>

                    {/* Save Button */}
                    <button
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            isSaving
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                        onClick={handleSubmit}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
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

                {/* Abstract Specification Dimension */}
                {activeDimension === 'abstractSpecification' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Abstract Specification</h2>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Context</label>
                            <textarea 
                                className="w-full h-40 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                placeholder="Describe the context of this Cubical Logic Model..."
                                value={clmData.abstractSpecification.context}
                                onChange={(e) => handleInputChange('abstractSpecification', 'context', e.target.value)}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Goal</label>
                            <textarea 
                                className="w-full h-40 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                placeholder="Define the primary goal of this model..."
                                value={clmData.abstractSpecification.goal}
                                onChange={(e) => handleInputChange('abstractSpecification', 'goal', e.target.value)}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Success Criteria</label>
                            <textarea 
                                className="w-full h-40 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                placeholder="List the success criteria for this model..."
                                value={clmData.abstractSpecification.successCriteria}
                                onChange={(e) => handleInputChange('abstractSpecification', 'successCriteria', e.target.value)}
                            />
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-bold">YAML Preview</h3>
                            <pre className="p-3 rounded-lg bg-slate-100 text-sm">
                                {generateYamlPreview('abstractSpecification')}
                            </pre>
                        </div>
                    </div>
                )}

                {/* Concrete Implementation Dimension */}
                {activeDimension === 'concreteImplementation' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Concrete Implementation</h2>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Inputs</label>
                            <textarea 
                                className="w-full h-40 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                placeholder="Describe the data sources and command parameters..."
                                value={clmData.concreteImplementation.inputs}
                                onChange={(e) => handleInputChange('concreteImplementation', 'inputs', e.target.value)}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Activities</label>
                            <textarea 
                                className="w-full h-40 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                placeholder="Define the executable functions and processing logic..."
                                value={clmData.concreteImplementation.activities}
                                onChange={(e) => handleInputChange('concreteImplementation', 'activities', e.target.value)}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Outputs</label>
                            <textarea 
                                className="w-full h-40 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                placeholder="Specify the response formats and presentation templates..."
                                value={clmData.concreteImplementation.outputs}
                                onChange={(e) => handleInputChange('concreteImplementation', 'outputs', e.target.value)}
                            />
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-bold">YAML Preview</h3>
                            <pre className="p-3 rounded-lg bg-slate-100 text-sm">
                                {generateYamlPreview('concreteImplementation')}
                            </pre>
                        </div>
                    </div>
                )}

                {/* Balanced Expectations Dimension */}
                {activeDimension === 'balancedExpectations' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Balanced Expectations</h2>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Practical Boundaries</label>
                            <textarea 
                                className="w-full h-40 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                placeholder="Define system constraints and error handling strategies..."
                                value={clmData.balancedExpectations.practicalBoundaries}
                                onChange={(e) => handleInputChange('balancedExpectations', 'practicalBoundaries', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Evaluation Metrics</label>
                            <textarea 
                                className="w-full h-40 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                placeholder="Specify performance indicators and monitoring thresholds..."
                                value={clmData.balancedExpectations.evaluationMetrics}
                                onChange={(e) => handleInputChange('balancedExpectations', 'evaluationMetrics', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Feedback Loops</label>
                            <textarea 
                                className="w-full h-40 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                placeholder="Define user feedback channels and continuous improvement processes..."
                                value={clmData.balancedExpectations.feedbackLoops}
                                onChange={(e) => handleInputChange('balancedExpectations', 'feedbackLoops', e.target.value)}
                            />
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-bold">YAML Preview</h3>
                            <pre className="p-3 rounded-lg bg-slate-100 text-sm">
                                {generateYamlPreview('balancedExpectations')}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CLMInputPanel;
