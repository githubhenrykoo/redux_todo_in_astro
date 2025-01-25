import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectActionHistory } from '../../features/todoSlice';
import { formatTimestamp, getActionText } from '../../utils/actionHelpers';

const ActionLogPanelReact = () => {
  const actionHistory = useSelector(selectActionHistory);
  const scrollRef = useRef(null);

  // Auto-scroll to the latest action when new actions are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [actionHistory]);

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 bg-white border-b">
        <h1 className="text-xl font-bold">Action History</h1>
      </div>

      {/* Scrollable Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-auto p-4"
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
                <p className="text-sm text-gray-600">{getActionText(action)}</p>
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
