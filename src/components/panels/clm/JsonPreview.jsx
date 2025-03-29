import React from 'react';

const JsonPreview = ({ jsonData }) => {
    // Format JSON with indentation for better readability
    const formattedJson = JSON.stringify(jsonData, null, 2);
    
    return (
        <div>
            <h3 className="text-lg font-bold">JSON Preview</h3>
            <pre className="p-3 rounded-lg bg-slate-100 text-sm overflow-auto max-h-60">
                {formattedJson}
            </pre>
        </div>
    );
};

export default JsonPreview;
