import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Don't set the worker source yet - we'll do it inside the component to ensure it's properly loaded

const PdfPanel = ({ pdfPath }) => {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pdfDocRef = useRef(null);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        // Set the worker source first
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          // Try to use a local worker file from the public directory
          const workerSrc = '/assets/pdf.worker.js';
          console.log('Setting PDF.js worker source to:', workerSrc);
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
        }
        
        setLoading(true);
        const baseUrl = window.location.origin;
        const pdfUrl = pdfPath.startsWith('/') 
          ? `${baseUrl}${pdfPath}` 
          : pdfPath;
          
        console.log('Loading PDF from:', pdfUrl);
        
        // Create the loading task after worker is configured
        console.log('PDF.js version:', pdfjsLib.version);
        console.log('Creating loading task for PDF document...');
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          withCredentials: true,
          cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
          cMapPacked: true,
        });
        
        console.log('Waiting for PDF document to load...');
        const pdfDoc = await loadingTask.promise;
        console.log('PDF document loaded successfully with', pdfDoc.numPages, 'pages');
        pdfDocRef.current = pdfDoc;
        
        setNumPages(pdfDoc.numPages);
        setLoading(false);
        
        // Render the first page
        renderPage(1);
      } catch (err) {
        console.error('Error loading PDF:', err);
        console.error('Error details:', err.stack || 'No stack trace available');
        setError(`Failed to load PDF document: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    };

    loadPDF();
    
    // Cleanup
    return () => {
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
      }
    };
  }, [pdfPath]);

  const renderPage = async (pageNum) => {
    if (!pdfDocRef.current) return;
    
    try {
      // Get the page
      const page = await pdfDocRef.current.getPage(pageNum);
      
      // Get the canvas element
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Calculate viewport for the canvas
      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Render the PDF page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      
      await page.render(renderContext).promise;
    } catch (err) {
      console.error('Error rendering page:', err);
      setError('Failed to render page. Please try again.');
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      renderPage(newPage);
    }
  };

  const goToNextPage = () => {
    if (currentPage < numPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      renderPage(newPage);
    }
  };

  const zoomIn = () => {
    setScale(prevScale => {
      const newScale = Math.min(prevScale + 0.2, 3);
      renderPage(currentPage);
      return newScale;
    });
  };

  const zoomOut = () => {
    setScale(prevScale => {
      const newScale = Math.max(prevScale - 0.2, 0.5);
      renderPage(currentPage);
      return newScale;
    });
  };

  return (
    <div className="flex flex-col h-full" ref={containerRef}>
      {/* Controls */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div className="flex space-x-4">
          <button 
            className="px-3 py-1 bg-blue-600 rounded-md disabled:bg-gray-600" 
            onClick={goToPreviousPage} 
            disabled={currentPage <= 1}
          >
            Previous
          </button>
          <button 
            className="px-3 py-1 bg-blue-600 rounded-md disabled:bg-gray-600" 
            onClick={goToNextPage} 
            disabled={currentPage >= numPages}
          >
            Next
          </button>
        </div>
        <div className="text-center">
          {!loading && numPages && (
            <span>
              Page {currentPage} of {numPages}
            </span>
          )}
        </div>
        <div className="flex space-x-4">
          <button 
            className="px-3 py-1 bg-blue-600 rounded-md"
            onClick={zoomOut}
          >
            Zoom -
          </button>
          <button 
            className="px-3 py-1 bg-blue-600 rounded-md"
            onClick={zoomIn}
          >
            Zoom +
          </button>
        </div>
      </div>
      
      {/* PDF Display */}
      <div className="flex-1 overflow-auto flex justify-center p-4 bg-gray-100">
        {loading ? (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-800">Loading PDF...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-center text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium">{error}</p>
              <button
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <canvas ref={canvasRef} className="shadow-lg"></canvas>
        )}
      </div>
    </div>
  );
};

export default PdfPanel;
