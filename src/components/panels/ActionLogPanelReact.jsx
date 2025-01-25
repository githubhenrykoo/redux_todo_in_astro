import React from 'react';
import { useSelector } from 'react-redux';
import { selectActionHistory } from '../../features/todoSlice';
import { formatTimestamp, getActionText } from '../../utils/actionHelpers';

const ActionLogPanelReact = () => {
  const actionHistory = useSelector(selectActionHistory);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Action History</h1>
      <div className="space-y-2">
        {actionHistory.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">No actions recorded yet</p>
          </div>
        ) : (
          actionHistory.slice().reverse().map((action) => (
            <div key={action.id} className="p-2 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">{getActionText(action)}</p>
              <time className="text-xs text-gray-400">{formatTimestamp(action.timestamp)}</time>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActionLogPanelReact;
