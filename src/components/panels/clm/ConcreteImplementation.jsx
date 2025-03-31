import React from 'react';
import DimensionPanel from './DimensionPanel';

const ConcreteImplementation = ({ data, onChange, generateJsonData }) => {
    console.log("ConcreteImplementation rendered with data:", data);
    
    // Define fields according to CLM_for_CLM_Mcard.md spec
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

    // Add dimensionType to local data before passing to parent
    const handleChange = (key, value) => {
        console.log(`ConcreteImplementation handleChange: ${key} = "${value}"`);
        // Important: DO NOT include section parameter for dimension components
        onChange('concreteImplementation', null, key, value);
    };

    // Build the dimension data with proper structure - directly return object
    const getDimensionData = () => {
        if (!data) {
            console.warn("No data provided to ConcreteImplementation");
            return { dimensionType: "concreteImplementation" };
        }

        // Create a clean object for JSON preview
        return {
            dimensionType: "concreteImplementation",
            inputs: data.inputs || "",
            activities: data.activities || "",
            outputs: data.outputs || ""
        };
    };

    return (
        <DimensionPanel
            title="Concrete Implementation"
            fields={fields}
            data={data || {}}
            onChange={handleChange}
            jsonData={getDimensionData()}
        />
    );
};

export default ConcreteImplementation;
