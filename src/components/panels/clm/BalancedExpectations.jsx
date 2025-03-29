import React from 'react';
import DimensionPanel from './DimensionPanel';

const BalancedExpectations = ({ data, onChange, generateYamlPreview }) => {
    const fields = [
        {
            key: 'practicalBoundaries',
            label: 'Practical Boundaries',
            placeholder: 'Define system constraints and error handling strategies...'
        },
        {
            key: 'evaluationMetrics',
            label: 'Evaluation Metrics',
            placeholder: 'Specify performance indicators and monitoring thresholds...'
        },
        {
            key: 'feedbackLoops',
            label: 'Feedback Loops',
            placeholder: 'Define user feedback channels and continuous improvement processes...'
        }
    ];

    const handleChange = (key, value) => {
        onChange('balancedExpectations', key, value);
    };

    return (
        <DimensionPanel
            title="Balanced Expectations"
            fields={fields}
            data={data}
            onChange={handleChange}
            yamlPreview={generateYamlPreview('balancedExpectations')}
        />
    );
};

export default BalancedExpectations;
