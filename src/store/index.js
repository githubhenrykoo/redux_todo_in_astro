import { configureStore } from '@reduxjs/toolkit';
import todoReducer from './todoSlice';
import mqttReducer from './mqttSlice';

const store = configureStore({
  reducer: {
    todos: todoReducer,
    mqtt: mqttReducer,
  },
});

export default store;