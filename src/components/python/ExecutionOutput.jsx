import React, { useEffect } from 'react';

/**
 * Component for displaying Python script execution output
 */
const ExecutionOutput = ({ 
    output, 
    waitingForInput, 
    userInput, 
    setUserInput, 
    handleInputSubmit, 
    inputRef,
    outputRef
}) => {
    // Auto-scroll to bottom when output changes
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output, outputRef]);

    return (
        <>
            <h3>Execution Output</h3>
            <div className="pse-output" ref={outputRef}>
                {output.length === 0 ? (
                    <div className="pse-no-output">No output yet. Execute the script to see results here.</div>
                ) : (
                    <div className="pse-output-content">
                        {output.map((line, index) => (
                            <div key={index} className={`pse-output-line ${line.includes('input(') ? 'input-prompt' : ''}`}>
                                {line}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {waitingForInput && (
                <form className="pse-input-form" onSubmit={handleInputSubmit}>
                    <input 
                        type="text"
                        ref={inputRef}
                        className="pse-input-field"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Type your input here and press Enter"
                        autoFocus
                    />
                    <button type="submit" className="pse-input-submit">Submit</button>
                </form>
            )}
        </>
    );
};

export default ExecutionOutput;
