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
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/** @type {{ mode: ThemeMode, colors: { [key in ThemeMode]: ThemeColors } }} */
const initialState = {
  mode: getInitialTheme(),
  colors: {
    light: {
      primary: '#2563eb',
      background: '#f8fafc',
      text: '#1e293b',
      border: '#e2e8f0',
      hover: '#f1f5f9'
    },
    dark: {
      primary: '#3b82f6',
      background: '#0f172a',
      text: '#f8fafc',
      border: '#1e293b',
      hover: '#1e40af'
    }
  }
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
      updateCSSVariables(state.colors[state.mode], state.mode);
      localStorage.setItem('theme', state.mode);
    }
  }
});

// Update root CSS variables when theme changes
const updateCSSVariables = (colors, mode) => {
  if (typeof document === 'undefined') return;
  
  // Update the HTML class for Tailwind/shadcn theme
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(mode);
  
  // Update CSS variables for custom colors
  Object.entries(colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${key}`, value);
  });
};

// Memoized selectors
export const selectThemeMode = createSelector(
  [(state) => state.theme],
  (theme) => theme.mode
);

export const selectThemeColors = createSelector(
  [(state) => state.theme],
  (theme) => theme.colors[theme.mode]
);

export const { toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;