import { configureStore } from '@reduxjs/toolkit';
import chatbotReducer from '../features/chatbotSlice';
import petriNetReducer from '../features/petriNetSlice';

export const store = configureStore({
  reducer: {
    chatbot: chatbotReducer,
    petriNet: petriNetReducer
  }
});