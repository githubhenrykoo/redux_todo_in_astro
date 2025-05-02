import React, { useRef } from 'react';

/**
 * Component for displaying the direct REPL iframe
 */
const DirectREPLFrame = () => {
    const replFrameRef = useRef(null);

    return (
        <div className="pse-direct-repl">
            <h4>Direct REPL Output</h4>
            <iframe 
                src="/repl-frame.html" 
                className="pse-repl-frame"
                title="Python REPL"
                ref={replFrameRef}
            ></iframe>
        </div>
    );
};

export default DirectREPLFrame;
