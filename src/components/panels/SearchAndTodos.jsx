import React from 'react';
import SearchTodo from '../SearchTodo';
import ToDos from '../ToDos';

const SearchAndTodos = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Fixed Search Section */}
      <div className="flex-shrink-0 p-4 border-b border-neutral-200 dark:border-neutral-800 bg-background">
        <SearchTodo />
      </div>

      {/* Scrollable Todos Section */}
      <div className="flex-1 overflow-auto p-4 bg-background">
        <ToDos />
      </div>
    </div>
  );
};

export default SearchAndTodos;
