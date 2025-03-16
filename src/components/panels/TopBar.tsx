import React, { useState, useEffect, useCallback } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { store } from '../../store';
import { toggleTheme } from '../../features/themeSlice';
import { createClient } from '../../lib/authentik/client';

export const TopBar: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return store.getState().theme?.mode || 'light';
    }
    return 'light';
  });
  const [loading, setLoading] = useState(false);
  const [redirectUri, setRedirectUri] = useState('');

  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const path = '/callback'; // Ensure this matches your Authentik redirect configuration
      setRedirectUri(`${origin}${path}`);
    }
  }, []);

  useEffect(() => {
    const unsubscribeTheme = store.subscribe(() => {
      const currentTheme = store.getState().theme?.mode;
      if (currentTheme && currentTheme !== theme) {
        setTheme(currentTheme);
      }
    });

    return () => {
      unsubscribeTheme();
    };
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      
      // Get the full current path, including any query parameters
      const currentPath = typeof window !== 'undefined' 
        ? window.location.pathname + window.location.search 
        : '/';

      // Log the environment variables to debug
      console.log('Authentik Config:', {
        clientId: import.meta.env.PUBLIC_AUTHENTIK_CLIENT_ID,
        clientSecret: import.meta.env.PUBLIC_AUTHENTIK_CLIENT_SECRET,
        redirectUri,
        scopes: import.meta.env.PUBLIC_AUTHENTIK_SCOPES,
        baseUrl: import.meta.env.PUBLIC_AUTHENTIK_URL,
        storageKey: `${import.meta.env.PUBLIC_AUTHENTIK_STORAGE_KEY_PREFIX || 'authentik_'}top_banner_auth`,
        currentPath,
      });

      const client = createClient({
        clientId: import.meta.env.PUBLIC_AUTHENTIK_CLIENT_ID || '',
        clientSecret: import.meta.env.PUBLIC_AUTHENTIK_CLIENT_SECRET || '',
        redirectUri: redirectUri || '',
        scopes: import.meta.env.PUBLIC_AUTHENTIK_SCOPES || 'openid profile email',
        baseUrl: import.meta.env.PUBLIC_AUTHENTIK_URL || '',
        storageKey: `${import.meta.env.PUBLIC_AUTHENTIK_STORAGE_KEY_PREFIX || 'authentik_'}top_banner_auth`,
      });

      await client.login(currentPath);
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
    }
  };

  // Only render client-side specific content when on the client
  if (!isClient) {
    return (
      <div className="w-full h-14 bg-background border-b flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-foreground">Redux Todo App</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-14 bg-background border-b flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-foreground">Redux Todo App</h1>
      </div>
      <div className="flex items-center space-x-4">
        <button 
          onClick={handleLogin}
          disabled={loading}
          className={`
            flex items-center justify-center px-3 py-1 rounded-full transition-colors text-sm font-medium
            ${loading 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}
          `}
          aria-label="Sign In"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
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
      </div>
    </div>
  );
};

export default TopBar;
