import React from 'react';
import { useDispatch } from 'react-redux';
import { executePythonScript } from './PythonExecutionArea';
import PythonFileUploader from './PythonFileUploader';

/**
 * Component to display and interact with linked files in the CLM
 */
const LinkedFiles = ({ 
    content, 
    cards, 
    wsRef, 
    executionStatus, 
    setPythonScriptOutput, 
    setExecutionStatus,
    sectionName = ''
}) => {
    const dispatch = useDispatch();
    
    // Handle callback when a Python file is uploaded
    const handlePythonFileUploaded = (fileData) => {
        // Notify about successful upload
        console.log('Python file uploaded:', fileData);
        
        // Update content if needed - this would be handled by parent component
        // or through Redux in a real implementation
        
        // Show the new file in the catalog immediately
        dispatch({
            type: 'content/addCard',
            payload: {
                hash: fileData.hash,
                card: fileData
            }
        });

        // Optionally select the new file
        dispatch({
            type: 'content/setSelectedHash',
            payload: fileData.hash
        });
    };
    
    // Helper function to format content based on type
    const formatContent = (content) => {
        if (!content) {
            return null;
        }
        
        if (typeof content === 'string') {
            return content;
        }
        
        if (Array.isArray(content)) {
            return content.join('\n');
        }
        
        if (typeof content === 'object') {
            try {
                return JSON.stringify(content, null, 2);
            } catch (e) {
                return `Error formatting content: ${e.message}`;
            }
        }
        
        return String(content);
    };
    
    // Handle button click to execute Python script
    const handleExecuteScript = (fileHash) => {
        if (!wsRef) {
            console.error('WebSocket not connected for executing Python script');
            setPythonScriptOutput(['Error: Python server not connected. Please check your WebSocket connection.']);
            setExecutionStatus('error');
            return;
        }
        console.log('Executing Python script:', fileHash);
        executePythonScript(fileHash, wsRef, setPythonScriptOutput, setExecutionStatus);
    };
    
    // Render a single linked file item
    const renderLinkedFile = (fileHash, idx) => {
        // Check if the file exists in cards
        const file = cards[fileHash.trim()] || {};
        console.log('Rendering linked file:', fileHash, 'File data:', file);
        
        // Determine if this is a Python file
        const isPythonFile = 
            file.type === 'text/x-python-script' || 
            file.type === 'X-PYTHON-SCRIPT' ||
            (file.name && file.name.toLowerCase().endsWith('.py')) ||
            fileHash.includes('.py');
            
        console.log('Is Python file?', isPythonFile, 'File type:', file.type, 'File name:', file.name);
        
        return (
            <div key={idx} className="linked-file-item">
                <span className="file-hash">{fileHash.trim()}</span>
                <button 
                    className="view-file-btn"
                    onClick={() => {
                        // Dispatch to view this file
                        dispatch({
                            type: 'content/setSelectedHash',
                            payload: fileHash.trim()
                        });
                    }}
                >
                    View
                </button>
                {isPythonFile && (
                    <button 
                        className="execute-python-btn"
                        onClick={() => handleExecuteScript(fileHash.trim())}
                        disabled={executionStatus === 'running'}
                    >
                        {executionStatus === 'running' ? 'Running...' : 'Execute Python'}
                    </button>
                )}
            </div>
        );
    };
    
    // If content is null or undefined, return nothing
    if (!content) {
        // Show the uploader if this is a relevant section for Python files
        if (sectionName === 'activities' || sectionName === 'inputs') {
            return (
                <div className="linked-files-empty">
                    <p>No linked files yet. Upload a Python file:</p>
                    <PythonFileUploader 
                        onFileUploaded={handlePythonFileUploaded}
                        buttonLabel={`Upload Python for ${sectionName}`}
                    />
                </div>
            );
        }
        return null;
    }
    
    // If content is a string but contains linkedFiles marker
    if (typeof content === 'string' && content.includes('linkedFiles:')) {
        const parts = content.split('linkedFiles:');
        return (
            <div>
                <div>{parts[0]}</div>
                <div className="linked-files-section">
                    <h4>Linked Files</h4>
                    <div className="linked-files-list">
                        {parts[1].trim().split('\n').map((fileHash, idx) => 
                            renderLinkedFile(fileHash.trim(), idx)
                        )}
                    </div>
                    
                    {/* Add Python file uploader if this is a relevant section */}
                    {(sectionName === 'activities' || sectionName === 'inputs') && (
                        <div className="linked-files-upload">
                            <PythonFileUploader 
                                onFileUploaded={handlePythonFileUploaded}
                                buttonLabel={`Add Python Script to ${sectionName}`}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }
    
    // If content is an object with linkedFiles property
    if (typeof content === 'object' && content.linkedFiles) {
        const { linkedFiles, ...restContent } = content;
        const mainContent = Object.keys(restContent).length > 0 
            ? formatContent(restContent) 
            : '';
        
        return (
            <div>
                <div>{mainContent}</div>
                <div className="linked-files-section">
                    <h4>Linked Files</h4>
                    <div className="linked-files-list">
                        {Array.isArray(linkedFiles) 
                            ? linkedFiles.map((fileHash, idx) => renderLinkedFile(fileHash, idx))
                            : renderLinkedFile(linkedFiles, 0)
                        }
                    </div>
                    
                    {/* Add Python file uploader if this is a relevant section */}
                    {(sectionName === 'activities' || sectionName === 'inputs') && (
                        <div className="linked-files-upload">
                            <PythonFileUploader 
                                onFileUploaded={handlePythonFileUploaded}
                                buttonLabel={`Add Python Script to ${sectionName}`}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }
    
    // Default: just format the content normally
    return (
        <div>
            {formatContent(content)}
            
            {/* Add Python file uploader if this is a relevant section and no files exist yet */}
            {(sectionName === 'activities' || sectionName === 'inputs') && (
                <div className="linked-files-upload">
                    <PythonFileUploader 
                        onFileUploaded={handlePythonFileUploaded}
                        buttonLabel={`Add Python Script to ${sectionName}`}
                    />
                </div>
            )}
        </div>
    );
};

export default LinkedFiles;
