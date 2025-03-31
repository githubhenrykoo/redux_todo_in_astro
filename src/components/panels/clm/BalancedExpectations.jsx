import React from 'react';
import DimensionPanel from './DimensionPanel';

const BalancedExpectations = ({ data, onChange, generateJsonData }) => {
    console.log("BalancedExpectations rendered with data:", data);
    
    // Define fields according to CLM_for_CLM_Mcard.md spec
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

    // Add dimensionType to local data before passing to parent
    const handleChange = (key, value) => {
        console.log(`BalancedExpectations handleChange: ${key} = "${value}"`);
        // Important: DO NOT include section parameter for dimension components
        onChange('balancedExpectations', null, key, value);
    };

    // Build the dimension data with proper structure - directly return object
    const getDimensionData = () => {
        if (!data) {
            console.warn("No data provided to BalancedExpectations");
            return { dimensionType: "balancedExpectations" };
        }

        // Create a clean object for JSON preview
        return {
            dimensionType: "balancedExpectations",
            practicalBoundaries: data.practicalBoundaries || "",
            evaluationMetrics: data.evaluationMetrics || "",
            feedbackLoops: data.feedbackLoops || ""
        };
    };

    return (
        <DimensionPanel
            title="Balanced Expectations"
            fields={fields}
            data={data || {}}
            onChange={handleChange}
            jsonData={getDimensionData()}
        />
    );
};

export default BalancedExpectations;
