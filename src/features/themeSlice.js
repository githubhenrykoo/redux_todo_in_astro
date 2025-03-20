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

// Safe localStorage wrapper for cross-environment compatibility
const safeLocalStorage = {
  getItem: (key) => {
    // Check if localStorage is available in the current environment
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key, value) => {
    // Check if localStorage is available in the current environment
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  }
};

// Initialize with system preference or fallback
const getInitialTheme = () => {
  // First, check for saved theme in localStorage
  const saved = safeLocalStorage.getItem('theme');
  if (saved) return saved;
  
  // Check if window and matchMedia exist before calling
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  // Fallback to light theme if no window or matchMedia
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
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(state.mode);
        safeLocalStorage.setItem('theme', state.mode);
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