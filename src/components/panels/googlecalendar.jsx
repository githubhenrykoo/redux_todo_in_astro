import React, { useState, useEffect } from 'react';
import { gapi } from 'gapi-script';

const GoogleCalendar = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeGoogleApi = async () => {
      try {
        await gapi.client.init({
          apiKey: 'AIzaSyCng_GxCcoeRozBaw03cwN9QE-xu0WFlrI',
          clientId: '453579831938-addktpr31j59mgitmuiemjtkb5pjs5am.apps.googleusercontent.com',
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
          scope: 'https://www.googleapis.com/auth/calendar.readonly',
          ux_mode: 'popup',
          redirect_uri: 'http://localhost:4321'
        });

        // Check if user is signed in
        const authInstance = gapi.auth2.getAuthInstance();
        setIsAuthenticated(authInstance.isSignedIn.get());

        // Listen for sign-in state changes
        authInstance.isSignedIn.listen((isSignedIn) => {
          setIsAuthenticated(isSignedIn);
          if (isSignedIn) {
            fetchEvents();
          }
        });

        if (authInstance.isSignedIn.get()) {
          fetchEvents();
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        setError('Failed to initialize Google Calendar API');
        setIsLoading(false);
      }
    };

    gapi.load('client:auth2', initializeGoogleApi);
  }, []);

  const handleSignIn = () => {
    const authInstance = gapi.auth2.getAuthInstance();
    authInstance.signIn();
  };

  const handleSignOut = () => {
    const authInstance = gapi.auth2.getAuthInstance();
    authInstance.signOut();
    setEvents([]);
  };

  const fetchEvents = async () => {
    try {
      const response = await gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 10,
        orderBy: 'startTime',
      });

      setEvents(response.result.items);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to fetch calendar events');
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading calendar events...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      {!isAuthenticated ? (
        <button
          onClick={handleSignIn}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Sign in with Google
        </button>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Upcoming Events</h2>
            <button
              onClick={handleSignOut}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border p-3 rounded-lg">
                <h3 className="font-semibold">{event.summary}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(event.start.dateTime || event.start.date).toLocaleString()}
                </p>
                {event.description && (
                  <p className="text-sm mt-2">{event.description}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default GoogleCalendar;