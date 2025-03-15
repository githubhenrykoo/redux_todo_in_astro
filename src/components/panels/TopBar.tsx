import React, { useState, useEffect, useCallback } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { store } from '../../store';
import { toggleTheme } from '../../features/themeSlice';
import AuthentikPanel from '../auth/AuthentikPanel';
import type { 
  AuthentikPanelProps, 
  UserInfo, 
  AuthentikConfig 
} from '../../types/authentik';

export const TopBar: React.FC = () => {
  const [theme, setTheme] = useState(() => {
    // Use a function to ensure this only runs on the client
    if (typeof window !== 'undefined') {
      return store.getState().theme?.mode || 'light';
    }
    return 'light'; // Default server-side value
  });
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [redirectUri, setRedirectUri] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Ensure this only runs on the client
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
      setRedirectUri(`${window.location.origin}/callback`);
    }
  }, []);

  useEffect(() => {
    // Subscribe to theme changes
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

  const handleThemeToggle = () => {
    store.dispatch(toggleTheme());
  };

  const renderUserAvatar = (info?: UserInfo) => {
    if (info?.picture) {
      return (
        <img 
          src={info.picture} 
          alt={info.name || 'User'} 
          className="w-8 h-8 rounded-full object-cover"
        />
      );
    }

    return (
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
        {info?.name ? info.name.charAt(0).toUpperCase() : '👤'}
      </div>
    );
  };

  const authentikConfig: AuthentikConfig = {
    clientId: import.meta.env.AUTHENTIK_CLIENT_ID,
    redirectUri: redirectUri || '/callback', // Fallback for SSR
    scopes: import.meta.env.AUTHENTIK_SCOPES,
    baseUrl: import.meta.env.AUTHENTIK_URL,
    storageKey: `${import.meta.env.AUTHENTIK_STORAGE_KEY_PREFIX || 'authentik_'}top_bar_auth`,
  };

  const authentikPanelProps: AuthentikPanelProps = {
    config: authentikConfig,
    renderUserInfo: (info: UserInfo | null) => {
      setUserInfo(info);
      if (!info) return null;
      
      return (
        <div className="flex items-center space-x-2">
          {renderUserAvatar(info)}
          <div className="hidden md:block">
            <p className="text-sm font-medium text-foreground">
              {info.name || 'Guest'}
            </p>
            <p className="text-xs text-muted-foreground">
              {info.email ? info.email.split('@')[0] : 'Not logged in'}
            </p>
          </div>
        </div>
      );
    },
    customLoginButton: useCallback((handleLogin: (...args: any[]) => void | Promise<void>, loading: boolean) => (
      <button 
        onClick={() => {
          if (typeof handleLogin === 'function') {
            const result = handleLogin();
            if (result instanceof Promise) {
              result.catch(console.error);
            }
          }
        }}
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
    ), []),
    customLogoutButton: useCallback((handleLogout: (...args: any[]) => void | Promise<void>, loading: boolean) => (
      <button 
        onClick={() => {
          if (typeof handleLogout === 'function') {
            const result = handleLogout();
            if (result instanceof Promise) {
              result.catch(console.error);
            }
          }
        }}
        disabled={loading}
        className={`
          flex items-center justify-center px-3 py-1 rounded-full transition-colors text-sm font-medium
          ${loading 
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
            : 'hover:bg-gray-200'}
        `}
        aria-label="Logout"
      >
        {loading ? 'Signing Out...' : 'Sign Out'}
      </button>
    ), []),
    'client:only': 'react',
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
        <AuthentikPanel {...authentikPanelProps} />
        
        <button 
          onClick={handleThemeToggle}
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
