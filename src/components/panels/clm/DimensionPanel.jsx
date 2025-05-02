import React from 'react';
import JsonPreview from './JsonPreview';

// Base component for dimension panels
const DimensionPanel = ({ title, fields, data, onChange, jsonData }) => {
    // Add debugging to help diagnose issues
    console.log(`DimensionPanel rendering ${title} with data:`, data);
    console.log(`JsonData received:`, jsonData);
    
    const handleChange = (key, value) => {
        console.log(`Field changed: ${key} = ${value}`);
        onChange(key, value);
    };
    
    // Render different input types based on field config
    const renderField = (field) => {
        // Check if the data object actually has this property
        const fieldValue = data && typeof data[field.key] !== 'undefined' ? data[field.key] : '';
        
        // Ensure we're not passing an object as a string value
        if (typeof fieldValue === 'object' && fieldValue !== null) {
            console.warn(`Field ${field.key} has object value`, fieldValue);
        }
        
        // Handle different field types
        switch (field.type) {
            case 'files':
                // Render read-only textarea for files
                return (
                    <textarea 
                        className="w-full h-40 p-3 rounded-lg border border-gray-300 bg-gray-50"
                        placeholder={field.placeholder}
                        value={typeof fieldValue === 'string' ? fieldValue : ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        readOnly={true}
                    />
                );
            default:
                // Default to normal textarea input
                return (
                    <textarea 
                        className="w-full h-40 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                        placeholder={field.placeholder}
                        value={typeof fieldValue === 'string' ? fieldValue : ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                    />
                );
        }
    };
    
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">{title}</h2>
            
            {fields.map(field => (
                <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                    {renderField(field)}
                </div>
            ))}
            
            {/* Only render the JSON preview if we have valid data */}
            {jsonData && (
                <JsonPreview 
                    data={jsonData} 
                    title={`${title} JSON`} 
                />
            )}
        </div>
    );
};

export default DimensionPanel;
