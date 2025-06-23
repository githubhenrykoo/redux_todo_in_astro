import React, { useState, useRef, useEffect, Suspense } from 'react';
import ErrorBoundary from '../ErrorBoundary.jsx';

// Import panel components with explicit error handling
import GoogleDocsPanel from '../panels/googledocs.jsx';
import ChatbotPanel from '../panels/chatbot.jsx';

const ProductivityHub = () => {
  // State for horizontal split (left vs right column)
  const [horizontalSplit, setHorizontalSplit] = useState(50); // percentage
  
  // Refs for resize handling
  const horizontalDragRef = useRef(null);
  
  // Dragging state
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  
  // Handle horizontal resize (left/right columns)
  const startHorizontalDrag = (e) => {
    e.preventDefault();
    setIsDraggingHorizontal(true);
  };
  
  // Mouse move handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingHorizontal) {
        const container = horizontalDragRef.current.parentElement;
        const containerRect = container.getBoundingClientRect();
        const newSplit = Math.min(Math.max(((e.clientX - containerRect.left) / containerRect.width) * 100, 20), 80);
        setHorizontalSplit(newSplit);
      }
    };
    
    const handleMouseUp = () => {
      setIsDraggingHorizontal(false);
    };
    
    if (isDraggingHorizontal) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingHorizontal]);
  
  return (
    <div className="flex flex-1 h-full bg-white overflow-hidden" style={{ maxHeight: 'calc(100vh - 57px)' }}>
      {/* Main content area with resizable panels */}
      <div className="flex flex-1 h-full relative">
        {/* Left column: Google Docs */}
        <div 
          className="h-full border-r border-gray-200 overflow-hidden" 
          style={{ width: `${horizontalSplit}%`, maxHeight: '100%' }}
        >
          <div className="h-full overflow-auto max-h-full">
            <Suspense fallback={<div className="p-4 text-center">Loading Google Docs...</div>}>
              <ErrorBoundary fallback={<div className="p-4 text-center">Something went wrong loading Google Docs</div>}>
                <GoogleDocsPanel className="h-full" />
              </ErrorBoundary>
            </Suspense>
          </div>
        </div>
        
        {/* Horizontal resizer for left/right split */}
        <div 
          ref={horizontalDragRef}
          className={`absolute w-1 bg-gray-200 hover:bg-blue-400 cursor-ew-resize h-full z-10 ${isDraggingHorizontal ? 'bg-blue-500' : ''}`}
          style={{ left: `${horizontalSplit}%`, transform: 'translateX(-50%)' }}
          onMouseDown={startHorizontalDrag}
        ></div>
        
        {/* Right column: Chat panel */}
        <div 
          className="h-full overflow-hidden" 
          style={{ width: `${100 - horizontalSplit}%`, maxHeight: '100%' }}
        >
          <div className="h-full overflow-auto max-h-full">
            <Suspense fallback={<div className="p-4 text-center">Loading Chatbot...</div>}>
              <ErrorBoundary fallback={<div className="p-4 text-center">Something went wrong loading the Chatbot</div>}>
                <ChatbotPanel className="h-full" />
              </ErrorBoundary>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityHub;
