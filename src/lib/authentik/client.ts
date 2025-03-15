import type { UserInfo } from '../../types/authentik';

interface AuthentikClientConfig {
  clientId: string;
  redirectUri: string;
  scopes: string;
  baseUrl: string;
  storageKey: string;
}

export function createClient(config: AuthentikClientConfig) {
  const { 
    clientId, 
    redirectUri, 
    scopes, 
    baseUrl, 
    storageKey 
  } = config;

  const login = async () => {
    // Construct the authorization URL
    const authorizationUrl = new URL(`${baseUrl}/application/o/authorize/`);
    authorizationUrl.searchParams.set('client_id', clientId);
    authorizationUrl.searchParams.set('redirect_uri', redirectUri);
    authorizationUrl.searchParams.set('response_type', 'code');
    authorizationUrl.searchParams.set('scope', scopes);
    
    // Store the current URL to return after authentication
    localStorage.setItem(`${storageKey}redirect_uri`, window.location.href);

    // Redirect to Authentik login
    window.location.href = authorizationUrl.toString();
  };

  const logout = async () => {
    // Remove stored tokens and user info
    localStorage.removeItem(`${storageKey}access_token`);
    localStorage.removeItem(`${storageKey}id_token`);
    localStorage.removeItem(`${storageKey}user_info`);

    // Redirect to logout endpoint or home page
    const logoutUrl = new URL(`${baseUrl}/application/o/logout/`);
    window.location.href = logoutUrl.toString();
  };

  const getUserInfo = async (): Promise<UserInfo | null> => {
    const storedUserInfo = localStorage.getItem(`${storageKey}user_info`);
    
    if (storedUserInfo) {
      try {
        return JSON.parse(storedUserInfo);
      } catch {
        return null;
      }
    }

    return null;
  };

  return {
    login,
    logout,
    getUserInfo,
  };
}
