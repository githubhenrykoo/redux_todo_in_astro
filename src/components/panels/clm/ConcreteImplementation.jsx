import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DimensionPanel from './DimensionPanel';
import { updateInputs, updateActivities, updateOutputs } from '../../../features/concreteImplementationSlice';

const ConcreteImplementation = ({ data, onChange, generateJsonData }) => {
    const dispatch = useDispatch();
    const { inputs, activities, outputs } = useSelector(state => state.concreteImplementation);
    
    // Add default empty array if state.files or uploadedFiles is undefined
    const uploadedFiles = useSelector(state => state?.files?.uploadedFiles || []);
    const isUploading = useSelector(state => state?.files?.isUploading || false);
    const uploadError = useSelector(state => state?.files?.uploadError || null);
    
    console.log("ConcreteImplementation rendered with data:", data);
    
    // Define fields according to CLM_for_CLM_Mcard.md spec
    const fields = [
        {
            key: 'inputs',
            label: 'Inputs',
            placeholder: 'Describe the data sources and command parameters...'
        },
        {
            key: 'activities',
            label: 'Activities',
            placeholder: 'Define the executable functions and processing logic...'
        },
        {
            key: 'outputs',
            label: 'Outputs',
            placeholder: 'Specify the response formats and presentation templates...'
        }
    ];

    // Handle file upload - the file IS the concrete implementation
    const handleFileUpload = async (files) => {
        if (!files || files.length === 0) return;
        
        dispatch({ type: 'files/setIsUploading', payload: true });
        dispatch({ type: 'files/setUploadError', payload: null });
        
        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                // Create a FormData object to send the file
                const formData = new FormData();
                // Add action FIRST - this may help ensure it's properly parsed
                formData.append('action', 'add');
                formData.append('file', file);
                
                // Add metadata as JSON
                const metadata = {
                    filename: file.name,
                    contentType: file.type || 'application/octet-stream',
                    size: file.size,
                    type: 'concrete_implementation',  // Mark this as the actual implementation, not just a reference
                    dimensionType: 'concreteImplementation',
                    action: 'add' // Include action in metadata as well for redundancy
                };
                formData.append('metadata', JSON.stringify(metadata));
                
                // Try a URL-encoded approach with query parameters as a more reliable method
                const url = new URL('/api/card-collection', window.location.origin);
                url.searchParams.append('action', 'add');
                
                // Upload the file to card-collection API
                const response = await fetch(url.toString(), {
                    method: 'POST',
                    headers: {
                        // Add a custom header to ensure the action is properly received
                        'X-Action': 'add'
                    },
                    body: formData
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to upload file: ${errorText}`);
                }
                
                const result = await response.json();
                
                // Read file content for text files to show preview
                let textContent = '';
                if (file.type === 'text/plain' || 
                    file.name.endsWith('.py') || 
                    file.name.endsWith('.js') || 
                    file.name.endsWith('.txt')) {
                    const reader = new FileReader();
                    textContent = await new Promise((resolve) => {
                        reader.onload = (e) => resolve(e.target.result);
                        reader.readAsText(file);
                    });
                }
                
                // Return the result with additional file info
                return {
                    hash: result.hash,
                    filename: file.name,
                    contentType: file.type || 'application/octet-stream',
                    size: file.size,
                    textContent: textContent,
                    uploadedAt: new Date().toISOString()
                };
            });
            
            // Wait for all uploads to complete
            const uploadedResults = await Promise.all(uploadPromises);
            
            // Update Redux store with new files
            dispatch({ 
                type: 'files/addUploadedFiles', 
                payload: uploadedResults 
            });
            
            // Format a simple list of hashes for the activities field
            const allFiles = [...uploadedFiles, ...uploadedResults];
            const hashList = "linkedFiles:\n\n" + allFiles.map(file => file.hash).join("\n\n");
            
            // Set the formatted hash list in the activities field
            handleChange('activities', hashList);
            
            console.log('Files uploaded successfully:', uploadedResults);
        } catch (error) {
            console.error('Error uploading files:', error);
            dispatch({ 
                type: 'files/setUploadError', 
                payload: error.message || 'Failed to upload files' 
            });
        } finally {
            dispatch({ type: 'files/setIsUploading', payload: false });
        }
    };

    // Add dimensionType to local data before passing to parent
    const handleChange = (key, value) => {
        console.log(`ConcreteImplementation handleChange: ${key} = "${value}"`);
        switch(key) {
            case 'inputs':
                dispatch(updateInputs(value));
                break;
            case 'activities':
                dispatch(updateActivities(value));
                break;
            case 'outputs':
                dispatch(updateOutputs(value));
                break;
            default:
                break;
        }
        onChange('concreteImplementation', null, key, value);
    };

    // Build the dimension data with proper structure - directly return object
    const getDimensionData = () => {
        if (!data) {
            console.warn("No data provided to ConcreteImplementation");
            return { dimensionType: "concreteImplementation" };
        }

        // Create a clean object for JSON preview
        return {
            dimensionType: "concreteImplementation",
            inputs: inputs || "",
            activities: activities || "",
            outputs: outputs || ""
        };
    };

    return (
        <div className="space-y-6">
            {/* File Upload Section - Placed at the top to indicate its primacy */}
            <div className="p-4 border border-dashed border-blue-500 rounded-lg bg-blue-50">
                <h3 className="text-lg font-medium mb-2">Upload Implementation Files</h3>
                <p className="text-sm text-gray-600 mb-4">
                    <strong>Upload the concrete implementation file(s)</strong> - The file itself (e.g., Python script) will be treated as the primary implementation.
                </p>
                
                <div className="flex items-center justify-center">
                    <label className="flex flex-col items-center px-4 py-6 bg-white text-blue-500 rounded-lg shadow-lg tracking-wide uppercase border border-blue-500 cursor-pointer hover:bg-blue-500 hover:text-white">
                        <svg className="w-8 h-8" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
                        </svg>
                        <span className="mt-2 text-base leading-normal">Select Implementation File</span>
                        <input 
                            type='file' 
                            className="hidden" 
                            multiple 
                            onChange={(e) => handleFileUpload(e.target.files)}
                            disabled={isUploading}
                        />
                    </label>
                </div>
                
                {isUploading && (
                    <div className="mt-4 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        <p className="mt-2 text-sm text-gray-600">Uploading implementation file...</p>
                    </div>
                )}
                
                {uploadError && (
                    <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
                        <p className="text-sm">{uploadError}</p>
                    </div>
                )}
                
                {/* Display uploaded files */}
                {uploadedFiles.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Implementation Files:</h4>
                        <ul className="bg-gray-50 rounded-lg p-2">
                            {uploadedFiles.map((file, index) => (
                                <li key={index} className="text-sm py-1">
                                    <span className={index === 0 ? "font-bold" : ""}>
                                        {file.filename} {index === 0 && "(Primary Implementation)"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            
            {/* MCard Hashes Section */}
            {uploadedFiles.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">MCarded File Hashes</h3>
                    <p className="text-sm text-gray-600 mb-3">
                        These hashes uniquely identify the implementation files in the MCard database.
                    </p>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg shadow-sm">
                            <thead className="bg-blue-100">
                                <tr>
                                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">File</th>
                                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">Hash (MCard Identifier)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {uploadedFiles.map((file, index) => (
                                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                        <td className="py-2 px-4 text-sm text-gray-700">
                                            <span className={index === 0 ? "font-bold" : ""}>
                                                {file.filename} {index === 0 && "(Primary)"}
                                            </span>
                                        </td>
                                        <td className="py-2 px-4 text-sm font-mono text-blue-800">
                                            {file.hash}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            <DimensionPanel
                title="Concrete Implementation"
                fields={fields}
                data={{ inputs, activities, outputs }}
                onChange={handleChange}
                jsonData={getDimensionData()}
            />
        </div>
    );
};

export default ConcreteImplementation;
