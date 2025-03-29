import React from 'react';
import YamlPreview from './YamlPreview';

// Base component for dimension panels
const DimensionPanel = ({ title, fields, data, onChange, yamlPreview }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">{title}</h2>
            
            {fields.map(field => (
                <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                    <textarea 
                        className="w-full h-40 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                        placeholder={field.placeholder}
                        value={data[field.key]}
                        onChange={(e) => onChange(field.key, e.target.value)}
                    />
                </div>
            ))}
            
            <YamlPreview yamlContent={yamlPreview} />
        </div>
    );
};

export default DimensionPanel;
