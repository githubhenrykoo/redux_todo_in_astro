import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

const SimplePdfPanel = ({ pdfPath }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useNativeViewer, setUseNativeViewer] = useState(false);
  const canvasRef = useRef(null);
  
  // Construct the full URL for the PDF
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Handle different path formats to ensure the PDF loads correctly
  let fullPdfUrl;
  if (pdfPath.startsWith('/data/')) {
    // Correctly handle paths under /data
    fullPdfUrl = `${baseUrl}/public${pdfPath}`;
    console.log('Converted PDF path:', pdfPath, 'to', fullPdfUrl);
  } else if (pdfPath.startsWith('/')) {
    fullPdfUrl = `${baseUrl}${pdfPath}`;
  } else {
    fullPdfUrl = pdfPath;
  }
  
  const loadAndRenderPdf = async () => {
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
  }, [pdfPath, useNativeViewer, fullPdfUrl]);

  
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
      
      {/* Content area */}
      <div className="flex-1 overflow-auto">
        {/* Loading state */}
        {loading && !error && !useNativeViewer && (
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
