import { createSlice } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';

/**
 * @typedef {'light'|'dark'} ThemeMode
 * @typedef {Object} ThemeColors
 * @property {string} primary
 * @property {string} background
 * @property {string} text
 * @property {string} border
 * @property {string} hover
 */

// Initialize with system preference or fallback
const getInitialTheme = () => {
  // Check if we're in a browser environment
  const isClient = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  
  if (isClient) {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    
    if (window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
  }
  
  // Fallback to light theme if not in browser or no preferences found
  return 'light';
};

/** @type {{ mode: ThemeMode }} */
const initialState = {
  mode: getInitialTheme()
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    /**
     * Toggles between light/dark themes and updates CSS variables
     */
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      // Check if we're in a browser environment
      const isClient = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
      if (isClient) {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(state.mode);
        localStorage.setItem('theme', state.mode);
      }
    }
  }
});

// Memoized selectors
export const selectThemeMode = createSelector(
  [(state) => state.theme],
  (theme) => theme.mode
);

export const { toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;