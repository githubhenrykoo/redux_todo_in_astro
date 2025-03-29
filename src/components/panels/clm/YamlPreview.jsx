import React from 'react';

const YamlPreview = ({ yamlContent }) => {
    return (
        <div>
            <h3 className="text-lg font-bold">YAML Preview</h3>
            <pre className="p-3 rounded-lg bg-slate-100 text-sm">
                {yamlContent}
            </pre>
        </div>
    );
};

export default YamlPreview;
