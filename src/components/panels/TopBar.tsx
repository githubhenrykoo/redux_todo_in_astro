import React, { useState, useEffect } from 'react';
import { FiSun, FiMoon, FiLogOut } from 'react-icons/fi';
import { store } from '../../store';
import { toggleTheme } from '../../features/themeSlice';
import { createClient } from '../../lib/authentik/client';
import { login, logout } from '../../features/userSlice';

interface TopBarProps {
  initialTheme?: 'light' | 'dark';
}

interface UserInfo {
  email?: string;
  email_verified?: boolean;
  sub?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ initialTheme: initialPropTheme }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(initialPropTheme || 'light');
  const [loading, setLoading] = useState(false);
  const [redirectUri, setRedirectUri] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserInfo>({});

  useEffect(() => {
    // Initial theme setup
    const storeTheme = store.getState().theme?.mode || 'light';
    setTheme(storeTheme);

    // Set up theme subscription
    const unsubscribeTheme = store.subscribe(() => {
      const currentTheme = store.getState().theme?.mode;
      if (currentTheme && currentTheme !== theme) {
        setTheme(currentTheme);
      }
    });

    // Set up redirect URI
    const origin = window.location.origin;
    const path = '/callback';
    setRedirectUri(`${origin}${path}`);

    // Check for stored user info
    const storedUserInfo = localStorage.getItem('authentik_panel_top_banner_authuser_info');
    const accessToken = localStorage.getItem('authentik_panel_top_banner_auth_access_token');
    const idToken = localStorage.getItem('authentik_panel_top_banner_auth_id_token');

    console.log('Stored User Info:', {
      userInfo: storedUserInfo,
      accessToken,
      idToken
    });

    if (storedUserInfo) {
      try {
        const parsedUserInfo: UserInfo = JSON.parse(storedUserInfo);
        
        // Dispatch login action with comprehensive payload
        const loginPayload = {
          profile: parsedUserInfo,
          tokens: {
            access_token: accessToken,
            id_token: idToken,
            // Add other token details if available
          }
        };

        console.log('Dispatching Login Payload:', loginPayload);

        // Dispatch login action
        const loginAction = store.dispatch(login(loginPayload));

        // Update local state
        setIsAuthenticated(true);
        setUserProfile(parsedUserInfo);

        console.log('Login dispatched with action:', loginAction);
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    }

    return () => {
      unsubscribeTheme();
    };
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      
      const currentPath = window.location.pathname + window.location.search;

      const client = createClient({
        clientId: import.meta.env.PUBLIC_AUTHENTIK_CLIENT_ID || '',
        clientSecret: import.meta.env.PUBLIC_AUTHENTIK_CLIENT_SECRET || '',
        redirectUri: redirectUri || '',
        scopes: import.meta.env.PUBLIC_AUTHENTIK_SCOPES || 'openid profile email',
        baseUrl: import.meta.env.PUBLIC_AUTHENTIK_URL || '',
        storageKey: `${import.meta.env.PUBLIC_AUTHENTIK_STORAGE_KEY_PREFIX || 'authentik_'}panel_top_banner_auth`,
      });

      await client.login(currentPath);
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Remove stored user info
    localStorage.removeItem('authentik_panel_top_banner_authuser_info');
    localStorage.removeItem('authentik_panel_top_banner_auth_access_token');
    localStorage.removeItem('authentik_panel_top_banner_auth_id_token');
    
    // Dispatch logout action
    store.dispatch(logout());

    // Update local state
    setIsAuthenticated(false);
    setUserProfile({});
  };

  return (
    <div className="w-full h-14 bg-background border-b flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-foreground">Redux Todo App</h1>
      </div>
      <div className="flex items-center space-x-4">
        {isAuthenticated ? (
          <div className="flex items-center space-x-2">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-foreground">
                {userProfile.email}
              </span>
              {userProfile.email_verified && (
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
