import React from 'react';
import DimensionPanel from './DimensionPanel';

const AbstractSpecification = ({ data, onChange, generateYamlPreview }) => {
    const fields = [
        {
            key: 'context',
            label: 'Context',
            placeholder: 'Describe the context of this Cubical Logic Model...'
        },
        {
            key: 'goal',
            label: 'Goal',
            placeholder: 'Define the primary goal of this model...'
        },
        {
            key: 'successCriteria',
            label: 'Success Criteria',
            placeholder: 'List the success criteria for this model...'
        }
    ];

    const handleChange = (key, value) => {
        onChange('abstractSpecification', key, value);
    };

    return (
        <DimensionPanel
            title="Abstract Specification"
            fields={fields}
            data={data}
            onChange={handleChange}
            yamlPreview={generateYamlPreview('abstractSpecification')}
        />
    );
};

export default AbstractSpecification;
