import React, { useState, useEffect, startTransition, useRef } from 'react';
import { FiSun, FiMoon, FiLogOut, FiSave, FiCheck } from 'react-icons/fi';
import { store } from '../../store';
import { toggleTheme } from '../../features/themeSlice';
import { createClient } from '../../lib/authentik/client';
import { login, logout } from '../../features/userSlice';

interface TopBarProps {
  initialTheme?: 'light' | 'dark';
}

interface UserInfo {
  email?: string | null;
  email_verified?: boolean | null;
  sub?: string | null;
}

// Add save function to window for external components to call
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.forceSaveReduxState = (immediate = false) => {
    console.log('Force save called from outside TopBar');
    const state = store.getState();
    // Always try to save, regardless of component state
    const event = new CustomEvent('force-save-state', { 
      detail: { state, immediate } 
    });
    window.dispatchEvent(event);
  };
}

export const TopBar: React.FC<TopBarProps> = ({ initialTheme: initialPropTheme }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(initialPropTheme || 'light');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [redirectUri, setRedirectUri] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserInfo>({});
  const [lastSavedState, setLastSavedState] = useState('');
  const [isClient, setIsClient] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);

  // Function to post state to backend with debounce
  const postStateToBackend = async (state: any, immediate = false) => {
    if (!isClient) return; // Don't run on server
    
    console.log('postStateToBackend called', { immediate, autoSaveEnabled });
    
    // Clear any pending save timeout
    if (saveTimeoutRef.current !== null) {
      console.log('Clearing previous save timeout');
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    // If not immediate, set a debounce timeout
    if (!immediate && autoSaveEnabled) {
      console.log('Setting debounce timeout for save');
      saveTimeoutRef.current = window.setTimeout(() => {
        console.log('Debounce timeout expired, saving state');
        saveState(state, true);
      }, 1000); // 1 second debounce
      return;
    }
    
    // If immediate or auto-save disabled, save right away
    if (immediate || !autoSaveEnabled) {
      console.log('Saving immediately without debounce');
      saveState(state, immediate);
    }
  };
  
  // Actual save function
  const saveState = async (state: any, force = false) => {
    try {
      setSaving(true);
      const stateJson = JSON.stringify(state);
      
      console.log('saveState called', {
        stateJsonLength: stateJson.length,
        lastSavedStateLength: lastSavedState ? lastSavedState.length : 0,
        force
      });
      
      // Skip if state hasn't changed, unless force is true
      if (!force && stateJson === lastSavedState) {
        console.log('State unchanged, skipping save');
        setSaving(false);
        return;
      }
      
      console.log('Saving state to backend...', {
        panelLayout: state.panellayout?.panels ? Object.keys(state.panellayout.panels) : 'none',
        themeMode: state.theme?.mode || 'unknown',
        todoCount: state.todos?.items?.length || 0
      });
      
      // Actually make the API request
      console.log('Making POST request to /api/store-card');
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
      setLastSaved(new Date());
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

    // Initialize with the current state
    const initialState = store.getState();
    setLastSavedState(JSON.stringify(initialState));
    console.log('Initial state set for auto-save comparison');

    // Check authentication state from Redux store
    const userState = initialState.user;
    console.log('Initial user state from Redux:', userState);
    if (userState && userState.isAuthenticated) {
      startTransition(() => {
        setIsAuthenticated(true);
        setUserProfile({
          email: userState.profile?.email,
          email_verified: userState.profile?.email_verified,
          sub: userState.profile?.sub
        });
      });
    }

    // Initial theme setup
    const storeTheme = initialState.theme?.mode || 'light';
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

    // Set up user state subscription
    const unsubscribeUser = store.subscribe(() => {
      const currentUserState = store.getState().user;
      console.log('User state updated in Redux:', currentUserState);
      if (currentUserState) {
        const shouldBeAuthenticated = !!currentUserState.isAuthenticated;
        if (shouldBeAuthenticated !== isAuthenticated) {
          startTransition(() => {
            setIsAuthenticated(shouldBeAuthenticated);
            if (shouldBeAuthenticated) {
              setUserProfile({
                email: currentUserState.profile?.email,
                email_verified: currentUserState.profile?.email_verified,
                sub: currentUserState.profile?.sub
              });
            } else {
              setUserProfile({});
            }
          });
        }
      }
    });

    // Handle force save events
    const handleForceSave = (event: CustomEvent) => {
      console.log('Force save event received', event.detail);
      const { state, immediate } = event.detail;
      postStateToBackend(state, immediate || true);
    };

    // Add event listener for force save events
    window.addEventListener('force-save-state', handleForceSave as EventListener);

    // Add listener for custom layout change events
    const handleCustomStateChange = (event: CustomEvent) => {
      console.log('Custom state change event received:', event.detail);
      if (autoSaveEnabled) {
        // Force an immediate save when layout changes
        const currentState = store.getState();
        postStateToBackend(currentState, true);
      }
    };

    // Add event listener for custom state change events
    window.addEventListener('redux-state-change', handleCustomStateChange as EventListener);
    
    // Track the previous state for comparison
    let previousState = JSON.stringify(store.getState(), Object.keys(store.getState()).sort());

    // Set up state change subscription and auto-saving with debounce
    const unsubscribeStateChange = store.subscribe(() => {
      const currentState = store.getState();
      const currentStateString = JSON.stringify(currentState, Object.keys(currentState).sort());
      
      // Only trigger save if state actually changed
      if (currentStateString !== previousState) {
        console.log('State changed, triggering auto-save');
        previousState = currentStateString; // Update previous state
        
        if (autoSaveEnabled) {
          // Use the debounced save function
          postStateToBackend(currentState);
        }
      }
    });

    // Set redirect URI based on environment configuration
    setRedirectUri(
      import.meta.env.PUBLIC_AUTHENTIK_REDIRECT_URI || 
      `${import.meta.env.PUBLIC_APP_URL}/callback`
    );

    // Check for stored user info
    const storedUserInfo = localStorage.getItem('authentik_top_banner_authuser_info');
    const accessToken = localStorage.getItem('authentik_top_banner_authaccess_token');
    const idToken = localStorage.getItem('authentik_top_banner_authid_token');

    console.log('Stored User Info:', {
      userInfo: storedUserInfo,
      accessToken,
      idToken
    });

    if (storedUserInfo) {
      try {
        // Try to parse the full stored user info
        let parsedUserInfo = {};
        
        try {
          // First, try parsing the full stored info
          parsedUserInfo = JSON.parse(storedUserInfo);
        } catch (partialParseError) {
          console.warn('Partial or truncated user info, attempting recovery', partialParseError);
          
          // Attempt to recover by parsing the valid part of the JSON
          const validJsonMatch = storedUserInfo.match(/^{[^}]*}/);
          if (validJsonMatch) {
            try {
              parsedUserInfo = JSON.parse(validJsonMatch[0]);
            } catch (recoveryError) {
              console.error('Could not recover user info', recoveryError);
              localStorage.removeItem('authentik_top_banner_authuser_info');
              return;
            }
          }
        }

        // Decode JWT tokens to get additional information
        const decodeJWT = (token: string) => {
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(window.atob(base64));
          } catch (error) {
            console.error('Error decoding JWT', error);
            return {};
          }
        };

        // Try to get additional info from access token
        const decodedAccessToken = accessToken ? decodeJWT(accessToken) : {};
        const decodedIdToken = idToken ? decodeJWT(idToken) : {};

        // Merge information from different sources
        const mergedUserInfo = {
          ...decodedAccessToken,
          ...decodedIdToken,
          ...parsedUserInfo,
          access_token: accessToken,
          id_token: idToken
        };
        
        // Comprehensive login payload
        const loginPayload = {
          isAuthenticated: true,
          sub: mergedUserInfo.sub || null,
          email: mergedUserInfo.email || null,
          email_verified: mergedUserInfo.email_verified || false,
          name: mergedUserInfo.name || null,
          given_name: mergedUserInfo.given_name || null,
          family_name: mergedUserInfo.family_name || null,
          nickname: mergedUserInfo.nickname || null,
          preferred_username: mergedUserInfo.preferred_username || null,
          groups: mergedUserInfo.groups || [],
          picture: mergedUserInfo.picture || null,
          access_token: accessToken,
          id_token: idToken,
          token_type: 'Bearer',
          expires_at: mergedUserInfo.exp ? new Date(mergedUserInfo.exp * 1000).toISOString() : null,
          lastLogin: new Date().toISOString(),
          theme: 'system',
          language: 'en'
        };

        console.log('Dispatching Comprehensive Login Payload:', loginPayload);

        // Dispatch login action with comprehensive payload
        store.dispatch(login(loginPayload));

        // Update local state directly
        startTransition(() => {
          setIsAuthenticated(true);
          setUserProfile({
            email: mergedUserInfo.email,
            email_verified: mergedUserInfo.email_verified,
            sub: mergedUserInfo.sub
          });
        });

        console.log('Login processed successfully');
      } catch (error) {
        console.error('Error processing user info:', error);
        // Clear invalid stored info
        localStorage.removeItem('authentik_top_banner_authuser_info');
      }
    }

    // Initial store state save - delay to ensure hydration is complete
    setTimeout(() => {
      postStateToBackend(store.getState(), true);
    }, 1000);

    return () => {
      unsubscribeTheme();
      unsubscribeStateChange();
      unsubscribeUser();
      window.removeEventListener('redux-state-change', handleCustomStateChange as EventListener);
      window.removeEventListener('force-save-state', handleForceSave as EventListener);
      
      // Clear any pending save timeout
      if (saveTimeoutRef.current !== null) {
        console.log('Cleaning up save timeout during component unmount');
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [autoSaveEnabled, isAuthenticated, theme]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      
      // For development purposes, you can bypass authentication
      const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
      
      if (isDev && !import.meta.env.PUBLIC_AUTHENTIK_CLIENT_SECRET) {
        console.log('Development mode: Skipping authentication');
        // Mock authentication for development
        const mockUserInfo = {
          email: 'dev@example.com',
          email_verified: true,
          sub: 'dev-user'
        };
        
        localStorage.setItem('authentik_top_banner_authuser_info', JSON.stringify(mockUserInfo));
        
        // Structure the Redux action payload correctly
        const loginPayload = {
          profile: {
            ...mockUserInfo,
            name: 'Dev User',
            given_name: 'Dev',
            family_name: 'User',
            nickname: 'dev',
            preferred_username: 'devuser',
            groups: ['Developers'],
            picture: null
          },
          tokens: {
            access_token: 'mock-access-token',
            id_token: 'mock-id-token',
            token_type: 'Bearer',
            expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
          }
        };
        
        // Dispatch login action
        store.dispatch(login(loginPayload));
        
        setIsAuthenticated(true);
        setUserProfile({
          email: mockUserInfo.email,
          email_verified: mockUserInfo.email_verified,
          sub: mockUserInfo.sub
        });
        setLoading(false);
        return;
      }
      
      const currentPath = window.location.pathname + window.location.search;

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
      
      // Fall back to mock login in development mode if there's an error
      if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
        console.log('Development mode: Using mock authentication after error');
        
        const mockUserInfo = {
          email: 'dev@example.com',
          email_verified: true,
          sub: 'dev-user'
        };
        
        localStorage.setItem('authentik_top_banner_authuser_info', JSON.stringify(mockUserInfo));
        
        // Structure the Redux action payload correctly
        const loginPayload = {
          profile: {
            ...mockUserInfo,
            name: 'Dev User',
            given_name: 'Dev',
            family_name: 'User',
            nickname: 'dev',
            preferred_username: 'devuser',
            groups: ['Developers'],
            picture: null
          },
          tokens: {
            access_token: 'mock-access-token',
            id_token: 'mock-id-token',
            token_type: 'Bearer',
            expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
          }
        };
        
        // Dispatch login action
        store.dispatch(login(loginPayload));
        
        setIsAuthenticated(true);
        setUserProfile({
          email: mockUserInfo.email,
          email_verified: mockUserInfo.email_verified,
          sub: mockUserInfo.sub
        });
      }
    }
  };

  const handleLogout = () => {
    // Remove stored user info
    localStorage.removeItem('authentik_top_banner_authuser_info');
    localStorage.removeItem('authentik_top_banner_authaccess_token');
    localStorage.removeItem('authentik_top_banner_authid_token');
    
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
    postStateToBackend(store.getState(), true);
  };

  // Toggle auto-save functionality
  const toggleAutoSave = () => {
    setAutoSaveEnabled(prev => !prev);
  };

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
        <h1 className="text-xl font-semibold text-foreground">Redux Todo App</h1>
        {isClient && lastSaved && (
          <span className="text-xs text-gray-500">
            Last saved: {formatLastSaved()}
          </span>
        )}
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
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleAutoSave}
                className={`
                  flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium
                  ${autoSaveEnabled
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'}
                `}
                aria-label={autoSaveEnabled ? "Auto-save enabled" : "Auto-save disabled"}
                title={autoSaveEnabled ? "Click to disable auto-save" : "Click to enable auto-save"}
              >
                {autoSaveEnabled ? 'Auto-save ON' : 'Auto-save OFF'}
              </button>
              <button 
                onClick={handleManualSave}
                disabled={saving}
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full transition-colors
                  ${saving 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-green-600 hover:bg-green-100'}
                `}
                aria-label="Force save state"
                title="Force save current state"
              >
                {saving ? (
                  <span className="animate-spin">•</span>
                ) : (
                  <FiSave className="w-5 h-5" />
                )}
              </button>
            </div>
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
