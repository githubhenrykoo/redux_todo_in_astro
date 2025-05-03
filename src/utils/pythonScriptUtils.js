/**
 * Utility functions for Python script handling
 */

/**
 * Cleans Python script content by removing HTML artifacts and fixing formatting issues
 * @param {string|Buffer} content - The raw script content
 * @returns {string} - The cleaned script content
 */
export const cleanScriptContent = (content) => {
    if (!content) return '';
    
    // Convert Buffer to string if needed
    let cleanedContent = content.toString();
    console.log('Original content:', cleanedContent);
    
    // Remove shebang line if present
    cleanedContent = cleanedContent.replace(/^\s*#!.*\n/, '');
    
    // Remove class attributes and HTML tags
    cleanedContent = cleanedContent
        .replace(/class="[^"]*"/g, '') // Remove class attributes
        .replace(/class=class="[^"]*"/g, '') // Remove double class attributes
        .replace(/<[^>]*>/g, ''); // Remove HTML tags
        
    // Fix incomplete operators (missing comparison symbols)
    cleanedContent = cleanedContent
        .replace(/if\s+s\s+9:/g, 'if s > 9:')
        .replace(/while\s+j\s+9:/g, 'while j < max_len and (A[j] + B[j]) > 9:');
        
    // Fix docstrings with wrong quotes
    cleanedContent = cleanedContent
        .replace(/""([^"]*)"""/g, '"""$1"""') // Fix triple quotes
        .replace(/""([^"]*)"/g, '"""$1"""') // Fix double to triple quotes
        .replace(/"([^"]*)"""/g, '"""$1"""'); // Fix double to triple quotes
        
    // Fix broken f-strings
    cleanedContent = cleanedContent.replace(/f"([^"]*)/g, 'f"$1');
    
    // Fix incomplete if conditions specifically for the while loop condition
    cleanedContent = cleanedContent.replace(/while j  max_len and \(A\[j\] \+ B\[j\]\) == 9:/g, 
                                           'while j < max_len and (A[j] + B[j]) == 9:');
    
    // Fix missing comparisons
    cleanedContent = cleanedContent.replace(/if s  9:/g, 'if s < 9:');
    
    // Log the cleaned content
    console.log('Cleaned content:', cleanedContent);
    
    return cleanedContent;
};
