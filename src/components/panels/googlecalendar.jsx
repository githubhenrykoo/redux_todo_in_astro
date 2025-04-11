import React, { useState, useEffect } from 'react';
import { loadGoogleApi, signIn, signOut, listEvents, getAuthInstance } from '../../lib/google-calendar.js';

const GoogleCalendar = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeGoogleApi = async () => {
      if (isInitialized) return;
      
      try {
        await loadGoogleApi();
        const authInstance = getAuthInstance();
        
        // Set initial authentication state
        const initialSignedIn = authInstance.isSignedIn.get();
        setIsAuthenticated(initialSignedIn);
        
        // Listen for sign-in state changes
        authInstance.isSignedIn.listen((isSignedIn) => {
          console.log('Auth state changed:', isSignedIn);
          setIsAuthenticated(isSignedIn);
          if (isSignedIn) {
            fetchEvents().catch(console.error);
          } else {
            setEvents([]);
          }
        });

        setIsInitialized(true);

        if (initialSignedIn) {
          await fetchEvents();
        }
      } catch (err) {
        console.error('Error initializing Google Calendar API:', err);
        setError('Failed to initialize Google Calendar. Please refresh the page and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeGoogleApi();
  }, [isInitialized]);

  const handleSignIn = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await signIn();
      // The auth state listener will handle fetching events
    } catch (err) {
      console.error('Sign in error:', err);
      if (err.error === 'popup_blocked_by_browser') {
        setError('Please allow popups for this site to sign in with Google.');
      } else if (err.error === 'access_denied') {
        setError('Access denied. Please grant calendar access to view your events.');
      } else {
        setError('Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await signOut();
      setEvents([]);
    } catch (err) {
      console.error('Sign out error:', err);
      setError('Failed to sign out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await listEvents();
      setEvents(response.result.items || []);
    } catch (err) {
      console.error('Calendar fetch error:', err);
      if (err.status === 403) {
        setError('Access denied. Please ensure you have granted calendar access.');
        setIsAuthenticated(false);
      } else {
        setError('Failed to fetch calendar events. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-full dark:bg-gray-800">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-blue-400"></div>
    </div>
  );

  if (error) return (
    <div className="p-4 dark:bg-gray-800">
      <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-200 text-sm font-medium">{error}</p>
        <div className="mt-3 flex gap-2">
          {isAuthenticated && (
            <button
              onClick={fetchEvents}
              className="text-sm bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              Retry
            </button>
          )}
          <button
            onClick={() => setError(null)}
            className="text-sm bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 h-full overflow-auto dark:bg-gray-800 dark:text-white">
      {!isAuthenticated ? (
        <div className="flex items-center justify-center h-full">
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,12.151L12.545,12.151c0,1.054,0.855,1.909,1.909,1.909h3.536c-0.607,1.972-2.101,3.467-4.073,4.073v-1.909c0-1.054-0.855-1.909-1.909-1.909h-3.536c0.607-1.972,2.101-3.467,4.073-4.073V12.151z M12,2C6.477,2,2,6.477,2,12c0,5.523,4.477,10,10,10s10-4.477,10-10C22,6.477,17.523,2,12,2z M12,20c-4.418,0-8-3.582-8-8s3.582-8,8-8s8,3.582,8,8S16.418,20,12,20z"/>
            </svg>
            <span>{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold dark:text-white">Upcoming Events</h2>
            <button
              onClick={handleSignOut}
              disabled={isLoading}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">No upcoming events</p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg hover:shadow-md transition-shadow dark:bg-gray-700">
                  <h3 className="font-semibold text-lg dark:text-white">{event.summary}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {new Date(event.start.dateTime || event.start.date).toLocaleString()}
                  </p>
                  {event.description && (
                    <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">{event.description}</p>
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