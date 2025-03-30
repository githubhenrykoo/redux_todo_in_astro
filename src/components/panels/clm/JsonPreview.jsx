import React from 'react';

const JsonPreview = ({ data, title = "JSON Preview" }) => {
    // Format JSON with indentation for better readability
    const formattedJson = JSON.stringify(data, null, 2);
    
    return (
        <div className="json-preview-container">
            <h3 className="json-preview-title text-lg font-bold">{title}</h3>
            <pre className="json-preview p-3 rounded-lg bg-slate-800 text-slate-100 text-sm overflow-auto max-h-60">
                {formattedJson}
            </pre>
        </div>
    );
};

export default JsonPreview;
