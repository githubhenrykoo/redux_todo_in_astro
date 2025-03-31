import React from 'react';
import DimensionPanel from './DimensionPanel';

const AbstractSpecification = ({ data, onChange, generateJsonData }) => {
    console.log("AbstractSpecification rendered with data:", data);
    
    // Define fields according to CLM_for_CLM_Mcard.md spec
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

    // Add dimensionType to local data before passing to parent
    const handleChange = (key, value) => {
        console.log(`AbstractSpecification handleChange: ${key} = "${value}"`);
        // Important: DO NOT include section parameter for dimension components
        onChange('abstractSpecification', null, key, value);
    };

    // Build the dimension data with proper structure - directly return object
    const getDimensionData = () => {
        if (!data) {
            console.warn("No data provided to AbstractSpecification");
            return { dimensionType: "abstractSpecification" };
        }

        // Create a clean object for JSON preview
        return {
            dimensionType: "abstractSpecification",
            context: data.context || "",
            goal: data.goal || "",
            successCriteria: data.successCriteria || ""
        };
    };

    return (
        <DimensionPanel
            title="Abstract Specification"
            fields={fields}
            data={data || {}}
            onChange={handleChange}
            jsonData={getDimensionData()}
        />
    );
};

export default AbstractSpecification;
