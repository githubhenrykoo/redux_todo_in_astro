import React from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';

// Create a memoized selector
const selectPublishedMessages = createSelector(
  state => state.mqtt,
  mqtt => mqtt?.publishedMessages || []
);

const PublishedMessages = () => {
  // Use the memoized selector
  const publishedMessages = useSelector(selectPublishedMessages);
  
  return (
    <div className="bg-[#1f1f1f] rounded-lg p-4 mt-4">
      <h3 className="text-[#bb86fc] font-medium mb-2"></h3>
      {publishedMessages.length === 0 ? (
        <p className="text-gray-400 italic"></p>
      ) : (
        <div className="max-h-40 overflow-y-auto">
          <ul className="space-y-1">
            {publishedMessages.map((msg, index) => (
              <li key={index} className="text-sm border-b border-gray-700 pb-1">
                <span className="text-gray-400">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                <span className="text-[#03dac6] mx-2">{msg.topic}:</span>
                <span className="text-white">{msg.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PublishedMessages;