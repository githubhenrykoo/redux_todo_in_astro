import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectActionHistory } from '../../features/todoSlice';
import { selectThemeMode } from '../../features/themeSlice';
import { formatTimestamp, getActionText } from '../../utils/actionHelpers';
import { FiFile, FiFileText, FiImage, FiCode } from 'react-icons/fi';
import { ContentTypeInterpreter } from '../../utils/content_type_detector';
import { cn } from '../../utils/cn';

const contentInterpreter = new ContentTypeInterpreter();

const getContentIcon = (content) => {
  const { mimeType } = contentInterpreter.detectContentType(content);
  
  switch (mimeType) {
    case 'text/plain':
      return <FiFileText className="w-5 h-5 text-gray-600" />;
    case 'application/json':
      return <FiCode className="w-5 h-5 text-blue-600" />;
    case 'image/jpeg':
    case 'image/png':
    case 'image/webp':
    case 'image/gif':
      return <FiImage className="w-5 h-5 text-green-600" />;
    default:
      return <FiFile className="w-5 h-5 text-gray-400" />;
  }
};

const ActionLogPanelReact = () => {
  const actionHistory = useSelector(selectActionHistory);
  const themeMode = useSelector(selectThemeMode);
  const [isDark, setIsDark] = useState(themeMode === 'dark');
  const scrollRef = useRef(null);

  // Ensure consistent theme state
  useEffect(() => {
    setIsDark(themeMode === 'dark');
  }, [themeMode]);

  // Auto-scroll to the latest action when new actions are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [actionHistory]);

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className={cn(
        "flex-shrink-0 p-4 border-b",
        isDark 
          ? "bg-neutral-900 text-white border-neutral-800" 
          : "bg-white text-neutral-900 border-neutral-200"
      )}>
        <h1 className="text-xl font-bold">Action History</h1>
      </div>

      {/* Scrollable Content */}
      <div 
        ref={scrollRef}
        className={cn(
          "flex-1 overflow-auto p-4",
          isDark ? "bg-neutral-900" : "bg-white"
        )}
      >
        <div className="space-y-2">
          {actionHistory.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[100px]">
              <p className="text-gray-500">No actions recorded yet</p>
            </div>
          ) : (
            actionHistory.slice().reverse().map((action) => (
              <div 
                key={action.id} 
                className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  {getContentIcon(action.content)}
                  <p className="text-sm text-gray-600">{getActionText(action)}</p>
                </div>
                <time className="text-xs text-gray-400 mt-1 block">
                  {formatTimestamp(action.timestamp)}
                </time>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionLogPanelReact;
