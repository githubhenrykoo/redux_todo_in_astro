'use client';

import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { addTodo } from '../features/todoSlice'
import ContentDetailView from './ui/placeholder/ContentDetailView';

export default function AddTodo() {
  const [input, setInput] = useState('')
  const dispatch = useDispatch()

  const addTodoHandler = (e) => {
    e.preventDefault()
    if (input.trim()) {
      dispatch(addTodo(input))
      setInput('')
    }
  }

  return (
    <>
    <form onSubmit={addTodoHandler} className="mb-6">
      <label htmlFor="add-todo" className="block text-sm font-medium text-gray-700 mb-2">
        Add New Item
      </label>
      <div className="flex gap-2">
        <input
          id="add-todo"
          type="text" 
          value={input}  
          onChange={(e) => setInput(e.target.value)} 
          placeholder="What needs to be done?"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
        >
          Add
        </button>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Press Enter or click Add to create a new item...
      </p>
    </form>

    <ContentDetailView />
    </>
  )
}