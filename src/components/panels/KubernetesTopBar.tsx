import React, { useState, useEffect } from 'react';
import { FiSun, FiMoon, FiSave } from 'react-icons/fi';
// Add proper file extensions for TypeScript imports
import { store } from '../../store.js';
import { toggleTheme } from '../../features/themeSlice.js';

interface TopBarProps {
  initialTheme?: 'light' | 'dark';
}

// Kubernetes-friendly version of TopBar that doesn't import authentik client
export const KubernetesTopBar: React.FC<TopBarProps> = ({ initialTheme: initialPropTheme }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(initialPropTheme || 'light');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    
    // Get current theme from Redux store
    const unsubscribe = store.subscribe(() => {
      const currentTheme = store.getState().theme.value;
      setTheme(currentTheme);
    });
    
    return () => unsubscribe();
  }, []);

  // Format the last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return 'Never saved';
    
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    
    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
      return lastSaved.toLocaleTimeString();
    }
  };

  return (
    <div className="w-full h-14 bg-background border-b flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-foreground">Redux Todo App (K8s)</h1>
        {isClient && lastSaved && (
          <span className="text-xs text-gray-500">
            Last saved: {formatLastSaved()}
          </span>
        )}
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

export default KubernetesTopBar;
