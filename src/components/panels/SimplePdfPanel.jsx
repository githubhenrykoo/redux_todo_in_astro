import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Define available PDF files
const PDF_FILES = [
  { name: 'AI Toba', path: '/data/AI-Toba.pdf' },
  { name: 'AI Toba (New)', path: '/data/AI-Toba-new.pdf' },
  { name: 'The Age of Intelligence', path: '/data/The_Age_of_Intelligence-Indonesia.pdf' }
];

const SimplePdfPanel = ({ pdfPath: initialPdfPath }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // Set to false initially when no PDF is selected
  const [useNativeViewer, setUseNativeViewer] = useState(false);
  // Only use initialPdfPath if provided, otherwise null to show selection prompt
  const [currentPdf, setCurrentPdf] = useState(initialPdfPath || null);
  const canvasRef = useRef(null);
  
  // Construct the full URL for the PDF
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Log initial props and state for debugging
  useEffect(() => {
    console.log('SimplePdfPanel initialized with:', { 
      initialPdfPath, 
      currentPdf,
      pdfFiles: PDF_FILES
    });
  }, []);

  // For proper URL encoding of paths with spaces
  const encodePath = (path) => {
    // Split the path into directory and filename
    const lastSlashIndex = path.lastIndexOf('/');
    const directory = path.substring(0, lastSlashIndex + 1);
    const filename = path.substring(lastSlashIndex + 1);
    
    // Encode only the filename part to handle spaces and special characters
    return directory + encodeURIComponent(filename);
  };
  
  // Handle different path formats to ensure the PDF loads correctly
  let fullPdfUrl;
  if (currentPdf && currentPdf.startsWith('/data/')) {
    // For PDFs in the data directory (served at root path as per Vite's convention)
    fullPdfUrl = `${baseUrl}${currentPdf}`;
    console.log('Loading PDF from data directory:');
    console.log('- Path:', currentPdf);
    console.log('- Full URL:', fullPdfUrl);
  } else if (currentPdf && currentPdf.startsWith('/')) {
    fullPdfUrl = `${baseUrl}${currentPdf}`;
    console.log('Loading PDF from root path:', fullPdfUrl);
  } else if (currentPdf) {
    fullPdfUrl = currentPdf;
    console.log('Using direct URL:', fullPdfUrl);
  } else {
    // Fallback to default PDF if currentPdf is somehow undefined
    const defaultPdf = PDF_FILES[2].path;
    fullPdfUrl = `${baseUrl}${defaultPdf}`;
    console.log('Using fallback PDF path:', fullPdfUrl);
  }
  
  const loadAndRenderPdf = async () => {
    // Don't try to load if no PDF is selected
    if (!currentPdf) {
      console.log('No PDF selected, skipping load');
      setLoading(false);
      return;
    }
    
    try {
      console.log('PDF.js version:', pdfjsLib.version);
      
      // Configure worker
      const workerSrc = '/assets/pdf.worker.js';
      console.log('Using worker source:', workerSrc);
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
      
      console.log('Loading PDF from URL:', fullPdfUrl);
      
      // Fetch the PDF directly first to verify it's accessible
      try {
        const response = await fetch(fullPdfUrl);
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        console.log('PDF fetch response:', response.status, response.statusText);
        const pdfBlob = await response.blob();
        console.log('PDF blob size:', pdfBlob.size, 'bytes');
        
        // Load as ArrayBuffer for PDF.js
        const arrayBuffer = await pdfBlob.arrayBuffer();
        
        // Load the PDF with PDF.js
        console.log('Loading PDF.js document from ArrayBuffer');
        const loadingTask = pdfjsLib.getDocument(arrayBuffer);
        const pdf = await loadingTask.promise;
        console.log('PDF loaded successfully', pdf.numPages, 'pages');
        
        // Get the first page
        const page = await pdf.getPage(1);
        console.log('Page loaded');
        
        // Prepare canvas
        const canvas = canvasRef.current;
        if (!canvas) {
          console.error('Canvas reference is null');
          console.log('Canvas not yet available, will try native viewer');
          setUseNativeViewer(true);
          setLoading(false);
          return; // Exit early without throwing
        }
        
        const context = canvas.getContext('2d');
        const viewport = page.getViewport({ scale: 1.5 });
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render to canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        console.log('Page rendered successfully');
        setLoading(false);
      } catch (fetchErr) {
        console.error('Error fetching PDF:', fetchErr);
        throw new Error(`Failed to fetch PDF: ${fetchErr.message}`);
      }
    } catch (err) {
      console.error('PDF loading/rendering error:', err);
      setError(err.message || 'Failed to load PDF');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset error state when changing PDFs
    setError(null);
    setLoading(true);
    
    // Only run PDF.js if we're not using the native viewer
    if (useNativeViewer) {
      setLoading(false);
      return;
    }
    
    // Set a small delay to ensure the canvas element is rendered
    const timeoutId = setTimeout(() => {
      loadAndRenderPdf();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [currentPdf, useNativeViewer, fullPdfUrl]);

  
  return (
    <div className="pdf-viewer-container h-full flex flex-col bg-gray-100">
      {/* Header with controls */}
      <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
        <div>
          <h3 className="font-medium">PDF Viewer</h3>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            className={`px-3 py-1 rounded-md ${useNativeViewer ? 'bg-gray-600' : 'bg-blue-600'}`} 
            onClick={() => setUseNativeViewer(false)}
          >
            PDF.js
          </button>
          <button 
            className={`px-3 py-1 rounded-md ${useNativeViewer ? 'bg-blue-600' : 'bg-gray-600'}`} 
            onClick={() => setUseNativeViewer(true)}
          >
            Native
          </button>
        </div>
      </div>
      
      {/* PDF Navigation Bar */}
      <div className="bg-gray-700 text-white p-2 flex flex-wrap justify-center items-center gap-2">
        {PDF_FILES.map((pdf) => (
          <button
            key={pdf.path}
            onClick={() => setCurrentPdf(pdf.path)}
            className={`px-3 py-2 rounded-md text-sm transition-all ${currentPdf === pdf.path
              ? 'bg-blue-600 text-white font-medium'
              : 'bg-gray-600 hover:bg-gray-500'}`}
          >
            {pdf.name}
          </button>
        ))}
      </div>
      
      {/* Content area */}
      <div className="flex-1 overflow-auto">
        {/* PDF Selection Prompt - shown when no PDF is selected */}
        {!currentPdf && !error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 max-w-md bg-white rounded-lg shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="text-xl font-bold mb-2 text-gray-800">Select a PDF Document</h2>
              <p className="text-gray-600 mb-6">Please choose a PDF document from the navigation bar above to view its contents.</p>
              
              <div className="grid grid-cols-1 gap-3">
                {PDF_FILES.map((pdf) => (
                  <button
                    key={pdf.path}
                    onClick={() => setCurrentPdf(pdf.path)}
                    className="px-4 py-3 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {pdf.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Loading state */}
        {loading && !error && !useNativeViewer && currentPdf && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-700">Loading PDF...</p>
            </div>
          </div>
        )}
        
        {/* Error state */}
        {error && !useNativeViewer && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-red-600 p-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium">Failed to load PDF</p>
              <p className="text-sm mt-2">{error}</p>
              <button 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
              <button 
                className="mt-4 ml-4 px-4 py-2 bg-green-600 text-white rounded-md"
                onClick={() => setUseNativeViewer(true)}
              >
                Try Native Viewer
              </button>
            </div>
          </div>
        )}
        
        {/* PDF.js canvas */}
        {!loading && !error && !useNativeViewer && (
          <div className="flex justify-center p-4">
            <canvas ref={canvasRef} className="shadow-lg" />
          </div>
        )}
        
        {/* Native browser PDF viewer */}
        {useNativeViewer && (
          <div className="w-full h-full flex items-center justify-center">
            <iframe 
              src={fullPdfUrl} 
              title="PDF Viewer" 
              className="w-full h-full" 
              style={{ minHeight: '80vh' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SimplePdfPanel;
