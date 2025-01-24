import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    todos: [],
    searchQuery: '',
    selectedContent: null,
};

export const todoSlice = createSlice({
    name: 'todo',
    initialState,
    reducers: {
        addTodo: (state, action) => {
            state.todos.push({
                id: Date.now(),
                content: action.payload,
            });
            state.selectedContent = action.payload; // Assign the payload to selectedContent    
        },
        removeTodo: (state, action) => {
            state.todos = state.todos.filter(todo => 
                todo.id !== action.payload
            );
        },
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
        },
        selectTodo: (state, action) => {
            const todo = state.todos.find(todo => todo.id === action.payload);
            if (todo) {
                state.selectedContent = todo.content;
            }
        },
    }
});

export const { addTodo, removeTodo, setSearchQuery, selectTodo } = todoSlice.actions;

// Base selectors with null checks
export const selectTodos = state => state?.todo?.todos ?? [];
export const selectSearchQuery = state => state?.todo?.searchQuery ?? '';
export const selectSelectedContent = (state) => state?.todo?.selectedContent;

// Memoized selector for filtered todos
export const selectFilteredTodos = state => {
    const todos = selectTodos(state);
    const searchQuery = selectSearchQuery(state);
    
    if (!searchQuery?.trim()) {
        return todos;
    }
    
    return todos.filter((todo) =>
        todo.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
};

export default todoSlice.reducer;