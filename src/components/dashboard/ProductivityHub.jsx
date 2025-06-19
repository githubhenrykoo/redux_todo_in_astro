import React, { useState, useRef, useEffect } from 'react';
import GoogleCalendar from '../panels/googlecalendar.jsx';
import NotionPanel from '../panels/notion.jsx';
import ChatbotPanel from '../panels/chatbot.jsx';

const ProductivityHub = () => {
  // State for horizontal split (left vs right column)
  const [horizontalSplit, setHorizontalSplit] = useState(50); // percentage
  // State for vertical split (top vs bottom in left column)
  const [verticalSplit, setVerticalSplit] = useState(50); // percentage
  
  // Refs for resize handling
  const horizontalDragRef = useRef(null);
  const verticalDragRef = useRef(null);
  
  // Dragging state
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  
  // Handle horizontal resize (left/right columns)
  const startHorizontalDrag = (e) => {
    e.preventDefault();
    setIsDraggingHorizontal(true);
  };
  
  // Handle vertical resize (top/bottom in left column)
  const startVerticalDrag = (e) => {
    e.preventDefault();
    setIsDraggingVertical(true);
  };
  
  // Mouse move handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingHorizontal) {
        const container = horizontalDragRef.current.parentElement;
        const containerRect = container.getBoundingClientRect();
        const newSplit = Math.min(Math.max(((e.clientX - containerRect.left) / containerRect.width) * 100, 20), 80);
        setHorizontalSplit(newSplit);
      } else if (isDraggingVertical) {
        const container = verticalDragRef.current.parentElement;
        const containerRect = container.getBoundingClientRect();
        const newSplit = Math.min(Math.max(((e.clientY - containerRect.top) / containerRect.height) * 100, 20), 80);
        setVerticalSplit(newSplit);
      }
    };
    
    const handleMouseUp = () => {
      setIsDraggingHorizontal(false);
      setIsDraggingVertical(false);
    };
    
    if (isDraggingHorizontal || isDraggingVertical) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingHorizontal, isDraggingVertical]);
  
  return (
    <div className="flex flex-1 h-full bg-white overflow-hidden">
      {/* Main content area with resizable panels */}
      <div className="flex flex-1 h-full relative">
        {/* Left column divided into top and bottom */}
        <div 
          className="flex flex-col h-full border-r border-gray-200 overflow-hidden" 
          style={{ width: `${horizontalSplit}%` }}
        >
          {/* Top left: Google Calendar */}
          <div 
            className="overflow-auto border-b border-gray-200 relative" 
            style={{ height: `${verticalSplit}%` }}
          >
            <GoogleCalendar className="h-full" />
          </div>
          
          {/* Vertical resizer for top/bottom split */}
          <div 
            ref={verticalDragRef}
            className={`absolute h-1 bg-gray-200 hover:bg-blue-400 cursor-ns-resize z-10 ${isDraggingVertical ? 'bg-blue-500' : ''}`} 
            style={{ 
              top: `${verticalSplit}%`, 
              transform: 'translateY(-50%)',
              width: `${horizontalSplit}%`,
              left: 0
            }}
            onMouseDown={startVerticalDrag}
          ></div>
          
          {/* Bottom left: Notion Panel */}
          <div className="flex-1 overflow-auto">
            <NotionPanel className="h-full" />
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
          style={{ width: `${100 - horizontalSplit}%` }}
        >
          <div className="h-full overflow-auto">
            <ChatbotPanel className="h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityHub;
