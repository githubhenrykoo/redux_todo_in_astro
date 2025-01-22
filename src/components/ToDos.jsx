'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeTodo, selectFilteredTodos } from '../features/todo/todoSlice';
import { FiTrash2 } from 'react-icons/fi';

export default function ToDos() {
  const dispatch = useDispatch();
  const todos = useSelector(selectFilteredTodos);

  const handleRemove = (id) => {
    dispatch(removeTodo(id));
  };

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Your Todos</h2>
      {todos.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No todos found</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {todos.map((todo) => (
            <li 
              key={todo.id} 
              className="group flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                </div>
                <span className="text-gray-700">{todo.text}</span>
              </div>
              <button 
                onClick={() => handleRemove(todo.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
              >
                <span className="sr-only">Remove todo</span>
                <FiTrash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}