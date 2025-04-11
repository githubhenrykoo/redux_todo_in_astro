// Google Calendar API configuration
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly'
];
const CLIENT_ID = '453579831938-addktpr31j59mgitmuiemjtkb5pjs5am.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCng_GxCcoeRozBaw03cwN9QE-xu0WFlrI';

// Load the Google API client library
export const loadGoogleApi = () => {
  return new Promise((resolve, reject) => {
    if (window.gapi) {
      initializeGapiClient().then(() => resolve(window.gapi)).catch(reject);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.gapi.load('client:auth2', async () => {
        try {
          await initializeGapiClient();
          resolve(window.gapi);
        } catch (err) {
          reject(err);
        }
      });
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const initializeGapiClient = async () => {
  await window.gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
    scope: SCOPES.join(' '),
    plugin_name: 'calendar'
  });
};

// Get auth instance
export const getAuthInstance = () => {
  if (!window.gapi || !window.gapi.auth2) {
    throw new Error('Google API not initialized');
  }
  return window.gapi.auth2.getAuthInstance();
};

// Sign in
export const signIn = async () => {
  const auth = getAuthInstance();
  const options = {
    scope: SCOPES.join(' '),
    prompt: 'consent',
    ux_mode: 'popup'
  };
  
  try {
    const user = await auth.signIn(options);
    const token = user.getAuthResponse().access_token;
    window.gapi.client.setToken({
      access_token: token
    });
    return user;
  } catch (err) {
    console.error('Sign in error:', err);
    throw err;
  }
};

// Sign out
export const signOut = async () => {
  const auth = getAuthInstance();
  await auth.signOut();
  window.gapi.client.setToken(null);
};

// List calendar events
export const listEvents = async () => {
  const auth = getAuthInstance();
  if (!auth.isSignedIn.get()) {
    throw new Error('User not signed in');
  }

  // Ensure we have a valid token
  const user = auth.currentUser.get();
  const token = user.getAuthResponse().access_token;
  window.gapi.client.setToken({
    access_token: token
  });

  return window.gapi.client.calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    showDeleted: false,
    singleEvents: true,
    maxResults: 10,
    orderBy: 'startTime'
  });
};
