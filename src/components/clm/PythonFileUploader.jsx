import React, { useState, useRef } from 'react';

/**
 * Component for handling Python file uploads
 * Ensures files are processed as text rather than binary data
 */
const PythonFileUploader = ({ onFileUploaded, buttonLabel = "Upload Python File" }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setUploading(true);
        setError(null);
        
        try {
            // Read file as text instead of binary
            const content = await readFileAsText(file);
            
            // Create the proper payload for the API
            const payload = {
                action: 'add',
                card: {
                    name: file.name,
                    type: 'text/x-python-script', // Explicitly set the content type
                    content: content
                }
            };
            
            // Upload the file to the card-collection API
            const response = await fetch('/api/card-collection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error uploading Python file:', errorText);
                throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                console.log('Python file uploaded successfully', result);
                
                // Call the callback with the file data and hash
                if (onFileUploaded) {
                    onFileUploaded({
                        hash: result.hash,
                        name: file.name,
                        content: content,
                        type: 'text/x-python-script',
                        timestamp: new Date().toISOString()
                    });
                }
                
                // Reset the file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } else {
                throw new Error(result.error || 'Unknown error uploading file');
            }
        } catch (err) {
            console.error('Error in file upload process:', err);
            setError(err.message || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };
    
    // Read file as text instead of ArrayBuffer
    const readFileAsText = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            
            reader.onerror = (event) => {
                reject(new Error('Failed to read file'));
            };
            
            // Read as text, not as ArrayBuffer
            reader.readAsText(file);
        });
    };
    
    // Trigger the file input click
    const handleButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };
    
    return (
        <div className="python-file-uploader">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".py"
                style={{ display: 'none' }}
            />
            
            <button 
                className="upload-python-btn"
                onClick={handleButtonClick}
                disabled={uploading}
            >
                {uploading ? 'Uploading...' : buttonLabel}
            </button>
            
            {error && (
                <div className="upload-error">
                    Error: {error}
                </div>
            )}
        </div>
    );
};

export default PythonFileUploader;
