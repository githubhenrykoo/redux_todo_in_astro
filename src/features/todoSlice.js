import { createSlice, createSelector } from '@reduxjs/toolkit';

const initialState = {
    todos: [],
    searchQuery: '',
    selectedContent: null,
    actionHistory: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null
};

export const todoSlice = createSlice({
    name: 'todo',
    initialState,
    reducers: {
        addTodo: (state, action) => {
            const newTodo = {
                id: Date.now(),
                content: action.payload,
            };
            state.todos.push(newTodo);
            state.selectedContent = action.payload;
            state.actionHistory.push({
                id: Date.now(),
                type: 'ADD',
                content: action.payload,
                timestamp: new Date().toISOString()
            });
        },
        removeTodo: (state, action) => {
            const todoToRemove = state.todos.find(todo => todo.id === action.payload);
            if (todoToRemove) {
                state.actionHistory.push({
                    id: Date.now(),
                    type: 'REMOVE',
                    content: todoToRemove.content,
                    timestamp: new Date().toISOString()
                });
            }
            state.todos = state.todos.filter(todo => todo.id !== action.payload);
        },
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
        },
        selectTodo: (state, action) => {
            const todo = state.todos.find(t => t.id === action.payload);
            state.selectedContent = todo ? todo.content : null;
            if (todo) {
                state.actionHistory.push({
                    id: Date.now(),
                    type: 'SELECT',
                    content: todo.content,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
});

export const { addTodo, removeTodo, setSearchQuery, selectTodo } = todoSlice.actions;

// Base selectors with null checks and memoization
const selectTodoState = state => state?.todo;

export const selectTodos = createSelector(
    [selectTodoState],
    todoState => todoState?.todos ?? []
);

export const selectSearchQuery = createSelector(
    [selectTodoState],
    todoState => todoState?.searchQuery ?? ''
);

export const selectSelectedContent = createSelector(
    [selectTodoState],
    todoState => todoState?.selectedContent
);

export const selectActionHistory = createSelector(
    [selectTodoState],
    todoState => todoState?.actionHistory ?? []
);

export const selectStatus = createSelector(
    [selectTodoState],
    todoState => todoState?.status ?? 'idle'
);

export const selectError = createSelector(
    [selectTodoState],
    todoState => todoState?.error
);

// Memoized selector for filtered todos
export const selectFilteredTodos = createSelector(
    [selectTodos, selectSearchQuery],
    (todos, searchQuery) => {
        if (!searchQuery?.trim()) {
            return todos;
        }
        
        return todos.filter((todo) =>
            todo.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
);

export default todoSlice.reducer;