'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeTodo } from '../features/todo/todoSlice';

export default function ToDos() {
  const dispatch = useDispatch();
  const todos = useSelector((state) => state.todo.todos);

  const handleRemove = (id) => {
    dispatch(removeTodo(id));
  };

  return (
    <div className="mt-4">
      <h2 className="text-xl font-bold mb-2">To-Do List</h2>
      {todos.length === 0 ? (
        <p className="text-gray-500">No todos yet. Add one above!</p>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li key={todo.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
              <span>{todo.text}</span>
              <button 
                onClick={() => handleRemove(todo.id)} 
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}