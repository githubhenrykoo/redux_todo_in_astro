import React from 'react';
import DimensionPanel from './DimensionPanel';

const ConcreteImplementation = ({ data, onChange, generateYamlPreview }) => {
    const fields = [
        {
            key: 'inputs',
            label: 'Inputs',
            placeholder: 'Describe the data sources and command parameters...'
        },
        {
            key: 'activities',
            label: 'Activities',
            placeholder: 'Define the executable functions and processing logic...'
        },
        {
            key: 'outputs',
            label: 'Outputs',
            placeholder: 'Specify the response formats and presentation templates...'
        }
    ];

    const handleChange = (key, value) => {
        onChange('concreteImplementation', key, value);
    };

    return (
        <DimensionPanel
            title="Concrete Implementation"
            fields={fields}
            data={data}
            onChange={handleChange}
            yamlPreview={generateYamlPreview('concreteImplementation')}
        />
    );
};

export default ConcreteImplementation;
