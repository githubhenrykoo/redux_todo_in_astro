'use client';

import React from 'react';
import { Provider } from 'react-redux';
import store from '../store';
import AddTodo from './AddTodo';
import ToDos from './ToDos';
import SearchTodo from './SearchTodo';

export default function TodoWrapper() {
  return (
    <Provider store={store}>
      <div className="todo-app">
        <AddTodo />
        <SearchTodo />
        <ToDos />
      </div>
    </Provider>
  );
}
