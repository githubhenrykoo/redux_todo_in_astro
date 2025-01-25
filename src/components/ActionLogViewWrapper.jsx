import React from 'react';
import { useSelector } from 'react-redux';
import { selectActionHistory } from '../features/todoSlice';

const ActionLogViewWrapper = () => {
  const actionHistory = useSelector(selectActionHistory);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getActionText = (action) => {
    switch (action.type) {
      case 'ADD':
        return `Added item: "${action.content}"`;
      case 'REMOVE':
        return `Removed item: "${action.content}"`;
      case 'SELECT':
        return `Selected item: "${action.content}"`;
      default:
        return `Unknown action on: "${action.content}"`;
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Action History in wrapper</h1>
      <div className="space-y-2">
        {actionHistory.slice().reverse().map((action) => (
          <div key={action.id} className="p-2 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">{getActionText(action)}</p>
            <time className="text-xs text-gray-400">{formatTimestamp(action.timestamp)}</time>
          </div>
        ))}
        {actionHistory.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500">No actions recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionLogViewWrapper;
