import React from 'react';

/**
 * Component for displaying Python script content
 */
const ScriptContent = ({ content }) => {
    return (
        <div className="pse-script-container">
            <h3>Script Content</h3>
            <pre className="pse-script-content">{content}</pre>
        </div>
    );
};

export default ScriptContent;
