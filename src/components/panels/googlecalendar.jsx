import React, { useState, useEffect } from 'react';
import { gapi } from 'gapi-script';

// Single scope for calendar read-only access
const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const CLIENT_ID = '453579831938-addktpr31j59mgitmuiemjtkb5pjs5am.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCng_GxCcoeRozBaw03cwN9QE-xu0WFlrI';

const GoogleCalendar = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authInstance, setAuthInstance] = useState(null);

  useEffect(() => {
    const loadGapiAndInitialize = async () => {
      try {
        // Load the Google API client library
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://apis.google.com/js/api.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });

        await new Promise((resolve) => gapi.load('client:auth2', resolve));

        // Initialize the client
        await gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
          scope: SCOPE
        });

        // Get auth instance
        const auth2 = gapi.auth2.getAuthInstance();
        if (!auth2) {
          throw new Error('Failed to initialize Google Auth');
        }

        setAuthInstance(auth2);
        setIsAuthenticated(auth2.isSignedIn.get());

        // Listen for sign-in state changes
        auth2.isSignedIn.listen((isSignedIn) => {
          console.log('Sign in state changed:', isSignedIn);
          setIsAuthenticated(isSignedIn);
          if (isSignedIn) {
            fetchEvents();
          } else {
            setEvents([]);
          }
        });

        if (auth2.isSignedIn.get()) {
          fetchEvents();
        }
      } catch (err) {
        console.error('Error initializing Google Calendar API:', err);
        setError(`Initialization error: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadGapiAndInitialize();
  }, []);

  const handleSignIn = async () => {
    try {
      setError(null);
      if (!authInstance) {
        throw new Error('Google Auth not initialized');
      }

      const user = await authInstance.signIn({
        prompt: 'consent',
        scope: SCOPE
      });

      // Check if we have the calendar scope
      const hasCalendarScope = user.hasGrantedScopes(SCOPE);
      console.log('Has calendar scope:', hasCalendarScope);
      
      if (!hasCalendarScope) {
        // Request additional scope if needed
        await user.grant({ scope: SCOPE });
      }

      await fetchEvents();
    } catch (err) {
      console.error('Sign in error:', err);
      setError(`Sign in error: ${err.message}`);
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      if (!authInstance) {
        throw new Error('Google Auth not initialized');
      }
      await authInstance.signOut();
      setEvents([]);
    } catch (err) {
      console.error('Sign out error:', err);
      setError(`Sign out error: ${err.message}`);
    }
  };

  const fetchEvents = async () => {
    try {
      setError(null);
      const response = await gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 10,
        orderBy: 'startTime',
      });

      console.log('Calendar API response:', response);

      if (!response || !response.result) {
        throw new Error('Invalid response from Google Calendar API');
      }

      if (response.result.error) {
        throw new Error(response.result.error.message);
      }

      setEvents(response.result.items || []);
    } catch (err) {
      console.error('Calendar fetch error:', err);
      let errorMessage = 'Failed to fetch calendar events';
      
      if (err.result?.error?.message) {
        errorMessage = `API Error: ${err.result.error.message}`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  if (error) return (
    <div className="p-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm font-medium">Error: {error}</p>
        <div className="mt-3 flex gap-2">
          {isAuthenticated && (
            <button
              onClick={fetchEvents}
              className="text-sm bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Retry
            </button>
          )}
          <button
            onClick={() => setError(null)}
            className="text-sm bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 h-full overflow-auto">
      {!isAuthenticated ? (
        <div className="flex items-center justify-center h-full">
          <button
            onClick={handleSignIn}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,12.151L12.545,12.151c0,1.054,0.855,1.909,1.909,1.909h3.536c-0.607,1.972-2.101,3.467-4.073,4.073v-1.909c0-1.054-0.855-1.909-1.909-1.909h-3.536c0.607-1.972,2.101-3.467,4.073-4.073V12.151z M12,2C6.477,2,2,6.477,2,12c0,5.523,4.477,10,10,10s10-4.477,10-10C22,6.477,17.523,2,12,2z M12,20c-4.418,0-8-3.582-8-8s3.582-8,8-8s8,3.582,8,8S16.418,20,12,20z"/>
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Upcoming Events</h2>
            <button
              onClick={handleSignOut}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-center text-gray-500">No upcoming events</p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg">{event.summary}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(event.start.dateTime || event.start.date).toLocaleString()}
                  </p>
                  {event.description && (
                    <p className="text-sm mt-2 text-gray-700">{event.description}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GoogleCalendar;