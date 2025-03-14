/**
 * Authentik Authentication Panel Component
 * 
 * A standalone authentication panel that connects to Authentik
 * without Redux integration. Completely isolated from other components.
 */
import React, { useState, useEffect } from 'react';
import { 
  initAuth,
  getLoginUrl,
  exchangeCodeForToken,
  getUserInfo,
  getLogoutUrl,
  saveAuth,
  getAuth,
  removeAuth
} from '../../lib/auth/authentikService';
import { SiAuthentik } from 'react-icons/si';

// Check if code is running in browser
const isBrowser = typeof window !== 'undefined';

// Default configuration - will be overridden by props
const defaultConfig = {
  clientId: 'your-client-id', // Replace with your actual client ID
  redirectUri: isBrowser ? window.location.origin : 'http://localhost:4321',
  scopes: 'openid profile email',
};

/**
 * Authentication Panel Component
 * @param {Object} props Component props
 * @returns {JSX.Element} Authentication panel component
 */
const AuthentikPanel = ({ 
  config = {}, 
  onLogin, 
  onLogout, 
  className = '',
  showUserInfo = true,
  customLoginButton,
  customLogoutButton,
  customUserInfo,
  checkLoginOnMount = true,
  autoProcessCallback = true,
  storageKeyPrefix = 'authentik_panel_',
  disabled = false
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Generate a unique storage key for this panel instance to avoid conflicts
  const instanceStorageKey = `${storageKeyPrefix}${config.clientId || 'default'}`;
  
  // Merge provided config with defaults
  const authConfig = { 
    ...defaultConfig, 
    ...config,
    // Ensure the storage key is unique to this panel
    storageKey: instanceStorageKey
  };
  
  // Initialize authentication
  const auth = initAuth(authConfig);
  
  // Check authentication status and parse callback
  useEffect(() => {
    // Skip if disabled
    if (disabled) return;
    
    // Only check for stored auth if explicitly enabled
    if (checkLoginOnMount) {
      // Check if we have stored authentication
      const storedAuth = getAuth(auth);
      if (storedAuth) {
        setIsAuthenticated(true);
        setUserInfo(storedAuth.userInfo);
        if (onLogin) onLogin(storedAuth);
        return;
      }
    }
    
    // Only process callback if explicitly enabled
    if (autoProcessCallback) {
      // Check for callback parameters in URL
      const urlParams = new URLSearchParams(isBrowser ? window.location.search : '');
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const storedState = isBrowser ? localStorage.getItem(`${instanceStorageKey}_auth_state`) : null;
      
      // If code and state exist, handle the callback
      if (code && state && storedState === state) {
        // Clear URL parameters (better user experience)
        if (isBrowser) window.history.replaceState({}, document.title, window.location.pathname);
        
        // Handle authentication callback
        setLoading(true);
        setError(null);
        
        exchangeCodeForToken(auth, code)
          .then(tokenResponse => {
            // Get user info with the access token
            return getUserInfo(tokenResponse.access_token)
              .then(userInfoResponse => {
                // Add user info to token response
                return {
                  ...tokenResponse,
                  userInfo: userInfoResponse
                };
              });
          })
          .then(authData => {
            // Save authentication data
            saveAuth(auth, authData);
            setIsAuthenticated(true);
            setUserInfo(authData.userInfo);
            setLoading(false);
            
            // Call onLogin callback if provided
            if (onLogin) onLogin(authData);
          })
          .catch(err => {
            console.error('Authentication error:', err);
            setError('Authentication failed. Please try again.');
            setLoading(false);
          });
      }
    }
  }, [auth, onLogin, checkLoginOnMount, autoProcessCallback, instanceStorageKey, disabled]);
  
  // Login handler
  const handleLogin = () => {
    if (disabled) return;
    
    setLoading(true);
    try {
      // Store state parameter with instance-specific key
      const state = generateRandomState();
      if (isBrowser) localStorage.setItem(`${instanceStorageKey}_auth_state`, state);
      
      // Redirect to Authentik login
      const loginUrl = getLoginUrl(auth, state);
      if (isBrowser) window.location.href = loginUrl;
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };
  
  // Generate random state for CSRF protection
  const generateRandomState = () => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };
  
  // Logout handler
  const handleLogout = () => {
    if (disabled) return;
    
    setLoading(true);
    try {
      // Clear local authentication with instance-specific key
      removeAuth(auth);
      if (isBrowser) localStorage.removeItem(`${instanceStorageKey}_auth_state`);
      
      setIsAuthenticated(false);
      setUserInfo(null);
      
      // Call onLogout callback if provided
      if (onLogout) onLogout();
      
      // Redirect to Authentik logout page
      if (isBrowser) window.location.href = getLogoutUrl(auth);
    } catch (err) {
      console.error('Logout error:', err);
      setError('Logout failed. Please try again.');
      setLoading(false);
    }
  };
  
  // If disabled, render nothing or placeholder
  if (disabled) {
    return null;
  }
  
  // Render login button or user info
  if (isAuthenticated && userInfo) {
    // Render user info and logout button
    return (
      <div className={`authentik-panel ${className}`}>
        {error && (
          <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {customUserInfo ? (
          customUserInfo(userInfo, handleLogout)
        ) : (
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-white shadow-sm">
            {showUserInfo && (
              <div className="user-info flex items-center gap-3">
                {userInfo.picture && (
                  <img 
                    src={userInfo.picture} 
                    alt={userInfo.name || 'User'} 
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <div className="font-medium">{userInfo.name || userInfo.preferred_username || 'User'}</div>
                  {userInfo.email && <div className="text-sm text-gray-600">{userInfo.email}</div>}
                </div>
              </div>
            )}
            
            {customLogoutButton ? (
              customLogoutButton(handleLogout, loading)
            ) : (
              <button
                onClick={handleLogout}
                disabled={loading}
                className="ml-auto flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded px-4 py-2 disabled:opacity-70"
              >
                {loading ? (
                  <span className="animate-spin">◌</span>
                ) : (
                  <SiAuthentik className="text-lg" />
                )}
                Sign Out
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
  
  // Render login button
  return (
    <div className={`authentik-panel ${className}`}>
      {error && (
        <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {customLoginButton ? (
        customLoginButton(handleLogin, loading)
      ) : (
        <button
          onClick={handleLogin}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded px-4 py-2 disabled:opacity-70"
        >
          {loading ? (
            <span className="animate-spin">◌</span>
          ) : (
            <SiAuthentik className="text-lg" />
          )}
          Sign in with Authentik
        </button>
      )}
    </div>
  );
};

export default AuthentikPanel;
