// src/components/viewers/DataTableViewer.jsx
import React, { useState, useEffect, useMemo } from 'react';

/**
 * A specialized viewer for tabular data (CSV, TSV, etc.)
 * Displays data in a formatted table view
 */
export const DataTableViewer = ({ content, contentType, delimiter = "," }) => {
  const [error, setError] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [textContent, setTextContent] = useState(null); // For fallback text display
  
  // Process the content and set the appropriate state
  useEffect(() => {
    const processContent = () => {
      try {
        console.log("DataTableViewer processing content:", typeof content);
        
        // Extract the text content from different types of data
        let textData = "";
        
        // Handle the Node.js Buffer JSON format when it's an object: {"type":"Buffer","data":[...]}
        if (typeof content === 'object' && content !== null && 
            content.type === 'Buffer' && Array.isArray(content.data)) {
          try {
            console.log("DataTableViewer: Detected Node.js Buffer JSON format as object");
            const array = new Uint8Array(content.data);
            textData = new TextDecoder().decode(array);
          } catch (e) {
            console.error("Error processing Buffer JSON format:", e);
            setError("Unable to parse data: Error processing Buffer data");
            return;
          }
        }
        // Handle the serialized Buffer JSON format when it's a string: '{"type":"Buffer","data":[...]}'
        else if (typeof content === 'string' && 
                 content.includes('"type":"Buffer"') && 
                 content.includes('"data":[')) {
          try {
            console.log("DataTableViewer: Detected serialized Buffer JSON format");
            const bufferObj = JSON.parse(content);
            if (bufferObj.type === 'Buffer' && Array.isArray(bufferObj.data)) {
              const array = new Uint8Array(bufferObj.data);
              textData = new TextDecoder().decode(array);
            } else {
              // Not a valid Buffer JSON, use as is
              textData = content;
            }
          } catch (e) {
            console.error("Error parsing serialized Buffer JSON:", e);
            // If parsing fails, use the string as is
            textData = content;
          }
        }
        // Handle plain string
        else if (typeof content === 'string') {
          console.log("DataTableViewer: Detected string content");
          textData = content;
        }
        // Handle typed arrays directly
        else if (content instanceof Uint8Array || content instanceof ArrayBuffer) {
          console.log("DataTableViewer: Detected typed array");
          textData = new TextDecoder().decode(
            content instanceof ArrayBuffer ? new Uint8Array(content) : content
          );
        }
        // Other object types - convert to JSON string
        else if (typeof content === 'object' && content !== null) {
          console.log("DataTableViewer: Detected object content, converting to JSON");
          textData = JSON.stringify(content, null, 2);
        }
        // Fallback
        else {
          console.log("DataTableViewer: Using fallback string conversion");
          textData = String(content);
        }
        
        // Always set the text content for fallback display
        setTextContent(textData);
        
        // Use the appropriate delimiter
        const actualDelimiter = contentType && 
                              contentType.options && 
                              contentType.options.delimiter
                                ? contentType.options.delimiter 
                                : delimiter;
        
        // Parse the content as CSV/TSV
        if (textData.trim()) {
          const result = parseCSV(textData, actualDelimiter);
          setParsedData(result);
        } else {
          setError("The data is empty");
        }
      } catch (e) {
        console.error("Error in DataTableViewer:", e);
        setError("Failed to parse data: " + e.message);
      }
    };
    
    processContent();
  }, [content, contentType, delimiter]);
  
  // Parse CSV text content into rows and columns
  const parseCSV = (text, delimiter) => {
    const lines = text.split(/\\r?\\n/);
    const result = [];
    
    // Filter out empty lines and parse each line
    for (const line of lines) {
      if (line.trim()) {
        result.push(parseCSVLine(line, delimiter));
      }
    }
    
    return result;
  };
  
  // Parse a single line of CSV text with proper handling of quoted fields
  const parseCSVLine = (line, delimiter) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      // Handle quotes
      if (char === '"') {
        // Check for escaped quotes (double quotes)
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // Skip the next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      }
      // Handle delimiters
      else if (char === delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } 
      // Regular character
      else {
        current += char;
      }
    }
    
    // Don't forget the last field
    result.push(current);
    
    return result;
  };

  // If there's an error, show it
  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600 mb-4">{error}</div>
        {textContent && (
          <div className="font-mono text-sm bg-gray-50 p-4 rounded overflow-auto max-h-96">
            <pre className="whitespace-pre-wrap break-words">{textContent}</pre>
          </div>
        )}
      </div>
    );
  }

  // If there's no parsed data yet, show loading
  if (!parsedData) {
    return <div className="p-4">Loading...</div>;
  }

  // If there's no header row, show error with text content
  if (parsedData.length === 0) {
    return (
      <div className="p-4">
        <div className="text-red-600 mb-4">No data to display</div>
        {textContent && (
          <div className="font-mono text-sm bg-gray-50 p-4 rounded overflow-auto max-h-96">
            <pre className="whitespace-pre-wrap break-words">{textContent}</pre>
          </div>
        )}
      </div>
    );
  }

  // Render the data table
  return (
    <div className="p-4 overflow-auto max-h-full">
      <table className="min-w-full border border-gray-200 text-sm">
        <thead className="bg-gray-100">
          <tr>
            {parsedData[0].map((header, index) => (
              <th key={index} className="border border-gray-200 px-4 py-2 text-left font-medium">
                {header || <span className="text-gray-400">(empty)</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {parsedData.slice(1).map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border border-gray-200 px-4 py-2">
                  {cell || <span className="text-gray-400">(empty)</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Show original text as a fallback */}
      {(!parsedData || parsedData.length <= 1) && textContent && (
        <div className="mt-4 font-mono text-sm bg-gray-50 p-4 rounded overflow-auto max-h-96">
          <h3 className="font-bold mb-2">Original Content:</h3>
          <pre className="whitespace-pre-wrap break-words">{textContent}</pre>
        </div>
      )}
    </div>
  );
};

export default DataTableViewer;
