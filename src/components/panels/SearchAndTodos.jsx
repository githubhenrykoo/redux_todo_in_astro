import React from 'react';
import SearchTodo from '../SearchTodo';
import ToDos from '../ToDos';

const SearchAndTodos = () => {
  return (
    <div className="h-full pt-8 p-4">
      <SearchTodo />
      <ToDos />
    </div>
  );
};

export default SearchAndTodos;
