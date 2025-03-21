import React, { useState, useEffect, startTransition } from 'react';
import { FiSun, FiMoon, FiLogOut, FiSave } from 'react-icons/fi';
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
  const [saving, setSaving] = useState(false);
  const [redirectUri, setRedirectUri] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserInfo>({});
  const [lastSavedState, setLastSavedState] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Function to post state to backend
  const postStateToBackend = async (state: any) => {
    if (!isClient) return; // Don't run on server

    try {
      setSaving(true);
      const stateJson = JSON.stringify(state);
      
      // Skip if state hasn't changed
      if (stateJson === lastSavedState) {
        setSaving(false);
        return;
      }
      
      console.log('Posting state to backend:', state);
      
      const response = await fetch('/api/store-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: stateJson,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save state: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('State saved successfully:', result);
      setLastSavedState(stateJson);
    } catch (error) {
      console.error('Error saving state:', error);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    // Set client-side flag
    setIsClient(true);
    
    // Only run client-side code in the browser
    if (typeof window === 'undefined') return;

    // Initial theme setup
    const storeTheme = store.getState().theme?.mode || 'light';
    startTransition(() => {
      setTheme(storeTheme);
    });

    // Set up theme subscription
    const unsubscribeTheme = store.subscribe(() => {
      const currentTheme = store.getState().theme?.mode;
      if (currentTheme && currentTheme !== theme) {
        startTransition(() => {
          setTheme(currentTheme);
        });
      }
    });

    // Set up state change subscription and auto-saving
    const unsubscribeStateChange = store.subscribe(() => {
      const currentState = store.getState();
      // Wrap in startTransition to avoid hydration issues
      startTransition(() => {
        postStateToBackend(currentState);
      });
    });

    // Set up redirect URI
    const origin = window.location.origin;
    const path = '/callback';
    startTransition(() => {
      setRedirectUri(`${origin}${path}`);
    });

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
        startTransition(() => {
          setIsAuthenticated(true);
          setUserProfile(parsedUserInfo);
        });

        console.log('Login dispatched with action:', loginAction);
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    }

    // Initial store state save - delay to ensure hydration is complete
    setTimeout(() => {
      postStateToBackend(store.getState());
    }, 1000);

    return () => {
      unsubscribeTheme();
      unsubscribeStateChange();
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
    startTransition(() => {
      setIsAuthenticated(false);
      setUserProfile({});
    });
  };

  // Manually trigger state save
  const handleManualSave = () => {
    postStateToBackend(store.getState());
  };

  return (
    <div className="w-full h-14 bg-background border-b flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-foreground">Redux Todo App</h1>
      </div>
      <div className="flex items-center space-x-4">
        {isClient && isAuthenticated ? (
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
        ) : isClient ? (
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
        ) : null}
        {isClient && (
          <>
            <button 
              onClick={handleManualSave}
              disabled={saving}
              className={`
                flex items-center justify-center w-8 h-8 rounded-full transition-colors
                ${saving 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-green-600 hover:bg-green-100'}
              `}
              aria-label="Save state"
              title="Save current state"
            >
              <FiSave className="w-5 h-5" />
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
          </>
        )}
      </div>
    </div>
  );
};

export default TopBar;
