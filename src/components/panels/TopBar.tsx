import React, { useState, useEffect, useCallback } from 'react';
import { FiSun, FiMoon, FiUser, FiLogOut } from 'react-icons/fi';
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
  const [userInfo, setUserInfo] = useState<{
    email?: string;
    name?: string;
    email_verified?: boolean;
  } | null>(null);

  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const path = '/callback';
      setRedirectUri(`${origin}${path}`);

      // Check for stored user info on component mount
      const storedUserInfo = localStorage.getItem('authentik_top_banner_auth_user_info');
      if (storedUserInfo) {
        try {
          const parsedUserInfo = JSON.parse(storedUserInfo);
          setUserInfo(parsedUserInfo);
          console.log('Loaded user info:', parsedUserInfo);
        } catch (error) {
          console.error('Error parsing user info:', error);
        }
      }
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
      
      const currentPath = typeof window !== 'undefined' 
        ? window.location.pathname + window.location.search 
        : '/';

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

  const handleLogout = () => {
    // Clear user info from localStorage
    localStorage.removeItem('authentik_top_banner_auth_access_token');
    localStorage.removeItem('authentik_top_banner_auth_id_token');
    localStorage.removeItem('authentik_top_banner_auth_user_info');
    
    // Update state
    setUserInfo(null);
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
        {userInfo ? (
          <div className="flex items-center space-x-2">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-foreground">
                {userInfo.name || userInfo.email}
              </span>
              {userInfo.email_verified && (
                <span className="text-xs text-green-600">Verified</span>
              )}
            </div>
            <button 
              onClick={handleLogout}
              className="text-red-500 hover:text-red-600"
              aria-label="Sign Out"
            >
              <FiLogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
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
        )}
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
