import React, { useState } from 'react';

const CLMInputPanel = () => {
    const [clmData, setClmData] = useState({
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
            practicalBoundariesAndConstraints: '',
            evaluationDataAndPerformanceMetrics: '',
            feedbackLoopsAndValidation: ''
        }
    });
    
    const [activeSection, setActiveSection] = useState('abstractSpecification');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);

    // Handle input changes
    const handleInputChange = (section, subsection, value) => {
        if (subsection) {
            setClmData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [subsection]: value
                }
            }));
        } else {
            setClmData(prev => ({
                ...prev,
                [section]: value
            }));
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveMessage(null);

        try {
            // Convert CLM data to the expected format for storage
            const formattedClmData = {
                title: 'CLM Document',
                content: JSON.stringify(clmData),
                timestamp: new Date().toISOString(),
                format: 'clm'
            };

            // Store in database
            const response = await fetch('/api/store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formattedClmData)
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

    return (
        <div className="h-full bg-white overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Section Navigation */}
                <div className="flex space-x-4 border-b pb-4">
                    {[
                        { key: 'abstractSpecification', label: 'Abstract Specification' },
                        { key: 'concreteImplementation', label: 'Concrete Implementation' },
                        { key: 'balancedExpectations', label: 'Balanced Expectations' }
                    ].map(section => (
                        <button
                            key={section.key}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                activeSection === section.key 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                            onClick={() => setActiveSection(section.key)}
                        >
                            {section.label}
                        </button>
                    ))}
                </div>

                {/* Abstract Specification Section */}
                {activeSection === 'abstractSpecification' && (
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
                    </div>
                )}

                {/* Concrete Implementation Section */}
                {activeSection === 'concreteImplementation' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Concrete Implementation</h2>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Inputs</label>
                            <textarea 
                                className="w-full h-40 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                placeholder="List the inputs required for this implementation..."
                                value={clmData.concreteImplementation.inputs}
                                onChange={(e) => handleInputChange('concreteImplementation', 'inputs', e.target.value)}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Activities</label>
                            <textarea 
                                className="w-full h-40 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                placeholder="Describe the activities involved in this implementation..."
                                value={clmData.concreteImplementation.activities}
                                onChange={(e) => handleInputChange('concreteImplementation', 'activities', e.target.value)}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Outputs</label>
                            <textarea 
                                className="w-full h-40 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                placeholder="Define the expected outputs of this implementation..."
                                value={clmData.concreteImplementation.outputs}
                                onChange={(e) => handleInputChange('concreteImplementation', 'outputs', e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* Balanced Expectations Section */}
                {activeSection === 'balancedExpectations' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Balanced Expectations</h2>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Practical Boundaries and Constraints</label>
                            <textarea 
                                className="w-full h-40 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                placeholder="Describe available resources, external constraints, potential risks, and the boundaries of your expectations..."
                                value={clmData.balancedExpectations.practicalBoundariesAndConstraints}
                                onChange={(e) => handleInputChange('balancedExpectations', 'practicalBoundariesAndConstraints', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Evaluation Data and Performance Metrics</label>
                            <textarea 
                                className="w-full h-40 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                placeholder="Describe the empirical data, performance metrics, and assessment criteria that will be used to evaluate success..."
                                value={clmData.balancedExpectations.evaluationDataAndPerformanceMetrics}
                                onChange={(e) => handleInputChange('balancedExpectations', 'evaluationDataAndPerformanceMetrics', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Feedback Loops and Validation</label>
                            <textarea 
                                className="w-full h-40 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                placeholder="Describe how empirical data and outcomes will be used to refine and validate the system, including feedback mechanisms and continuous improvement approaches..."
                                value={clmData.balancedExpectations.feedbackLoopsAndValidation}
                                onChange={(e) => handleInputChange('balancedExpectations', 'feedbackLoopsAndValidation', e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* Save Button */}
                <div className="mt-8">
                    <button
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                            isSaving
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                        onClick={handleSubmit}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save CLM Document'}
                    </button>
                    
                    {saveMessage && (
                        <div className={`mt-4 p-3 rounded text-sm ${
                            saveMessage.type === 'success' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {saveMessage.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CLMInputPanel;
