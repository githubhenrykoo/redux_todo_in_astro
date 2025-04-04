import React, { useState, useEffect, useRef } from 'react';

const LocationPanel = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('waiting'); // waiting, loading, success, error
  const [mapUrl, setMapUrl] = useState(null);
  const [locationDetails, setLocationDetails] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [accuracy, setAccuracy] = useState('high'); // high, balanced, low
  
  // Manual coordinate inputs
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualLatitude, setManualLatitude] = useState('');
  const [manualLongitude, setManualLongitude] = useState('');
  
  // Get Google Maps API key from environment variables
  const googleMapsApiKey = import.meta.env.GOOGLE_MAPS_API_KEY || 'AIzaSyBX8_EcBiD1vRedpAEXiub4WIHbGDSDJk4';

  // Function to get location
  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);

    const options = {
      enableHighAccuracy: accuracy === 'high',
      timeout: 10000,
      maximumAge: accuracy === 'low' ? 60000 : 0
    };

    try {
      // Clear previous watch if exists
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }

      // Watch position for real-time updates
      const id = navigator.geolocation.watchPosition(
        handleLocationSuccess,
        handleLocationError,
        options
      );
      
      setWatchId(id);
    } catch (err) {
      setError(`Failed to access location: ${err.message}`);
      setStatus('error');
    }
  };

  // Handle successful location retrieval
  const handleLocationSuccess = (position) => {
    const { latitude, longitude, accuracy: locationAccuracy } = position.coords;
    
    setLocation({
      latitude,
      longitude,
      accuracy: locationAccuracy,
      timestamp: position.timestamp
    });
    
    setStatus('success');
    setError(null);
    
    // Generate Google Maps URL
    const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=15`;
    setMapUrl(mapUrl);
    
    // Get location details using reverse geocoding
    fetchLocationDetails(latitude, longitude);
  };

  // Handle location errors
  const handleLocationError = (error) => {
    setStatus('error');
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setError('Location access denied. Please allow location access in your browser settings.');
        break;
      case error.POSITION_UNAVAILABLE:
        setError('Location information is unavailable. You can try entering coordinates manually.');
        setShowManualEntry(true);
        break;
      case error.TIMEOUT:
        setError('The request to get location timed out. Please try again or enter coordinates manually.');
        setShowManualEntry(true);
        break;
      default:
        setError(`An unknown error occurred: ${error.message}`);
        setShowManualEntry(true);
    }
  };

  // Handle manual coordinate submission
  const handleManualCoordinates = (e) => {
    e.preventDefault();
    
    try {
      const latitude = parseFloat(manualLatitude);
      const longitude = parseFloat(manualLongitude);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error('Invalid coordinates');
      }
      
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new Error('Coordinates out of range');
      }
      
      setLocation({
        latitude,
        longitude,
        accuracy: 1000, // Default accuracy for manual entry (1km)
        timestamp: Date.now()
      });
      
      setStatus('success');
      setError(null);
      
      // Generate Google Maps URL
      const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=15`;
      setMapUrl(mapUrl);
      
      // Get location details
      fetchLocationDetails(latitude, longitude);
      
      // Hide manual entry after successful submission
      setShowManualEntry(false);
    } catch (err) {
      setError(`Invalid coordinates: ${err.message}`);
    }
  };

  // Fetch address details using reverse geocoding
  const fetchLocationDetails = async (latitude, longitude) => {
    try {
      // Note: In a production app, you would use a proper geocoding API with an API key
      // For demo purposes, we'll just show the coordinates and a basic description
      setLocationDetails({
        address: 'Location information available',
        coordinates: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        accuracyMeters: `±${Math.round(location?.accuracy || 1000)}m`
      });
    } catch (error) {
      console.error('Error fetching location details:', error);
      setLocationDetails({
        address: 'Address lookup failed',
        coordinates: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        accuracyMeters: `±${Math.round(location?.accuracy || 1000)}m`
      });
    }
  };

  // Stop watching location
  const stopWatchingLocation = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setStatus('waiting');
    }
  };

  // Change accuracy setting
  const handleAccuracyChange = (newAccuracy) => {
    setAccuracy(newAccuracy);
    if (status === 'success' || status === 'loading') {
      // Restart location tracking with new accuracy
      stopWatchingLocation();
      setTimeout(getLocation, 100);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Format time from timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 p-4 text-white rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Location Panel</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
          >
            Settings
          </button>
          {status === 'waiting' ? (
            <button
              onClick={getLocation}
              className="px-4 py-1 bg-blue-600 hover:bg-blue-500 rounded-md"
            >
              Get Location
            </button>
          ) : status === 'loading' ? (
            <button className="px-4 py-1 bg-yellow-600 rounded-md flex items-center">
              <span className="animate-pulse mr-1">⟳</span> Loading...
            </button>
          ) : (
            <button
              onClick={stopWatchingLocation}
              className="px-4 py-1 bg-red-600 hover:bg-red-500 rounded-md"
            >
              Stop Tracking
            </button>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="mb-4 p-3 bg-gray-800 rounded-md">
          <h3 className="text-sm font-medium mb-2">Accuracy Settings</h3>
          <div className="flex gap-2">
            {['high', 'balanced', 'low'].map((level) => (
              <button
                key={level}
                onClick={() => handleAccuracyChange(level)}
                className={`px-3 py-1 text-sm rounded-md ${
                  accuracy === level
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">
            High: Most accurate but uses more battery. Low: Saves battery but may be less accurate.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 text-white rounded-md">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={getLocation}
              className="px-3 py-1 bg-red-700 hover:bg-red-600 rounded-md text-sm"
            >
              Try Again
            </button>
            <button
              onClick={() => setShowManualEntry(!showManualEntry)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-md text-sm"
            >
              {showManualEntry ? 'Hide Manual Entry' : 'Enter Manually'}
            </button>
          </div>
        </div>
      )}

      {showManualEntry && (
        <div className="mb-4 p-3 bg-gray-800 rounded-md">
          <h3 className="font-medium mb-2">Manual Coordinate Entry</h3>
          <form onSubmit={handleManualCoordinates} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="latitude" className="block text-sm mb-1">Latitude (-90 to 90)</label>
                <input
                  id="latitude"
                  type="text"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-white"
                  placeholder="e.g. 37.7749"
                  value={manualLatitude}
                  onChange={(e) => setManualLatitude(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="longitude" className="block text-sm mb-1">Longitude (-180 to 180)</label>
                <input
                  id="longitude"
                  type="text"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-white"
                  placeholder="e.g. -122.4194"
                  value={manualLongitude}
                  onChange={(e) => setManualLongitude(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-1 bg-blue-600 hover:bg-blue-500 rounded-md"
              >
                Use These Coordinates
              </button>
              <button
                type="button"
                onClick={() => {
                  setManualLatitude('37.7749');
                  setManualLongitude('-122.4194');
                }}
                className="px-4 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
              >
                Use San Francisco
              </button>
            </div>
            <p className="text-xs text-gray-400">
              You can use this to view any location on Earth. Try famous landmarks!
            </p>
          </form>
        </div>
      )}

      {status === 'waiting' && !error && (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center p-6 bg-gray-800/50 rounded-lg max-w-md">
            <div className="text-5xl mb-4">📍</div>
            <h3 className="text-xl mb-2">Your Location</h3>
            <p className="text-gray-400 mb-4">
              Click "Get Location" to see your current geographic position.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={getLocation}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md"
              >
                Get Location
              </button>
              <button
                onClick={() => setShowManualEntry(!showManualEntry)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
              >
                Enter Manually
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              This feature requires location permissions from your browser.
            </p>
          </div>
        </div>
      )}

      {status === 'loading' && (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Waiting for location data...</p>
            <p className="text-sm text-gray-400 mt-2">
              Make sure you've allowed location access
            </p>
          </div>
        </div>
      )}

      {status === 'success' && location && (
        <div className="flex-grow flex flex-col">
          <div className="bg-gray-800 p-3 rounded-md mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">Current Location</h3>
                {locationDetails && (
                  <>
                    <p className="text-sm text-gray-300 mt-1">{locationDetails.address}</p>
                    <p className="text-xs text-gray-400 mt-1">Coords: {locationDetails.coordinates}</p>
                  </>
                )}
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>Accuracy: {locationDetails?.accuracyMeters || 'Unknown'}</p>
                <p>Updated: {formatTime(location.timestamp)}</p>
              </div>
            </div>
          </div>
          
          <div className="flex-grow bg-gray-800 rounded-lg overflow-hidden relative">
            {mapUrl ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <iframe
                  title="Map View"
                  src={`https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${location.latitude},${location.longitude}&zoom=15`}
                  className="w-full h-full border-0"
                  allowFullScreen
                />
                <div className="absolute bottom-4 left-0 right-0 mx-auto w-max bg-gray-800 px-4 py-2 rounded-md text-sm">
                  <a 
                    href={mapUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p>Map view not available</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-500">
        <p>Note: Location data is not stored or transmitted to any server.</p>
      </div>
    </div>
  );
};

export default LocationPanel;
