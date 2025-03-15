import React, { useState, useEffect, useCallback } from 'react';
import { FiSun, FiMoon, FiUser, FiLogOut, FiLogIn } from 'react-icons/fi';
import { store } from '../../store';
import { toggleTheme } from '../../features/themeSlice';
import AuthentikPanel from '../auth/AuthentikPanel';
import type { 
  AuthentikPanelProps, 
  UserInfo, 
  AuthentikConfig 
} from '../../types/authentik';

export const TopBar: React.FC = () => {
  const [theme, setTheme] = useState(store.getState().theme?.mode || 'light');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [redirectUri, setRedirectUri] = useState('');

  useEffect(() => {
    // Only run on client-side
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
        {info?.name ? info.name.charAt(0).toUpperCase() : <FiUser />}
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
          flex items-center justify-center w-8 h-8 rounded-full transition-colors
          ${loading 
            ? 'bg-gray-200 cursor-not-allowed' 
            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}
        `}
        aria-label="Login"
      >
        {loading ? (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="animate-spin h-5 w-5 text-blue-600" 
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <FiLogIn className="w-5 h-5" />
        )}
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
          flex items-center justify-center w-8 h-8 rounded-full transition-colors
          ${loading 
            ? 'bg-gray-200 cursor-not-allowed' 
            : 'hover:bg-gray-200'}
        `}
        aria-label="Logout"
      >
        {loading ? (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="animate-spin h-5 w-5 text-gray-600" 
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <FiLogOut className="w-5 h-5 text-gray-600" />
        )}
      </button>
    ), []),
    'client:only': 'react', 
  };

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
