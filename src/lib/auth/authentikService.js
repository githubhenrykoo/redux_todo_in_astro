/**
 * Authentik Authentication Service
 * 
 * Provides authentication functionality for connecting to Authentik
 * without Redux integration. This service is completely isolated and
 * won't affect other parts of the application.
 */

/**
 * Default authentication configuration
 */
const defaultAuthConfig = {
  baseUrl: 'https://auth.pkc.pub',
  clientId: '',
  redirectUri: window.location.origin,
  scopes: 'openid profile email',
  storageKey: 'authentik_auth',
  responseType: 'code',
};

/**
 * Initialize authentication configuration
 * @param {Object} config Configuration parameters
 * @returns {Object} Authentication configuration
 */
export function initAuth(config = {}) {
  return {
    ...defaultAuthConfig,
    ...config,
  };
}

/**
 * Generate a cryptographically secure random string
 * @param {number} length Length of the string
 * @returns {string} Random string
 */
export function generateRandomString(length = 32) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').substring(0, length);
}

/**
 * Generate code challenge for PKCE
 * @param {string} codeVerifier Code verifier
 * @returns {Promise<string>} Code challenge
 */
export async function generateCodeChallenge(codeVerifier) {
  // Convert string to Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  
  // Hash the code verifier with SHA-256
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  
  // Convert hash to base64url format
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Get login URL for Authentik
 * @param {Object} auth Authentication configuration
 * @param {string} state Optional state parameter for CSRF protection
 * @returns {string} Login URL
 */
export function getLoginUrl(auth, state = null) {
  // Create code verifier and store it
  const codeVerifier = generateRandomString(64);
  localStorage.setItem(`${auth.storageKey}_code_verifier`, codeVerifier);
  
  // Generate state if not provided
  if (!state) {
    state = generateRandomString(32);
    localStorage.setItem(`${auth.storageKey}_auth_state`, state);
  }
  
  // Build URL with PKCE code challenge
  return generateCodeChallenge(codeVerifier).then(codeChallenge => {
    const params = new URLSearchParams({
      client_id: auth.clientId,
      redirect_uri: auth.redirectUri,
      response_type: auth.responseType,
      scope: auth.scopes,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    
    const loginUrl = `${auth.baseUrl}/application/o/authorize/?${params.toString()}`;
    
    // Either return the URL or redirect directly based on config
    if (auth.autoRedirect !== false) {
      window.location.href = loginUrl;
    }
    
    return loginUrl;
  });
}

/**
 * Exchange authorization code for tokens
 * @param {Object} auth Authentication configuration
 * @param {string} code Authorization code
 * @returns {Promise<Object>} Token response
 */
export async function exchangeCodeForToken(auth, code) {
  // Get code verifier from storage
  const codeVerifier = localStorage.getItem(`${auth.storageKey}_code_verifier`);
  if (!codeVerifier) {
    throw new Error('Code verifier not found. The authentication flow may have expired or been tampered with.');
  }
  
  // Exchange code for token
  const params = new URLSearchParams({
    client_id: auth.clientId,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: auth.redirectUri,
    code_verifier: codeVerifier,
  });
  
  const response = await fetch(`${auth.baseUrl}/application/o/token/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  
  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }
  
  // Clean up code verifier
  localStorage.removeItem(`${auth.storageKey}_code_verifier`);
  
  return response.json();
}

/**
 * Get user information using access token
 * @param {string} accessToken Access token
 * @param {string} baseUrl Authentik base URL
 * @returns {Promise<Object>} User information
 */
export async function getUserInfo(accessToken, baseUrl = 'https://auth.pkc.pub') {
  const response = await fetch(`${baseUrl}/application/o/userinfo/`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get logout URL for Authentik
 * @param {Object} auth Authentication configuration
 * @returns {string} Logout URL
 */
export function getLogoutUrl(auth) {
  // Clean up after ourselves
  localStorage.removeItem(`${auth.storageKey}_auth_state`);
  
  // Build logout URL
  const redirectUri = encodeURIComponent(auth.redirectUri);
  return `${auth.baseUrl}/application/o/logout/?redirect_uri=${redirectUri}`;
}

/**
 * Save authentication data to storage
 * @param {Object} auth Authentication configuration
 * @param {Object} authData Authentication data
 */
export function saveAuth(auth, authData) {
  localStorage.setItem(auth.storageKey, JSON.stringify({
    ...authData,
    expires_at: Date.now() + authData.expires_in * 1000,
    updated_at: Date.now(),
  }));
}

/**
 * Get authentication data from storage
 * @param {Object} auth Authentication configuration
 * @returns {Object|null} Authentication data or null if not found or expired
 */
export function getAuth(auth) {
  const authJson = localStorage.getItem(auth.storageKey);
  if (!authJson) return null;
  
  try {
    const authData = JSON.parse(authJson);
    
    // Check if token is expired
    if (authData.expires_at && authData.expires_at < Date.now()) {
      removeAuth(auth);
      return null;
    }
    
    return authData;
  } catch (e) {
    console.error('Failed to parse auth data:', e);
    removeAuth(auth);
    return null;
  }
}

/**
 * Remove authentication data from storage
 * @param {Object} auth Authentication configuration
 */
export function removeAuth(auth) {
  localStorage.removeItem(auth.storageKey);
  localStorage.removeItem(`${auth.storageKey}_code_verifier`);
  localStorage.removeItem(`${auth.storageKey}_auth_state`);
}
