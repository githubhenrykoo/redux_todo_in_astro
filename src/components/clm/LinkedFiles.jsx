import React from 'react';
import { useDispatch } from 'react-redux';
import PythonFileUploader from './PythonFileUploader';

/**
 * Component to display and interact with linked files in the CLM
 */
const LinkedFiles = ({ 
    content, 
    cards, 
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
    
    // Handle executing a Python script for a linked file
    const handleExecutePython = async (fileHash) => {
        console.log('Executing Python script for file hash:', fileHash);
        
        // Get the file from Redux store
        const file = cards[fileHash.trim()];
        
        if (file && file.content) {
            // We already have the file in Redux, prepare and dispatch to execute it
            let scriptContent = '';
            
            // Handle binary or text content properly
            if (file.content instanceof Uint8Array || 
                (typeof file.content === 'object' && file.content.type === 'Buffer')) {
                // Convert binary content to string
                const buffer = file.content instanceof Uint8Array 
                    ? file.content 
                    : new Uint8Array(file.content.data);
                scriptContent = new TextDecoder().decode(buffer);
            } else if (typeof file.content === 'string') {
                // Already a string
                scriptContent = file.content;
            } else {
                // Try to convert other formats to string
                try {
                    scriptContent = JSON.stringify(file.content, null, 2);
                } catch (e) {
                    scriptContent = String(file.content);
                }
            }
            
            console.log('Dispatching script execution with content length:', scriptContent.length);
            
            // Dispatch action to execute the script
            dispatch({
                type: 'pythonrepl/executeScript',
                payload: {
                    content: scriptContent,
                    hash: fileHash,
                    filename: file.metadata?.filename || fileHash.substring(0, 8)
                }
            });
        } else {
            // We don't have the file yet, fetch it first
            try {
                console.log('Fetching file content for execution:', fileHash);
                const response = await fetch(`/api/card-collection?action=get&hash=${fileHash.trim()}`);
                
                if (!response.ok) {
                    throw new Error(`API returned ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log('API response:', data);
                
                if (data.success && data.card) {
                    // Store in Redux for future use
                    dispatch({
                        type: 'content/addCard',
                        payload: {
                            hash: fileHash.trim(),
                            card: data.card
                        }
                    });
                    
                    // Prepare the script content
                    let scriptContent = '';
                    
                    // Handle binary or text content properly
                    if (data.card.content instanceof Uint8Array || 
                        (typeof data.card.content === 'object' && data.card.content.type === 'Buffer')) {
                        // Convert binary content to string
                        const buffer = data.card.content instanceof Uint8Array 
                            ? data.card.content 
                            : new Uint8Array(data.card.content.data);
                        scriptContent = new TextDecoder().decode(buffer);
                    } else if (typeof data.card.content === 'string') {
                        // Already a string
                        scriptContent = data.card.content;
                    } else {
                        // Try to convert other formats to string
                        try {
                            scriptContent = JSON.stringify(data.card.content, null, 2);
                        } catch (e) {
                            scriptContent = String(data.card.content);
                        }
                    }
                    
                    console.log('Dispatching script execution with content length:', scriptContent.length);
                    
                    // Execute with the fetched file
                    dispatch({
                        type: 'pythonrepl/executeScript',
                        payload: {
                            content: scriptContent,
                            hash: fileHash,
                            filename: data.card.metadata?.filename || fileHash.substring(0, 8)
                        }
                    });
                } else {
                    throw new Error('Failed to fetch file content');
                }
            } catch (error) {
                console.error('Error fetching file for execution:', error);
                // Show error through global notification or toast
                alert(`Error executing Python script: ${error.message}`);
            }
        }
    };
    
    // Render a single linked file item
    const renderLinkedFile = (fileHash, idx) => {
        // Check if the file exists in cards
        const file = cards[fileHash.trim()] || {};
        const fileFound = Object.keys(file).length > 0 && file.content;
        
        console.log('Rendering linked file:', fileHash, 'File data:', file);
        console.log('File content exists?', !!file.content);
        
        // IMPORTANT: For now, assume all linked files can be executed as Python
        // This is a temporary fix to ensure the Execute button appears
        const isPythonFile = true;
        
        return (
            <div key={idx} className={`linked-file-item ${fileFound ? 'file-found' : 'file-missing'}`}>
                <span className="file-hash" title={fileHash.trim()}>
                    {fileHash.substring(0, 16)}...
                </span>
                <div className="file-actions">
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
                    {/* Hide the execute buttons - we now use the top-level Execute CLM button */}
                </div>
                {!fileFound && (
                    <div className="file-warning">
                        File not found in cache - will fetch during execution
                    </div>
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
