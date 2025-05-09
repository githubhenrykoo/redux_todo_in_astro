// Kubernetes-specific replacement for TopBar.tsx that doesn't depend on authentik
import React, { useState, useEffect } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { store } from '../../store.js';
import { toggleTheme } from '../../features/themeSlice.js';

export const TopBar = ({ initialTheme = 'dark' }) => {
  const [theme, setTheme] = useState(initialTheme);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize with dark theme by default in Kubernetes
  useEffect(() => {
    setIsMounted(true);
    
    // If the theme is light, toggle it to dark
    if (theme === 'light') {
      store.dispatch(toggleTheme());
    }
    
    // Subscribe to theme changes
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      const themeState = state.theme || {};
      const currentTheme = themeState.mode || 'dark';
      
      if (currentTheme) {
        setTheme(currentTheme);
      }
    });
    
    return () => unsubscribe();
  }, [theme]);

  return (
    <div className="w-full h-14 bg-background border-b flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-foreground">Redux Todo App (K8s)</h1>
      </div>
      <div className="flex items-center space-x-4">
        {isMounted && (
          <button 
            onClick={() => store.dispatch(toggleTheme())}
            className="text-foreground hover:text-foreground/80"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <FiMoon className="w-6 h-6" />
            ) : (
              <FiSun className="w-6 h-6" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default TopBar;
