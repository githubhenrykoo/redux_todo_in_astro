import React from 'react';
import SearchTodo from '../SearchTodo';
import ToDos from '../ToDos';

const SearchAndTodos = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Fixed Search Section */}
      <div className="flex-shrink-0 p-4 border-b bg-white">
        <SearchTodo />
      </div>

      {/* Scrollable Todos Section */}
      <div className="flex-1 overflow-auto p-4">
        <ToDos />
      </div>
    </div>
  );
};

export default SearchAndTodos;
