'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addTodo } from '../../features/todoSlice.js';
import { addContent } from '../../features/contentSlice.js';

export default function ItemDetailPanel() {
  const [message, setMessage] = useState('');
  const selectedTodoContent = useSelector(state => state.todo.selectedContent);
  const selectedContentItem = useSelector(state => 
    state.content.selectedId ? state.content.items[state.content.selectedId] : null
  );
  const dispatch = useDispatch();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      dispatch(addTodo(message));
      dispatch(addContent(message));
      setMessage('');
    }
  };

  const displayContent = selectedTodoContent || (selectedContentItem?.content) || '';

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 py-2 bg-gray-100 border-b">
        <h2 className="text-lg font-semibold text-gray-700">Chat</h2>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        {displayContent && (
          <div className="message-bubble received">
            {displayContent}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex-shrink-0 p-4 bg-white border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </div>
      </form>

      <style>{`
        .message-bubble {
          max-width: 80%;
          padding: 12px 16px;
          margin: 8px 0;
          border-radius: 16px;
          word-wrap: break-word;
        }

        .received {
          background-color: white;
          border: 1px solid #e5e7eb;
          align-self: flex-start;
          border-bottom-left-radius: 4px;
        }

        .sent {
          background-color: #3b82f6;
          color: white;
          align-self: flex-end;
          border-bottom-right-radius: 4px;
        }
      `}</style>
    </div>
  );
}