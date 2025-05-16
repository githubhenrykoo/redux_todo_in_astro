// Google Calendar API configuration
const CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.GOOGLE_API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Load the Google API client library
export const loadGoogleApi = async () => {
  try {
    console.log('Starting Google API initialization');
    
    // Check if we're in SSR (Server-Side Rendering)
    if (typeof window === 'undefined') {
      console.log('Skipping Google API initialization in SSR');
      return;
    }
    
    // Load the Google API client
    await new Promise((resolve, reject) => {
      if (window.gapi) {
        console.log('GAPI already loaded');
        resolve();
        return;
      }
      
      console.log('Loading GAPI script');
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        console.log('GAPI script loaded');
        resolve();
      };
      script.onerror = (e) => {
        console.error('Error loading GAPI script:', e);
        reject(new Error('Failed to load Google API script'));
      };
      document.head.appendChild(script);
    });

    // Initialize the gapi.client
    await new Promise((resolve, reject) => {
      console.log('Initializing GAPI client');
      window.gapi.load('client', {
        callback: () => {
          console.log('GAPI client loaded');
          resolve();
        },
        onerror: (e) => {
          console.error('Error loading GAPI client:', e);
          reject(new Error('Failed to load GAPI client'));
        },
        timeout: 5000,
        ontimeout: () => reject(new Error('GAPI client load timeout'))
      });
    });

    // Initialize gapi client
    console.log('Initializing GAPI client with API key');
    await window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    
    gapiInited = true;
    console.log('GAPI successfully initialized');

    // Load the Google Identity Service
    await new Promise((resolve, reject) => {
      if (window.google && window.google.accounts && window.google.accounts.oauth2) {
        console.log('GIS already loaded');
        resolve();
        return;
      }
      
      console.log('Loading GIS script');
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        console.log('GIS script loaded');
        resolve();
      };
      script.onerror = (e) => {
        console.error('Error loading GIS script:', e);
        reject(new Error('Failed to load Google Identity Services script'));
      };
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    });

    // Wait for the Google Identity Services to be ready
    await new Promise((resolve, reject) => {
      console.log('Waiting for GIS to be ready');
      const maxAttempts = 50;
      let attempts = 0;
      
      const checkGisReady = () => {
        attempts++;
        if (window.google && window.google.accounts && window.google.accounts.oauth2) {
          console.log('GIS is ready');
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Timeout waiting for Google Identity Services to load'));
        } else {
          console.log(`Waiting for GIS (attempt ${attempts}/${maxAttempts})`);
          setTimeout(checkGisReady, 100);
        }
      };
      checkGisReady();
    });
    
    // Initialize token client
    console.log('Initializing token client');
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      prompt: '',
      callback: '', // We'll define this at sign-in time
    });
    
    gisInited = true;
    console.log('GIS successfully initialized');

  } catch (err) {
    console.error('Error loading Google API:', err);
    gapiInited = false;
    gisInited = false;
    throw new Error(`Failed to load Google Calendar API: ${err.message}`);
  }
};

// Check if the APIs are initialized
export const isInitialized = () => {
  return gapiInited && gisInited;
};

// Get auth instance - may return undefined if gapi auth2 isn't loaded
export const getAuthInstance = () => {
  return window.gapi.auth2?.getAuthInstance();
};

// Sign in
export const signIn = () => {
  if (!isInitialized()) {
    throw new Error('Google API not initialized');
  }

  return new Promise((resolve, reject) => {
    try {
      // Set the callback for token response
      tokenClient.callback = async (response) => {
        if (response.error) {
          reject({ error: response.error, error_description: response.error_description });
          return;
        }
        
        try {
          // Set the token in gapi
          await window.gapi.client.setToken(response);
          console.log('Successfully signed in');
          resolve(response);
        } catch (err) {
          reject(err);
        }
      };
      
      // Request an access token
      if (window.gapi.client.getToken() === null) {
        // First time requesting a token
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        // Subsequent request - use no prompt
        tokenClient.requestAccessToken({ prompt: '' });
      }
    } catch (err) {
      console.error('Sign in error:', err);
      reject(err);
    }
  });
};

// Sign out
export const signOut = async () => {
  if (!isInitialized()) {
    return;
  }
  
  const token = window.gapi.client.getToken();
  if (token !== null) {
    try {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken(null);
      console.log('Successfully signed out');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  }
};

// List calendar events
export const listEvents = async () => {
  if (!isInitialized()) {
    throw new Error('Google API not initialized');
  }
  
  // Check if we have a token
  if (!window.gapi.client.getToken()) {
    throw new Error('Not signed in', { status: 401 });
  }
  
  try {
    const timeMin = new Date();
    timeMin.setHours(0, 0, 0, 0);
    
    const response = await window.gapi.client.calendar.events.list({
      'calendarId': 'primary',
      'timeMin': timeMin.toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': 50,
      'orderBy': 'startTime'
    });
    
    return response;
  } catch (err) {
    console.error('Error fetching events:', err);
    
    // Handle token expiration
    if (err.status === 401) {
      // Token expired, try to refresh
      try {
        await signIn();
        return listEvents(); // Try again after signing in
      } catch (refreshErr) {
        throw refreshErr;
      }
    }
    
    throw err;
  }
};
