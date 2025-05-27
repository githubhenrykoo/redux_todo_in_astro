import React, { useState, useEffect } from 'react';
import { loadGoogleApi, signIn, signOut, listEvents, getAuthInstance, isInitialized } from '../../lib/google-calendar.js';

const ViewToggle = ({ view, onViewChange }) => (
  <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
    <button
      onClick={() => onViewChange('grid')}
      className={`px-4 py-2 rounded ${
        view === 'grid'
          ? 'bg-white dark:bg-gray-600 shadow-sm'
          : 'text-gray-600 dark:text-gray-300'
      }`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    </button>
    <button
      onClick={() => onViewChange('list')}
      className={`px-4 py-2 rounded ${
        view === 'list'
          ? 'bg-white dark:bg-gray-600 shadow-sm'
          : 'text-gray-600 dark:text-gray-300'
      }`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    </button>
  </div>
);

const FilterBar = ({ searchTerm, onSearchChange }) => (
  <div className="relative">
    <input
      type="text"
      placeholder="Search events..."
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
    />
    <svg
      className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 dark:text-gray-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  </div>
);

const EventCard = ({ event, view }) => {
  const date = new Date(event.start.dateTime || event.start.date);
  const formattedDate = date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  if (view === 'grid') {
    return (
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-4 hover:shadow-md transition-shadow">
        <div className="text-sm text-blue-600 dark:text-blue-400 mb-2">{formattedDate}</div>
        <h3 className="font-semibold text-lg dark:text-white mb-2">{event.summary}</h3>
        {event.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{event.description}</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="text-sm text-blue-600 dark:text-blue-400 whitespace-nowrap">{formattedDate}</div>
        <div>
          <h3 className="font-semibold text-lg dark:text-white mb-2">{event.summary}</h3>
          {event.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300">{event.description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const GoogleCalendar = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [view, setView] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [configError, setConfigError] = useState(false);

  // Initialize Google API
  useEffect(() => {
    const initializeGoogleApi = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // No longer need to check for API keys since they're hardcoded
        
        await loadGoogleApi();
        
        // Check if user is already authenticated by checking for token
        const token = window.gapi.client.getToken();
        setIsAuthenticated(token !== null);
        
        if (token !== null) {
          await fetchEvents();
        }
      } catch (err) {
        console.error('Error initializing Google Calendar API:', err);
        if (err.message && err.message.includes('400')) {
          setConfigError(true);
          setError('Invalid Google Calendar API key. Please check your API credentials.');
        } else {
          setError('Failed to initialize Google Calendar. Please check your internet connection and refresh the page.');
        }
      } finally {
        setIsLoading(false);
        setIsInitializing(false);
      }
    };

    // Avoid initialization during server-side rendering
    if (typeof window !== 'undefined') {
      initializeGoogleApi();
    } else {
      setIsLoading(false);
      setIsInitializing(false);
    }
  }, []);

  const handleSignIn = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      await signIn();
      setIsAuthenticated(true);
      
      const response = await listEvents();
      const events = response.result.items || [];
      setEvents(events);
      
      // Send events to API endpoint
      await sendEventsToContext(events);
      
      // Calculate today's meetings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayEvents = events.filter(event => {
        const eventDate = new Date(event.start.dateTime || event.start.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === today.getTime();
      });
      
      // Set error message based on today's meetings
      if (todayEvents.length > 0) {
        setError(`You have ${todayEvents.length} meeting${todayEvents.length > 1 ? 's' : ''} today`);
      } else {
        setError('No meeting today, would you like to take a vacation?');
      }
      
    } catch (err) {
      console.error('Sign in error:', err);
      
      if (err.error === 'popup_blocked_by_browser') {
        setError('Please allow popups for this site to sign in with Google.');
      } else if (err.error === 'access_denied') {
        setError('Access denied. Please grant calendar access to view your events.');
      } else if (err.error === 'immediate_failed') {
        setError('Authentication failed. Please try again.');
      } else if (err.message && err.message.includes('Cross-Origin-Opener-Policy')) {
        setError('Browser security policy blocked the sign-in process. Please try using a different browser or disable enhanced tracking protection for this site.');
      } else {
        setError('Failed to sign in. Please try again.');
      }
      
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      await signOut();
      setIsAuthenticated(false);
      setEvents([]);
      
    } catch (err) {
      console.error('Sign out error:', err);
      setError('Failed to sign out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendEventsToContext = async (events) => {
    try {
      const today = new Date();
      const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const oneMonthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

      // Filter events for different time periods
      const todayEvents = events.filter(event => {
        const eventDate = new Date(event.start.dateTime || event.start.date);
        return eventDate.toDateString() === today.toDateString();
      });

      const weekEvents = events.filter(event => {
        const eventDate = new Date(event.start.dateTime || event.start.date);
        return eventDate <= oneWeekFromNow && eventDate >= today;
      });

      const monthEvents = events.filter(event => {
        const eventDate = new Date(event.start.dateTime || event.start.date);
        return eventDate <= oneMonthFromNow && eventDate >= today;
      });

      // Format events data
      const eventsContext = {
        today: todayEvents.map(event => ({
          summary: event.summary,
          start: event.start.dateTime || event.start.date,
          end: event.end.dateTime || event.end.date
        })),
        week: weekEvents.map(event => ({
          summary: event.summary,
          start: event.start.dateTime || event.start.date,
          end: event.end.dateTime || event.end.date
        })),
        month: monthEvents.map(event => ({
          summary: event.summary,
          start: event.start.dateTime || event.start.date,
          end: event.end.dateTime || event.end.date
        }))
      };

      // Send to API
      await fetch('http://localhost:4321/api/card-collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add',
          card: {
            content: {
              dimensionType: 'abstractSpecification',
              context: JSON.stringify(eventsContext),
              goal: '',
              successCriteria: ''
            }
          }
        })
      });
    } catch (error) {
      console.error('Error sending events to context:', error);
    }
  };

  // Update fetchEvents to include sending to context
  const fetchEvents = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      if (!isInitialized()) {
        throw new Error('Google API not initialized');
      }
      
      const response = await listEvents();
      const events = response.result.items || [];
      
      // Send events to context
      await sendEventsToContext(events);
      
      // Calculate today's meetings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayEvents = events.filter(event => {
        const eventDate = new Date(event.start.dateTime || event.start.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === today.getTime();
      });
      
      setEvents(events);
      
      // Set error message based on today's meetings
      if (todayEvents.length > 0) {
        setError(`You have ${todayEvents.length} meeting${todayEvents.length > 1 ? 's' : ''} today`);
      } else {
        setError('No meeting today, would you like to take a vacation?');
      }
      
    } catch (err) {
      console.error('Calendar fetch error:', err);
      
      if (err.status === 403) {
        setError('Access denied. Please ensure you have granted calendar access and try signing in again.');
        setIsAuthenticated(false);
      } else if (err.status === 401) {
        setError('Your session has expired. Please sign in again.');
        setIsAuthenticated(false);
      } else {
        setError('Failed to fetch calendar events. Please check your internet connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const searchLower = searchTerm.toLowerCase();
    return (
      event.summary?.toLowerCase().includes(searchLower) ||
      event.description?.toLowerCase().includes(searchLower)
    );
  });

  const todayMeetings = events.filter(event => {
    const today = new Date();
    const eventDate = new Date(event.start.dateTime || event.start.date);
    return eventDate.toDateString() === today.toDateString();
  });

  // For initial loading state
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-full dark:bg-gray-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-blue-400"></div>
      </div>
    );
  }

  // For configuration errors, show a more helpful message
  if (configError) {
    return (
      <div className="p-6 dark:bg-gray-800">
        <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">Configuration Required</h3>
          <p className="text-yellow-700 dark:text-yellow-300 mb-4">{error}</p>
          <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700 mb-4">
            <p className="text-sm font-mono mb-2">1. Create a <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">.env</code> file in your project root with:</p>
            <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs overflow-auto">
              PUBLIC_GOOGLE_API_KEY=your_api_key_here<br/>
              PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
            </pre>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You'll need to create these credentials in the <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">Google Cloud Console</a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Show today's meetings summary */}
      {isAuthenticated && (
        <div className="text-center rounded-lg p-3 mb-4">
          {todayMeetings.length > 0 ? (
            <div className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg p-3">
              <p className="text-lg font-semibold">
                You have {todayMeetings.length} {todayMeetings.length === 1 ? 'meeting' : 'meetings'} today
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg p-3">
              <p className="text-lg font-semibold">
                No meeting today, would you like to take a vacation?
              </p>
            </div>
          )}
        </div>
      )}

      {!isAuthenticated ? (
        <div className="flex items-center justify-center h-full">
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold dark:text-white">Upcoming Events</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={fetchEvents}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh events"
                >
                  <svg
                    className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span className="sr-only">Refresh</span>
                </button>
                <ViewToggle view={view} onViewChange={setView} />
                <button
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            </div>
            <FilterBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64 mt-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-blue-400"></div>
            </div>
          ) : (
            <div className={`mt-6 ${view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}`}>
              {filteredEvents.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 col-span-full">
                  {searchTerm ? 'No events match your search' : 'No upcoming events'}
                </p>
              ) : (
                filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} view={view} />
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GoogleCalendar;
