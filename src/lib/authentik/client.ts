import type { UserInfo } from '../../types/authentik';

interface AuthentikClientConfig {
  clientId: string;
  clientSecret: string;
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
    clientSecret, 
    redirectUri, 
    scopes, 
    baseUrl, 
    storageKey 
  } = config;

  // Validate individual config parameters
  if (!baseUrl) {
    throw new Error('Authentik base URL is required');
  }
  if (!clientSecret) {
    throw new Error('Client secret is required for this Authentik application');
  }

  const login = async (originalUrl?: string) => {
    try {
      // Ensure baseUrl is a string and remove trailing slashes
      const sanitizedBaseUrl = (baseUrl || '').toString().replace(/\/+$/, '');

      if (!sanitizedBaseUrl) {
        throw new Error('Invalid Authentik base URL');
      }

      // Use provided original URL or current window location
      const currentUrl = originalUrl || 
        (typeof window !== 'undefined' 
          ? window.location.pathname + window.location.search 
          : '/');

      console.log('DEBUG LOGIN - Storing URL:', {
        originalUrl,
        currentUrl,
        windowLocation: typeof window !== 'undefined' ? window.location.href : 'No window'
      });

      // Construct the authorization URL
      const authorizationUrl = `${sanitizedBaseUrl}/application/o/authorize/`;
      
      // Create URL with search params
      const url = new URL(authorizationUrl);
      url.searchParams.set('client_id', clientId);
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', scopes);
      
      // Store the original URL to return after authentication
      localStorage.setItem(`${storageKey}redirect_uri`, currentUrl);

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

      // Validate input parameters
      if (!code) {
        throw new Error('Authorization code is required');
      }
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      if (!clientSecret) {
        throw new Error('Client Secret is required');
      }
      if (!redirectUri) {
        throw new Error('Redirect URI is required');
      }

      // Exchange authorization code for tokens
      const tokenUrl = new URL(`${sanitizedBaseUrl}/application/o/token/`);
      
      console.log('DEBUG TOKEN EXCHANGE CONFIGURATION:', {
        tokenUrl: tokenUrl.toString(),
        clientId,
        redirectUri,
        baseUrl: sanitizedBaseUrl,
        codeLength: code.length,
        clientSecretLength: clientSecret.length
      });

      // Prepare token exchange parameters with explicit encoding
      const tokenParams = new URLSearchParams();
      tokenParams.append('client_id', clientId);
      tokenParams.append('client_secret', clientSecret);
      tokenParams.append('redirect_uri', redirectUri);
      tokenParams.append('grant_type', 'authorization_code');
      tokenParams.append('code', code);

      // Log the exact parameters being sent
      console.log('DEBUG TOKEN EXCHANGE PARAMS:', {
        params: Object.fromEntries(tokenParams.entries())
      });

      let tokenResponse;
      try {
        tokenResponse = await fetch(tokenUrl.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: tokenParams.toString()
        });
      } catch (fetchError: unknown) {
        const errorDetails = fetchError instanceof Error 
          ? {
              errorName: fetchError.name,
              errorMessage: fetchError.message,
              errorStack: fetchError.stack
            }
          : {
              errorName: 'Unknown Fetch Error',
              errorMessage: String(fetchError),
              errorStack: null
            };

        console.error('Fetch Error during token exchange:', {
          ...errorDetails,
          tokenUrl: tokenUrl.toString(),
          clientIdUsed: clientId,
          redirectUriUsed: redirectUri
        });
        throw new Error(`Network error during token exchange: ${errorDetails.errorMessage}`);
      }

      // Log full response details for debugging
      const responseHeaders = Object.fromEntries(tokenResponse.headers.entries());
      const responseStatus = {
        ok: tokenResponse.ok,
        status: tokenResponse.status,
        statusText: tokenResponse.statusText
      };

      console.log('Token Exchange Response Details:', {
        ...responseStatus,
        headers: responseHeaders
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token Exchange Error:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          errorBody: errorText,
          requestParams: Object.fromEntries(tokenParams)
        });
        throw new Error(`Failed to exchange authorization code. Status: ${tokenResponse.status}, Error: ${errorText}`);
      }

      let tokens;
      try {
        tokens = await tokenResponse.json();
        console.log('Token Response Parsed:', {
          hasAccessToken: !!tokens.access_token,
          hasIdToken: !!tokens.id_token,
          tokenKeys: Object.keys(tokens)
        });
      } catch (parseError: unknown) {
        const errorDetails = parseError instanceof Error 
          ? {
              errorName: parseError.name,
              errorMessage: parseError.message,
              errorStack: parseError.stack
            }
          : {
              errorName: 'Unknown Parse Error',
              errorMessage: String(parseError),
              errorStack: null
            };

        console.error('Token Parse Error:', errorDetails);
        throw new Error(`Failed to parse token response: ${errorDetails.errorMessage}`);
      }
      
      // Validate tokens
      if (!tokens.access_token) {
        throw new Error('No access token received');
      }

      // Store tokens
      localStorage.setItem(`${storageKey}access_token`, tokens.access_token);
      localStorage.setItem(`${storageKey}id_token`, tokens.id_token || '');

      // Fetch user info
      const userInfoUrl = new URL(`${sanitizedBaseUrl}/application/o/userinfo/`);
      let userInfoResponse;
      try {
        userInfoResponse = await fetch(userInfoUrl.toString(), {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
          },
        });
      } catch (fetchError: unknown) {
        const errorDetails = fetchError instanceof Error 
          ? {
              errorName: fetchError.name,
              errorMessage: fetchError.message,
              errorStack: fetchError.stack
            }
          : {
              errorName: 'Unknown Fetch Error',
              errorMessage: String(fetchError),
              errorStack: null
            };

        console.error('Fetch User Info Error:', errorDetails);
        throw new Error(`Network error fetching user info: ${errorDetails.errorMessage}`);
      }

      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        console.error('User Info Fetch Error:', {
          status: userInfoResponse.status,
          statusText: userInfoResponse.statusText,
          errorBody: errorText
        });
        throw new Error(`Failed to fetch user info. Status: ${userInfoResponse.status}, Error: ${errorText}`);
      }

      const userInfo = await userInfoResponse.json();
      console.log('User Info Retrieved:', {
        userInfoKeys: Object.keys(userInfo)
      });

      localStorage.setItem(`${storageKey}user_info`, JSON.stringify(userInfo));

      // Redirect to the specific page
      if (typeof window !== 'undefined') {
        window.location.href = `${window.location.origin}/Page`;
      }

      return userInfo;
    } catch (error: unknown) {
      const errorDetails = error instanceof Error 
        ? {
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack
          }
        : {
            errorName: 'Unknown Error',
            errorMessage: String(error),
            errorStack: null
          };

      console.error('Authentication callback failed:', errorDetails);
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
      console.error('Failed to get user info:', error);
      return null;
    }
  };

  return {
    login,
    handleCallback,
    logout,
    getUserInfo
  };
}
