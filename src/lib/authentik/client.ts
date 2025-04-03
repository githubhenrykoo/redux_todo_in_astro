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
      
      // Hardcode the redirect URI based on hostname for maximum reliability
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      const hardcodedRedirectUri = isLocalhost ? 'http://localhost:4321/callback' : 'http://todo.pkc.pub/callback';
      url.searchParams.set('redirect_uri', hardcodedRedirectUri);
      
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', scopes);
      
      // Debug information for redirect URI issues
      console.log('Authentication Redirect Debug:', {
        authUrl: url.toString(),
        isLocalhost,
        hardcodedRedirectUri,
        clientId: clientId ? '[PRESENT]' : '[MISSING]',
        baseUrl: sanitizedBaseUrl
      });
      
      // Store the original URL to return after authentication
      localStorage.setItem(`${storageKey}redirect_uri`, currentUrl);

      // Redirect to Authentik login
      window.location.href = url.toString();
    } catch (error) {
      console.error('Login initialization failed:', error);
      throw error;
    }
  };

  const handleCallback = async (code: string): Promise<UserInfo> => {
    console.log('AUTHENTIK DEBUG: handleCallback START', {
      code: code.substring(0, 5) + '...',
      storageKey,
      baseUrl: (baseUrl || '').toString().replace(/\/+$/, '')
    });

    try {
      // Ensure baseUrl is a string and remove trailing slashes
      const sanitizedBaseUrl = (baseUrl || '').toString().replace(/\/+$/, '');

      if (!sanitizedBaseUrl) {
        throw new Error('Invalid Authentik base URL');
      }

      // Validate input parameters
      if (!code) {
        console.error('AUTHENTIK ERROR: No authorization code provided');
        throw new Error('Authorization code is required');
      }
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      if (!clientSecret) {
        throw new Error('Client Secret is required');
      }
      if (!redirectUri) {
        console.error('AUTHENTIK ERROR: No redirect URI provided');
        throw new Error('Redirect URI is required');
      }

      // Check if we're running on localhost and adjust the redirect URI
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      const hardcodedRedirectUri = isLocalhost ? 'http://localhost:4321/callback' : 'http://todo.pkc.pub/callback';

      // Exchange authorization code for tokens
      const tokenUrl = new URL(`${sanitizedBaseUrl}/application/o/token/`);
      
      console.log('DEBUG TOKEN EXCHANGE CONFIGURATION:', {
        tokenUrl: tokenUrl.toString(),
        clientId,
        redirectUri: hardcodedRedirectUri,
        baseUrl: sanitizedBaseUrl,
        codeLength: code.length,
        clientSecretLength: clientSecret.length
      });

      // Detailed logging of parameters for token exchange
      const tokenParams = new URLSearchParams();
      tokenParams.append('client_id', clientId);
      tokenParams.append('client_secret', clientSecret);
      tokenParams.append('redirect_uri', hardcodedRedirectUri);
      tokenParams.append('grant_type', 'authorization_code');
      tokenParams.append('code', code);
      
      console.log('DEBUG TOKEN EXCHANGE PARAMS:', 
        Object.fromEntries(tokenParams.entries())
      );

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
          redirectUriUsed: hardcodedRedirectUri
        });
        throw new Error(`Network error during token exchange: ${errorDetails.errorMessage}`);
      }

      // Add a try-catch around the entire token response handling
      let responseData;
      try {
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

        // Try to get the response as text first to inspect it
        const responseText = await tokenResponse.text();
        console.log('Raw token response text:', responseText.substring(0, 200) + '...');
        
        try {
          // Then parse it as JSON
          responseData = JSON.parse(responseText);
          console.log('Token response successfully parsed:', {
            dataReceived: !!responseData,
            responseKeys: responseData ? Object.keys(responseData) : []
          });
          
          // Direct storage of tokens in localStorage
          if (responseData && typeof responseData === 'object') {
            try {
              // Store auth tokens immediately to prevent loss
              const authStorageKeyPrefix = 'authentik_';
              
              // Store all token response data
              localStorage.setItem(`${authStorageKeyPrefix}token_response`, JSON.stringify(responseData));
              
              // Store access token if available
              if (responseData.access_token) {
                localStorage.setItem(`${authStorageKeyPrefix}access_token`, responseData.access_token);
                localStorage.setItem(`${authStorageKeyPrefix}top_banner_authaccess_token`, responseData.access_token);
                console.log('Access token stored directly in localStorage during token exchange');
              }
              
              // Store ID token if available
              if (responseData.id_token) {
                localStorage.setItem(`${authStorageKeyPrefix}id_token`, responseData.id_token);
                localStorage.setItem(`${authStorageKeyPrefix}top_banner_authid_token`, responseData.id_token);
                console.log('ID token stored directly in localStorage during token exchange');
              }
              
              // Store redirect path
              localStorage.setItem(`${authStorageKeyPrefix}top_banner_authredirect_uri`, '/Page');
              
              console.log('Token data stored in localStorage with keys:', 
                Object.keys(localStorage).filter(k => k.includes(authStorageKeyPrefix))
              );
            } catch (storageError) {
              console.error('Error storing token data in localStorage:', storageError);
            }
          }
        } catch (jsonError) {
          console.error('Error parsing token response JSON:', {
            error: jsonError instanceof Error ? jsonError.message : String(jsonError),
            responseText: responseText.substring(0, 200) + '...'
          });
          throw new Error(`Error parsing token response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
        }
      } catch (textError) {
        console.error('Error reading token response body:', textError);
        throw new Error('Failed to read token response body');
      }
      
      // Continue with the tokens
      const tokens = responseData;
      
      // Validate tokens
      if (!tokens.access_token) {
        console.error('No access token received in response:', tokens);
        throw new Error('No access token received');
      }

      // Store tokens
      console.log('Storing tokens with key prefix:', storageKey);
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

      // Store user info in localStorage with the configured key
      localStorage.setItem(`${storageKey}user_info`, JSON.stringify(userInfo));
      
      // Also store tokens with the user info for convenience
      const combinedUserInfo = {
        ...userInfo,
        access_token: tokens.access_token,
        id_token: tokens.id_token || '',
        token_type: tokens.token_type || 'Bearer'
      };
      
      // Store the combined user info for easier access
      localStorage.setItem(`${storageKey}user_info`, JSON.stringify(combinedUserInfo));

      // Remove the problematic automatic redirect that was breaking the flow
      // Let the callback.astro page handle the redirect instead
      
      return combinedUserInfo;
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
