/**
 * Authentik Authentication Panel Component
 * 
 * A standalone authentication panel that connects to Authentik
 * without Redux integration. Completely isolated from other components.
 */
import React, { useState, useEffect } from 'react';
import { createClient } from '../../../src/lib/authentik/client';

/**
 * Authentik Authentication Panel Component
 * @typedef {Object} AuthentikPanelProps
 * @property {Object} config
 * @property {Function} [renderUserInfo]
 * @property {Function} [customLoginButton]
 * @property {Function} [customLogoutButton]
 * @param {AuthentikPanelProps} props
 */
const AuthentikPanel = ({ 
  config = {}, 
  renderUserInfo,
  customLoginButton,
  customLogoutButton,
}) => {
  const [authClient, setAuthClient] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only create client on client-side
    if (typeof window !== 'undefined' && config.clientId) {
      const client = createClient({
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        scopes: config.scopes,
        baseUrl: config.baseUrl,
        storageKey: config.storageKey,
      });
      setAuthClient(client);
    }
  }, [config]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      if (authClient) {
        try {
          const user = await authClient.getUserInfo();
          setUserInfo(user);
        } catch (error) {
          setUserInfo(null);
        }
      }
    };

    checkLoginStatus();
  }, [authClient]);

  const handleLogin = async () => {
    if (authClient) {
      setIsLoading(true);
      try {
        await authClient.login();
      } catch (error) {
        console.error('Login failed', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    if (authClient) {
      setIsLoading(true);
      try {
        await authClient.logout();
        setUserInfo(null);
      } catch (error) {
        console.error('Logout failed', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Render user info if provided, otherwise use default rendering
  const renderUserInfoContent = () => {
    if (renderUserInfo) {
      return renderUserInfo(userInfo);
    }

    if (!userInfo) return null;

    return (
      <div className="flex items-center space-x-2">
        {userInfo.picture ? (
          <img 
            src={userInfo.picture} 
            alt={userInfo.name || 'User'} 
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : '👤'}
          </div>
        )}
        <div>
          <p className="text-sm font-medium">{userInfo.name || 'Guest'}</p>
          <p className="text-xs text-muted-foreground">
            {userInfo.email || 'Not logged in'}
          </p>
        </div>
      </div>
    );
  };

  // Render login/logout buttons
  const renderLoginButton = () => {
    if (customLoginButton) {
      return customLoginButton(handleLogin, isLoading);
    }

    return (
      <button 
        onClick={handleLogin}
        disabled={isLoading}
        className={`
          flex items-center justify-center w-8 h-8 rounded-full transition-colors
          ${isLoading 
            ? 'bg-gray-200 cursor-not-allowed' 
            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}
        `}
        aria-label="Login"
      >
        {isLoading ? (
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
          <span>🔑</span>
        )}
      </button>
    );
  };

  const renderLogoutButton = () => {
    if (customLogoutButton) {
      return customLogoutButton(handleLogout, isLoading);
    }

    return (
      <button 
        onClick={handleLogout}
        disabled={isLoading}
        className={`
          flex items-center justify-center w-8 h-8 rounded-full transition-colors
          ${isLoading 
            ? 'bg-gray-200 cursor-not-allowed' 
            : 'hover:bg-gray-200'}
        `}
        aria-label="Logout"
      >
        {isLoading ? (
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
          <span>🚪</span>
        )}
      </button>
    );
  };

  return (
    <div className="flex items-center space-x-2">
      {userInfo ? (
        <>
          {renderUserInfoContent()}
          {renderLogoutButton()}
        </>
      ) : (
        renderLoginButton()
      )}
    </div>
  );
};

export default AuthentikPanel;
