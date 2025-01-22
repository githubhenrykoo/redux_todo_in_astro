'use client';

import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { addTodo } from '../features/todo/todoSlice'

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
    <form onSubmit={addTodoHandler} className="mb-4">
      <input type="text" 
             value={input}  
             onChange={(e) => setInput(e.target.value)} 
             placeholder="Add a new todo"
             className="border p-2 mr-2 rounded"
      />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        Add Todo
      </button>
    </form>
  )
}