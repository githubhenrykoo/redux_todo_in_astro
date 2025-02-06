'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeTodo, selectFilteredTodos, selectTodo } from '../features/todoSlice';
import { FiTrash2 } from 'react-icons/fi';
import { 
  FiFile, 
  FiFileText, 
  FiImage, 
  FiCode 
} from 'react-icons/fi';
import { ContentTypeInterpreter } from '../utils/content_type_detector';

const contentInterpreter = new ContentTypeInterpreter();

const getContentIcon = (content) => {
  const { mimeType } = contentInterpreter.detectContentType(content);
  
  switch (mimeType) {
    case 'text/plain':
      return <FiFileText className="w-5 h-5 text-muted-foreground" />;
    case 'application/json':
      return <FiCode className="w-5 h-5 text-primary" />;
    case 'image/jpeg':
    case 'image/png':
    case 'image/webp':
    case 'image/gif':
      return <FiImage className="w-5 h-5 text-accent" />;
    default:
      return <FiFile className="w-5 h-5 text-muted-foreground/70" />;
  }
};

export default function ToDos() {
  const dispatch = useDispatch();
  const todos = useSelector(selectFilteredTodos);

  const handleRemove = (id) => {
    dispatch(removeTodo(id));
  };

  const handleSelect = (id) => {
    dispatch(selectTodo(id));
  };

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4 text-foreground">Item Collection</h2>
      {!todos || todos.length === 0 ? (
        <div className="text-center py-8 bg-muted rounded-lg">
          <p className="text-muted-foreground">No todos found</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {todos.map((todo) => (
            <li 
              key={todo.id} 
              className="group flex items-center justify-between p-4 bg-card border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => handleSelect(todo.id)}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getContentIcon(todo.content)}
                </div>
                <span className="text-card-foreground">{todo.content}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(todo.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-destructive text-destructive-foreground px-2 py-1 rounded-md hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-opacity-50"
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