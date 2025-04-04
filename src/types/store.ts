import { store } from '../store';

// Get the RootState type from the store
export type RootState = ReturnType<typeof store.getState>;

// Get the AppDispatch type from the store
export type AppDispatch = typeof store.dispatch;
