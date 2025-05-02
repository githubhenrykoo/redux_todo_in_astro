import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

/**
 * Custom hook for loading and preparing Python script content
 */
export const usePythonScript = (initialHash = '') => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [scriptContent, setScriptContent] = useState('');
    const [scriptInfo, setScriptInfo] = useState({
        contentType: null,
        filename: 'No file selected',
        hash: '',
        timestamp: ''
    });

    // Use Redux selectors to get the selected hash and cards
    const selectedHash = useSelector(state => state?.content?.selectedHash || initialHash);
    const cards = useSelector(state => state?.content?.cards || {});
    
    // Get the currently selected script file from Redux store
    const scriptFile = useMemo(() => {
        return selectedHash ? cards[selectedHash] : null;
    }, [cards, selectedHash]);

    // Load script content when script file changes
    useEffect(() => {
        if (scriptFile) {
            loadScriptContent(scriptFile);
        } else {
            resetScript();
        }
    }, [scriptFile]);

    // Reset script state
    const resetScript = () => {
        setScriptContent('');
        setScriptInfo({
            contentType: null,
            filename: 'No file selected',
            hash: '',
            timestamp: ''
        });
        setError(null);
    };

    // Load script content from the selected file
    const loadScriptContent = async (file) => {
        try {
            setLoading(true);
            setError(null);
            
            // Check if file exists and has content
            if (!file || !file.content) {
                throw new Error("Invalid file or missing content");
            }
            
            // Check if file is a Python script based on content type
            const isPythonScript = file.contentType && 
                (file.contentType.mimeType === 'text/x-python-script' || 
                 file.contentType.mimeType === 'text/x-python' ||
                 file.contentType.extension === 'py' ||
                 (file.contentType.extension && file.contentType.extension.toLowerCase() === 'py') ||
                 (file.name && file.name.toLowerCase().endsWith('.py')));
            
            console.log('Checking file type:', file.contentType, 'isPythonScript:', isPythonScript);
            
            if (!isPythonScript) {
                // More flexible detection - check if it's in a Python directory or has Python content
                let filename = '';
                if (file.hash) {
                    // Try to fetch content details from API to confirm content type
                    const response = await fetch(`/api/card-collection?action=get&hash=${file.hash}&info=true`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.card && data.card.contentType) {
                            if (data.card.contentType.mimeType === 'text/x-python-script' || 
                                data.card.contentType.mimeType === 'text/x-python' ||
                                (data.card.contentType.extension && 
                                 data.card.contentType.extension.toLowerCase() === 'py')) {
                                // API confirms it's a Python file
                                console.log('API confirms Python file type:', data.card.contentType);
                                // Continue processing
                            } else {
                                throw new Error("Selected file is not a Python script");
                            }
                        } else if (typeof file.content === 'string' && 
                                  (file.content.includes('import ') || 
                                   file.content.includes('def ') || 
                                   file.content.includes('class ') ||
                                   file.content.includes('print('))) {
                            // Looks like Python code based on content
                            console.log('Detected Python content based on keywords');
                            // Continue processing
                        } else {
                            throw new Error("Selected file is not a Python script");
                        }
                    }
                } else {
                    throw new Error("Selected file is not a Python script");
                }
            }
            
            // Extract content from file
            let content = '';
            
            // Convert Buffer to string if needed
            if (file.content instanceof Uint8Array || 
                (typeof file.content === 'object' && file.content.type === 'Buffer')) {
                const buffer = file.content instanceof Uint8Array 
                    ? file.content 
                    : new Uint8Array(file.content.data);
                content = new TextDecoder().decode(buffer);
            } else if (typeof file.content === 'string') {
                content = file.content;
            } else {
                // Try to convert other formats to string
                try {
                    content = JSON.stringify(file.content, null, 2);
                } catch (e) {
                    content = String(file.content);
                }
            }
            
            // Update script content and info
            setScriptContent(content);
            setScriptInfo({
                contentType: file.contentType,
                filename: getFileName(file) || 'script.py',
                hash: file.hash || selectedHash,
                timestamp: formatTimestamp(file.timestamp || file.g_time)
            });
            
        } catch (error) {
            console.error('Error loading script:', error);
            setError(`Error loading script: ${error.message}`);
            setScriptContent('# Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };
    
    // Helper to format timestamp
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Unknown date';
        
        try {
            return new Date(timestamp).toLocaleString();
        } catch (e) {
            return timestamp;
        }
    };
    
    // Helper to extract file name from the script file
    const getFileName = (file) => {
        if (file.filename) return file.filename;
        if (file.name) return file.name;
        
        // Try to create a name based on content type
        if (file.contentType && file.contentType.extension) {
            return `script.${file.contentType.extension}`;
        }
        
        // Use the first 8 characters of the hash as the filename
        if (file.hash) {
            return `${file.hash.substring(0, 8)}.py`;
        }
        
        return 'script.py';
    };

    return {
        loading,
        error,
        scriptContent,
        scriptInfo,
        scriptFile,
        setError
    };
};

/**
 * Helper to ensure content is text, not binary
 */
export const ensureTextContent = (content) => {
    // If content is already a string, return it
    if (typeof content === 'string') {
        return content;
    }
    
    // Check if content is a Buffer or ArrayBuffer
    if (content instanceof ArrayBuffer || 
        (typeof Buffer !== 'undefined' && content instanceof Buffer) ||
        (content && typeof content === 'object' && content.buffer instanceof ArrayBuffer)) {
        // Convert to string using UTF-8 encoding
        try {
            if (typeof Buffer !== 'undefined') {
                return Buffer.from(content).toString('utf-8');
            } else {
                return new TextDecoder('utf-8').decode(content);
            }
        } catch (e) {
            console.error('Error converting binary content to text:', e);
            return String(content);
        }
    }
    
    // Fallback - try to convert to string
    return String(content);
};

/**
 * Helper to prepare script content for REPL execution
 */
export const prepareScriptForREPL = (content) => {
    // Ensure content is text
    let textContent = ensureTextContent(content);
    
    // Remove shebang line if present
    textContent = textContent.replace(/^#!.*?\n/, '');
    
    // Handle potential script structure issues
    // If there are function definitions or imports, wrap execution in if __name__ block
    if (!textContent.includes('if __name__ == "__main__"') && 
        !textContent.includes("if __name__ == '__main__'")) {
        
        // Look for function definitions or imports at top level
        const hasTopLevelDefs = /^\s*(def|class|import|from)\s+/m.test(textContent);
        
        if (hasTopLevelDefs) {
            // Add explicit execution if there are top-level defs but no __main__ block
            textContent += '\n\n# Auto-added by execution panel\nif __name__ == "__main__":\n';
            
            // Find all top-level function definitions
            const funcMatches = textContent.match(/^\s*def\s+(\w+)/mg);
            if (funcMatches && funcMatches.length > 0) {
                // Call the first defined function (often 'main')
                const funcName = funcMatches[0].trim().split(/\s+/)[1];
                textContent += `    ${funcName}()\n`;
            }
        }
    }
    
    return textContent;
};

/**
 * Helper to clean ANSI escape sequences from output
 */
export const cleanAnsiCodes = (text) => {
    if (typeof text !== 'string') return String(text);
    
    // Remove ANSI color codes and other terminal control sequences
    return text
        .replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '') // ANSI escape sequences
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\r/g, '\n');  // Convert remaining carriage returns
};
