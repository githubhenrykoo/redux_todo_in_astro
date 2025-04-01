// src/components/viewers/PDFViewer.jsx
import React, { useState, useEffect, useMemo } from 'react';

/**
 * A specialized viewer for PDF files
 */
export const PDFViewer = ({ content, contentType }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfSource, setPdfSource] = useState(null);
  const [textContent, setTextContent] = useState(null); // For fallback text display
  
  // Process the content and set the appropriate state
  useEffect(() => {
    const processContent = () => {
      try {
        console.log("PDFViewer processing content:", typeof content, content instanceof Uint8Array);
        
        // Handle the Node.js Buffer JSON format when it's an object: {"type":"Buffer","data":[...]}
        if (typeof content === 'object' && content !== null && 
            content.type === 'Buffer' && Array.isArray(content.data)) {
          try {
            console.log("PDFViewer: Detected Node.js Buffer JSON format as object", content.data.length);
            const array = new Uint8Array(content.data);
            const bytes = Array.from(array).map(byte => String.fromCharCode(byte)).join('');
            const base64 = typeof window !== 'undefined' ? window.btoa(bytes) : Buffer.from(bytes).toString('base64');
            setPdfSource(`data:application/pdf;base64,${base64}`);
            return;
          } catch (e) {
            console.error("Error processing Buffer JSON format:", e);
            setError("Unable to display PDF: Error processing Buffer data");
            return;
          }
        }
        
        // Handle the Buffer JSON format when it's a string: '{"type":"Buffer","data":[...]}'
        if (typeof content === 'string' && content.includes('"type":"Buffer"') && content.includes('"data":[')) {
          try {
            console.log("PDFViewer: Detected Node.js Buffer JSON format as string");
            const bufferObj = JSON.parse(content);
            if (bufferObj && bufferObj.type === 'Buffer' && Array.isArray(bufferObj.data)) {
              const array = new Uint8Array(bufferObj.data);
              const bytes = Array.from(array).map(byte => String.fromCharCode(byte)).join('');
              const base64 = typeof window !== 'undefined' ? window.btoa(bytes) : Buffer.from(bytes).toString('base64');
              setPdfSource(`data:application/pdf;base64,${base64}`);
              return;
            }
          } catch (e) {
            console.error("Error parsing Buffer JSON string:", e);
            // Don't return here, try other approaches or fallback to text display
          }
        }
        
        // If content is already a data URL or external URL
        if (typeof content === 'string' && 
            (content.startsWith('data:') || content.startsWith('http'))) {
          setPdfSource(content);
          return;
        }
        
        // If content is a Uint8Array or ArrayBuffer, convert to base64
        if (content instanceof Uint8Array || content instanceof ArrayBuffer || 
            (content && typeof content === 'object' && content.buffer instanceof ArrayBuffer)) {
          try {
            // Ensure we have a Uint8Array to work with
            let array;
            if (content instanceof ArrayBuffer) {
              array = new Uint8Array(content);
            } else if (content instanceof Uint8Array) {
              array = content;
            } else if (content.buffer instanceof ArrayBuffer) {
              // Handle array-like objects with buffer property
              array = new Uint8Array(content.buffer);
            }
            
            // Convert to base64
            let base64;
            if (typeof window !== 'undefined' && window.btoa) {
              // Browser environment
              const bytes = Array.from(array).map(byte => String.fromCharCode(byte)).join('');
              base64 = window.btoa(bytes);
            } else {
              // Node.js environment
              base64 = Buffer.from(array).toString('base64');
            }
            
            setPdfSource(`data:application/pdf;base64,${base64}`);
            return;
          } catch (e) {
            console.error("Error converting binary data:", e);
            setError("Unable to display PDF: Error converting binary data");
            return;
          }
        }
        
        // Handle JSON data that might contain binary data as an array
        if (typeof content === 'object' && Array.isArray(content)) {
          try {
            const array = new Uint8Array(content);
            const bytes = Array.from(array).map(byte => String.fromCharCode(byte)).join('');
            const base64 = typeof window !== 'undefined' ? window.btoa(bytes) : Buffer.from(bytes).toString('base64');
            setPdfSource(`data:application/pdf;base64,${base64}`);
            return;
          } catch (e) {
            console.error("Error processing array data:", e);
            setError("Unable to display PDF: Error processing array data");
            return;
          }
        }
        
        // If it's a string that's not a URL, it might be base64 without the prefix
        if (typeof content === 'string') {
          try {
            // Test if it's valid base64
            const isBase64 = /^[A-Za-z0-9+/=]+$/.test(content.trim());
            if (isBase64) {
              setPdfSource(`data:application/pdf;base64,${content}`);
              return;
            } else {
              // If it's not valid base64 but it's a string, we'll show it as text
              // This handles cases where content-type doesn't match actual content
              console.log("Content is not valid base64, will display as text");
              setTextContent(content);
              setIsLoading(false);
              return;
            }
          } catch (e) {
            console.error("Invalid string content:", e);
            // Still display as text even if we have an error
            if (typeof content === 'string') {
              setTextContent(content);
              setIsLoading(false);
              return;
            }
            setError("Unable to display PDF: Invalid format");
            return;
          }
        }
        
        console.error("Unsupported content format:", typeof content, content);
        setError("Unable to display PDF: Unsupported format");
      } catch (err) {
        console.error("PDFViewer processing error:", err);
        // Last resort fallback - if content is a string, display it as text
        if (typeof content === 'string') {
          setTextContent(content);
          setIsLoading(false);
          return;
        }
        setError(`Unable to display PDF: ${err.message || 'Unknown error'}`);
      }
    };
    
    if (content) {
      processContent();
    } else {
      setError("No content provided");
    }
  }, [content]); // Only re-run when content changes
  
  // Format file size for display
  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return 'Unknown size';
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
    else return (bytes / 1073741824).toFixed(2) + ' GB';
  };
  
  // Get size from content if possible - using useMemo to avoid recalculation on each render
  const size = useMemo(() => {
    if (content instanceof ArrayBuffer) {
      return content.byteLength;
    } else if (content instanceof Uint8Array) {
      return content.byteLength;
    } else if (content && typeof content === 'object' && content.buffer instanceof ArrayBuffer) {
      return content.byteLength || content.length;
    } else if (Array.isArray(content)) {
      return content.length;
    } else if (typeof content === 'object' && content !== null && 
               content.type === 'Buffer' && Array.isArray(content.data)) {
      return content.data.length;
    } else if (typeof content === 'string') {
      // Check if it's a Buffer JSON string
      if (content.includes('"type":"Buffer"') && content.includes('"data":[')) {
        try {
          const bufferObj = JSON.parse(content);
          if (bufferObj && bufferObj.type === 'Buffer' && Array.isArray(bufferObj.data)) {
            return bufferObj.data.length;
          }
        } catch (e) {
          // Ignore parsing errors for size calculation
        }
      }
      
      // For base64 encoded data
      if (content.startsWith('data:')) {
        const base64Content = content.split(',')[1];
        return Math.ceil(base64Content.length * 0.75); // Approximate size
      }
      return new TextEncoder().encode(content).length;
    } 
    return null;
  }, [content]);
  
  // Display text content if we have it (fallback display)
  if (textContent) {
    return (
      <div className="flex flex-col h-full p-4 bg-gray-50 overflow-auto">
        <div className="text-amber-600 text-center mb-4">
          <div className="text-3xl mb-2">⚠️</div>
          <p className="font-medium">Content has application/pdf type but appears to be text</p>
          <p className="text-sm text-gray-600 mt-1">Displaying as text instead</p>
          {size && <p className="text-sm text-gray-600">Size: {formatFileSize(size)}</p>}
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-4 overflow-auto font-mono text-sm whitespace-pre-wrap">
          {textContent.length > 5000 
            ? textContent.substring(0, 5000) + '... (content truncated for display)'
            : textContent}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-50">
        <div className="text-red-500 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="font-medium">{error}</p>
          <p className="text-sm text-gray-600 mt-2">File type: PDF</p>
          {size && <p className="text-sm text-gray-600">Size: {formatFileSize(size)}</p>}
        </div>
      </div>
    );
  }
  
  if (!pdfSource) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-50">
        <div className="text-gray-500 text-center">
          <div className="text-5xl mb-4">📄</div>
          <p className="font-medium">Unable to display PDF</p>
          <p className="text-sm text-gray-600 mt-2">
            The provided content could not be converted to a viewable PDF.
          </p>
        </div>
      </div>
    );
  }
  
  // For security reasons, use object/embed tag for PDFs instead of an iframe
  return (
    <div className="flex flex-col h-full p-4 bg-gray-50 overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
          <div className="animate-pulse text-gray-500">Loading PDF...</div>
        </div>
      )}
      
      <div className="relative flex-grow w-full h-full overflow-hidden">
        <object
          className="w-full h-full"
          data={pdfSource}
          type="application/pdf"
          onLoad={() => setIsLoading(false)}
          onError={(e) => {
            console.error("PDF load error:", e);
            setIsLoading(false);
            setError("Failed to load PDF: Document may be corrupted");
          }}
        >
          <div className="flex flex-col items-center justify-center h-full bg-gray-100">
            <p className="text-gray-600">
              Your browser does not support inline PDF viewing. 
              <a href={pdfSource} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 hover:underline">
                Click here to download.
              </a>
            </p>
          </div>
        </object>
      </div>
      
      <div className="mt-2 text-sm text-gray-600 text-center">
        <p>PDF Document</p>
        {size && <p>Size: {formatFileSize(size)}</p>}
      </div>
    </div>
  );
};

export default PDFViewer;
