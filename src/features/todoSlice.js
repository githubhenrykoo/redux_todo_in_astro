import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    todos: [],
    searchQuery: '',
};

export const todoSlice = createSlice({
    name: 'todo',
    initialState,
    reducers: {
        addTodo: (state, action) => {
            state.todos.push({
                id: Date.now(),
                text: action.payload,
            });
        },
        removeTodo: (state, action) => {
            state.todos = state.todos.filter(todo => 
                todo.id !== action.payload
            );
        },
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
        }
    }
});

export const { addTodo, removeTodo, setSearchQuery } = todoSlice.actions;

// Base selectors with null checks
export const selectTodos = state => state?.todo?.todos ?? [];
export const selectSearchQuery = state => state?.todo?.searchQuery ?? '';

// Memoized selector for filtered todos
export const selectFilteredTodos = state => {
    const todos = selectTodos(state);
    const searchQuery = selectSearchQuery(state);
    
    if (!searchQuery?.trim()) {
        return todos;
    }
    
    return todos.filter((todo) =>
        todo.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
};

export default todoSlice.reducer;