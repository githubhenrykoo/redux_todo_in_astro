import React, { useState, useEffect } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { store } from '../../store.js';
import { toggleTheme } from '../../features/themeSlice.js';

interface TopBarProps {
  initialTheme?: 'light' | 'dark';
}

export const NoAuthTopBar: React.FC<TopBarProps> = ({ initialTheme: initialPropTheme }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(initialPropTheme || 'dark');
  const [isClient, setIsClient] = useState(false);

  // Client-side only code
  useEffect(() => {
    setIsClient(true);
    
    // Subscribe to store for theme changes
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      const currentTheme = state.theme?.mode || 'dark';
      if (currentTheme && currentTheme !== theme) {
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
        {isClient && (
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

export default NoAuthTopBar;
