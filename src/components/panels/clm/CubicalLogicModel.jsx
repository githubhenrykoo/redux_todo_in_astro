import React, { useState, useEffect } from 'react';
import JsonPreview from './JsonPreview';
import '../../../styles/clm-table.css';

const CubicalLogicModel = ({ 
    data = {}, 
    onChange, 
    generateJsonData,
    isReadOnly = false 
}) => {
    const [localData, setLocalData] = useState({
        // Three dimensions of Cubical Logic Model
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
    });

    useEffect(() => {
        // Initialize with provided data or keep defaults
        if (data && Object.keys(data).length > 0) {
            setLocalData(data);
        }
    }, [data]);

    const handleInputChange = (section, field, value) => {
        const updatedData = { 
            ...localData, 
            [section]: {
                ...localData[section],
                [field]: value
            }
        };
        setLocalData(updatedData);
        
        // Notify parent component about data changes
        if (onChange && !isReadOnly) {
            onChange('cubicalLogicModel', section, field, value);
        }
    };

    const renderSection = (sectionName, title, fields) => {
        return (
            <div className="clm-section">
                <h4>{title}</h4>
                <div className="section-content">
                    {fields.map(field => (
                        <div className="form-group" key={field.key}>
                            <label>{field.label}</label>
                            <textarea
                                value={localData[sectionName][field.key]}
                                onChange={(e) => handleInputChange(sectionName, field.key, e.target.value)}
                                placeholder={field.placeholder}
                                disabled={isReadOnly}
                                rows={4}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="cubical-logic-model-panel">
            <h3>Cubical Logic Model</h3>
            
            {!isReadOnly && (
                <div className="input-section clm-grid">
                    {renderSection('abstractSpecification', 'Abstract Specification', [
                        { key: 'context', label: 'Context', placeholder: 'Describe the contextual background' },
                        { key: 'goal', label: 'Goal', placeholder: 'Define the primary goal' },
                        { key: 'successCriteria', label: 'Success Criteria', placeholder: 'List the criteria for success' }
                    ])}

                    {renderSection('concreteImplementation', 'Concrete Implementation', [
                        { key: 'inputs', label: 'Inputs', placeholder: 'List required inputs and resources' },
                        { key: 'activities', label: 'Activities', placeholder: 'Describe implementation activities' },
                        { key: 'outputs', label: 'Outputs', placeholder: 'Define expected outputs' }
                    ])}

                    {renderSection('balancedExpectations', 'Balanced Expectations', [
                        { key: 'practicalBoundaries', label: 'Practical Boundaries', placeholder: 'Define practical boundaries and constraints' },
                        { key: 'evaluationMetrics', label: 'Evaluation Metrics', placeholder: 'Describe evaluation data and performance metrics' },
                        { key: 'feedbackLoops', label: 'Feedback Loops', placeholder: 'Outline feedback loops and validation mechanisms' }
                    ])}
                </div>
            )}

            {/* Table Display Preview */}
            {isReadOnly && (
                <div className="clm-table-preview">
                    <table className="clm-table">
                        <tbody>
                            <tr>
                                <th colSpan={6}>Abstract Specification</th>
                            </tr>
                            <tr>
                                <th>Context</th>
                                <td colSpan={5}>{localData.abstractSpecification.context}</td>
                            </tr>
                            <tr>
                                <th>Goal</th>
                                <td colSpan={5}>{localData.abstractSpecification.goal}</td>
                            </tr>
                            <tr>
                                <th>Success Criteria</th>
                                <td colSpan={5}>{localData.abstractSpecification.successCriteria}</td>
                            </tr>

                            <tr>
                                <th colSpan={6}>Concrete Implementation</th>
                            </tr>
                            <tr>
                                <th colSpan={2}>Inputs</th>
                                <th colSpan={2}>Activities</th>
                                <th colSpan={2}>Outputs</th>
                            </tr>
                            <tr>
                                <td colSpan={2}>{localData.concreteImplementation.inputs}</td>
                                <td colSpan={2}>{localData.concreteImplementation.activities}</td>
                                <td colSpan={2}>{localData.concreteImplementation.outputs}</td>
                            </tr>

                            <tr>
                                <th colSpan={6}>Balanced Expectations</th>
                            </tr>
                            <tr>
                                <th colSpan={2}>Practical Boundaries</th>
                                <td colSpan={4}>{localData.balancedExpectations.practicalBoundaries}</td>
                            </tr>
                            <tr>
                                <th colSpan={2}>Evaluation Metrics</th>
                                <td colSpan={4}>{localData.balancedExpectations.evaluationMetrics}</td>
                            </tr>
                            <tr>
                                <th colSpan={2}>Feedback Loops</th>
                                <td colSpan={4}>{localData.balancedExpectations.feedbackLoops}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            <JsonPreview 
                data={localData} 
                title="Cubical Logic Model JSON" 
            />
        </div>
    );
};

export default CubicalLogicModel;
