import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { store } from '../../store.js';
import { toggleTheme } from '../../features/themeSlice.js';

// Simple fallback TopBar that doesn't import authentik client
export const SafeTopBar = ({ initialTheme = 'light' }) => {
  const [theme, setTheme] = React.useState(initialTheme);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    
    // Set dark theme by default in Kubernetes
    // The toggleTheme action doesn't take parameters, it just toggles between light and dark
    // If currently light, this will switch to dark
    store.dispatch(toggleTheme());
    
    // Subscribe to theme changes
    const unsubscribe = store.subscribe(() => {
      // Add type safety for accessing store state
      const state = store.getState();
      const themeState = state.theme as { mode?: string } || {};
      const currentTheme = themeState.mode;
      
      if (currentTheme) {
        setTheme(currentTheme);
      }
    });
    
    return () => unsubscribe();
  }, []);

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

export default SafeTopBar;
