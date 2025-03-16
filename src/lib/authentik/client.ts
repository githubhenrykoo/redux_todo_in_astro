import type { UserInfo } from '../../types/authentik';

interface AuthentikClientConfig {
  clientId: string;
  redirectUri: string;
  scopes: string;
  baseUrl: string;
  storageKey: string;
}

export function createClient(config: AuthentikClientConfig) {
  // Validate config
  if (!config) {
    throw new Error('Authentik client configuration is required');
  }

  const { 
    clientId, 
    redirectUri, 
    scopes, 
    baseUrl, 
    storageKey 
  } = config;

  // Validate individual config parameters
  if (!baseUrl) {
    throw new Error('Authentik base URL is required');
  }

  const login = async () => {
    try {
      // Ensure baseUrl is a string and remove trailing slashes
      const sanitizedBaseUrl = (baseUrl || '').toString().replace(/\/+$/, '');

      if (!sanitizedBaseUrl) {
        throw new Error('Invalid Authentik base URL');
      }

      // Construct the authorization URL
      const authorizationUrl = `${sanitizedBaseUrl}/application/o/authorize/`;
      
      // Create URL with search params
      const url = new URL(authorizationUrl);
      url.searchParams.set('client_id', clientId);
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', scopes);
      
      // Store the current URL to return after authentication
      localStorage.setItem(`${storageKey}redirect_uri`, window.location.href);

      // Redirect to Authentik login
      window.location.href = url.toString();
    } catch (error) {
      console.error('Login initialization failed:', error);
      throw error;
    }
  };

  const handleCallback = async (code: string) => {
    try {
      // Ensure baseUrl is a string and remove trailing slashes
      const sanitizedBaseUrl = (baseUrl || '').toString().replace(/\/+$/, '');

      if (!sanitizedBaseUrl) {
        throw new Error('Invalid Authentik base URL');
      }

      // Exchange authorization code for tokens
      const tokenUrl = new URL(`${sanitizedBaseUrl}/application/o/token/`);
      
      const tokenResponse = await fetch(tokenUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code: code,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange authorization code');
      }

      const tokens = await tokenResponse.json();
      
      // Store tokens
      localStorage.setItem(`${storageKey}access_token`, tokens.access_token);
      localStorage.setItem(`${storageKey}id_token`, tokens.id_token);

      // Fetch user info
      const userInfoUrl = new URL(`${sanitizedBaseUrl}/application/o/userinfo/`);
      const userInfoResponse = await fetch(userInfoUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userInfo = await userInfoResponse.json();
      localStorage.setItem(`${storageKey}user_info`, JSON.stringify(userInfo));

      return userInfo;
    } catch (error) {
      console.error('Authentication callback failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Ensure baseUrl is a string and remove trailing slashes
      const sanitizedBaseUrl = (baseUrl || '').toString().replace(/\/+$/, '');

      if (!sanitizedBaseUrl) {
        throw new Error('Invalid Authentik base URL');
      }

      // Remove stored tokens and user info
      localStorage.removeItem(`${storageKey}access_token`);
      localStorage.removeItem(`${storageKey}id_token`);
      localStorage.removeItem(`${storageKey}user_info`);

      // Construct logout URL
      const logoutUrl = new URL(`${sanitizedBaseUrl}/application/o/end-session/`);
      logoutUrl.searchParams.set('client_id', clientId);
      logoutUrl.searchParams.set('post_logout_redirect_uri', redirectUri);

      // Redirect to logout
      window.location.href = logoutUrl.toString();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const getUserInfo = async (): Promise<UserInfo | null> => {
    try {
      const storedUserInfo = localStorage.getItem(`${storageKey}user_info`);
      
      if (storedUserInfo) {
        try {
          return JSON.parse(storedUserInfo);
        } catch {
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to retrieve user info:', error);
      return null;
    }
  };

  return {
    login,
    logout,
    getUserInfo,
    handleCallback,
  };
}
