import React, { useState, useEffect } from 'react';

const WeatherPanel = () => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationInput, setLocationInput] = useState('');
  const [location, setLocation] = useState(null);
  const [units, setUnits] = useState('metric'); // metric or imperial
  
  // Weather icons mapping
  const weatherIcons = {
    'clear-day': '☀️',
    'clear-night': '🌙',
    'partly-cloudy-day': '⛅',
    'partly-cloudy-night': '☁️',
    'cloudy': '☁️',
    'rain': '🌧️',
    'showers-day': '🌦️',
    'showers-night': '🌧️',
    'thunder-rain': '⛈️',
    'thunder-showers-day': '⛈️',
    'thunder-showers-night': '⛈️',
    'snow': '❄️',
    'fog': '🌫️',
    'wind': '💨',
    'default': '🌡️'
  };
  
  const unitSymbols = {
    'metric': {
      temp: '°C',
      speed: 'km/h'
    },
    'imperial': {
      temp: '°F',
      speed: 'mph'
    }
  };
  
  // Simulated weather data for cities
  const simulatedCityData = {
    'New York': {
      name: 'New York',
      country: 'USA',
      current: {
        temp: units === 'metric' ? 18 : 64,
        feelslike: units === 'metric' ? 16 : 61,
        humidity: 65,
        windspeed: units === 'metric' ? 15 : 9.3,
        conditions: 'Partly cloudy',
        icon: 'partly-cloudy-day',
        pressure: 1012,
        visibility: 10,
        uvindex: 4,
        sunrise: new Date().setHours(6, 30),
        sunset: new Date().setHours(19, 45),
        tempmin: units === 'metric' ? 12 : 54,
        tempmax: units === 'metric' ? 21 : 70
      },
      forecast: [
        {
          datetime: new Date(Date.now() + 86400000),
          temp: units === 'metric' ? 19 : 66,
          tempmin: units === 'metric' ? 13 : 55,
          tempmax: units === 'metric' ? 22 : 72,
          conditions: 'Sunny',
          icon: 'clear-day',
          precipprob: 10
        },
        {
          datetime: new Date(Date.now() + 172800000),
          temp: units === 'metric' ? 17 : 63,
          tempmin: units === 'metric' ? 12 : 54,
          tempmax: units === 'metric' ? 20 : 68,
          conditions: 'Partly cloudy',
          icon: 'partly-cloudy-day',
          precipprob: 20
        },
        {
          datetime: new Date(Date.now() + 259200000),
          temp: units === 'metric' ? 15 : 59,
          tempmin: units === 'metric' ? 11 : 52,
          tempmax: units === 'metric' ? 18 : 64,
          conditions: 'Rain',
          icon: 'rain',
          precipprob: 80
        },
        {
          datetime: new Date(Date.now() + 345600000),
          temp: units === 'metric' ? 14 : 57,
          tempmin: units === 'metric' ? 10 : 50,
          tempmax: units === 'metric' ? 16 : 61,
          conditions: 'Showers',
          icon: 'showers-day',
          precipprob: 60
        },
        {
          datetime: new Date(Date.now() + 432000000),
          temp: units === 'metric' ? 16 : 61,
          tempmin: units === 'metric' ? 12 : 54,
          tempmax: units === 'metric' ? 19 : 66,
          conditions: 'Partly cloudy',
          icon: 'partly-cloudy-day',
          precipprob: 30
        }
      ]
    },
    'London': {
      name: 'London',
      country: 'UK',
      current: {
        temp: units === 'metric' ? 14 : 57,
        feelslike: units === 'metric' ? 12 : 54,
        humidity: 78,
        windspeed: units === 'metric' ? 18 : 11.2,
        conditions: 'Rain',
        icon: 'rain',
        pressure: 1008,
        visibility: 8,
        uvindex: 2,
        sunrise: new Date().setHours(6, 15),
        sunset: new Date().setHours(19, 30),
        tempmin: units === 'metric' ? 10 : 50,
        tempmax: units === 'metric' ? 16 : 61
      },
      forecast: [
        {
          datetime: new Date(Date.now() + 86400000),
          temp: units === 'metric' ? 13 : 55,
          tempmin: units === 'metric' ? 9 : 48,
          tempmax: units === 'metric' ? 15 : 59,
          conditions: 'Showers',
          icon: 'showers-day',
          precipprob: 70
        },
        {
          datetime: new Date(Date.now() + 172800000),
          temp: units === 'metric' ? 15 : 59,
          tempmin: units === 'metric' ? 11 : 52,
          tempmax: units === 'metric' ? 17 : 63,
          conditions: 'Partly cloudy',
          icon: 'partly-cloudy-day',
          precipprob: 30
        },
        {
          datetime: new Date(Date.now() + 259200000),
          temp: units === 'metric' ? 16 : 61,
          tempmin: units === 'metric' ? 12 : 54,
          tempmax: units === 'metric' ? 18 : 64,
          conditions: 'Cloudy',
          icon: 'cloudy',
          precipprob: 20
        },
        {
          datetime: new Date(Date.now() + 345600000),
          temp: units === 'metric' ? 14 : 57,
          tempmin: units === 'metric' ? 10 : 50,
          tempmax: units === 'metric' ? 16 : 61,
          conditions: 'Rain',
          icon: 'rain',
          precipprob: 80
        },
        {
          datetime: new Date(Date.now() + 432000000),
          temp: units === 'metric' ? 13 : 55,
          tempmin: units === 'metric' ? 9 : 48,
          tempmax: units === 'metric' ? 15 : 59,
          conditions: 'Showers',
          icon: 'showers-day',
          precipprob: 60
        }
      ]
    },
    'Tokyo': {
      name: 'Tokyo',
      country: 'Japan',
      current: {
        temp: units === 'metric' ? 22 : 72,
        feelslike: units === 'metric' ? 23 : 73,
        humidity: 60,
        windspeed: units === 'metric' ? 12 : 7.5,
        conditions: 'Clear',
        icon: 'clear-day',
        pressure: 1015,
        visibility: 10,
        uvindex: 7,
        sunrise: new Date().setHours(5, 45),
        sunset: new Date().setHours(18, 15),
        tempmin: units === 'metric' ? 18 : 64,
        tempmax: units === 'metric' ? 25 : 77
      },
      forecast: [
        {
          datetime: new Date(Date.now() + 86400000),
          temp: units === 'metric' ? 24 : 75,
          tempmin: units === 'metric' ? 19 : 66,
          tempmax: units === 'metric' ? 26 : 79,
          conditions: 'Sunny',
          icon: 'clear-day',
          precipprob: 0
        },
        {
          datetime: new Date(Date.now() + 172800000),
          temp: units === 'metric' ? 25 : 77,
          tempmin: units === 'metric' ? 20 : 68,
          tempmax: units === 'metric' ? 27 : 81,
          conditions: 'Partly cloudy',
          icon: 'partly-cloudy-day',
          precipprob: 10
        },
        {
          datetime: new Date(Date.now() + 259200000),
          temp: units === 'metric' ? 23 : 73,
          tempmin: units === 'metric' ? 18 : 64,
          tempmax: units === 'metric' ? 25 : 77,
          conditions: 'Rain',
          icon: 'rain',
          precipprob: 60
        },
        {
          datetime: new Date(Date.now() + 345600000),
          temp: units === 'metric' ? 21 : 70,
          tempmin: units === 'metric' ? 17 : 63,
          tempmax: units === 'metric' ? 23 : 73,
          conditions: 'Cloudy',
          icon: 'cloudy',
          precipprob: 30
        },
        {
          datetime: new Date(Date.now() + 432000000),
          temp: units === 'metric' ? 22 : 72,
          tempmin: units === 'metric' ? 18 : 64,
          tempmax: units === 'metric' ? 24 : 75,
          conditions: 'Sunny',
          icon: 'clear-day',
          precipprob: 10
        }
      ]
    }
  };
  
  // Function to get weather data by city name
  const getWeatherByCity = (city) => {
    if (!city) return;
    
    setIsLoading(true);
    setError(null);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // Check if city exists in our simulated data
      const cityData = simulatedCityData[city];
      
      if (cityData) {
        setLocation({
          name: cityData.name,
          country: cityData.country
        });
        
        setWeather(cityData.current);
        setForecast(cityData.forecast);
      } else {
        // If city not found, show error and default to New York
        setError(`City "${city}" not found. Try New York, London, or Tokyo.`);
        
        const defaultCity = simulatedCityData['New York'];
        setLocation({
          name: defaultCity.name,
          country: defaultCity.country
        });
        
        setWeather(defaultCity.current);
        setForecast(defaultCity.forecast);
      }
      
      setIsLoading(false);
    }, 800); // Simulate network delay
  };
  
  // Function to get weather by current location
  const getWeatherByLocation = () => {
    setIsLoading(true);
    setError(null);
    
    // Simulate geolocation API with timeout
    setTimeout(() => {
      // Always return New York as the "detected" location
      const cityData = simulatedCityData['New York'];
      
      setLocation({
        name: cityData.name,
        country: cityData.country
      });
      
      setWeather(cityData.current);
      setForecast(cityData.forecast);
      
      setIsLoading(false);
    }, 1200); // Simulate geolocation + network delay
  };
  
  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!locationInput.trim()) return;
    
    // Check if city name is in our simulated data (case insensitive)
    const cityKeys = Object.keys(simulatedCityData);
    const matchedCity = cityKeys.find(city => 
      city.toLowerCase() === locationInput.toLowerCase()
    );
    
    if (matchedCity) {
      getWeatherByCity(matchedCity);
    } else {
      // Handle partial matches
      const partialMatch = cityKeys.find(city =>
        city.toLowerCase().includes(locationInput.toLowerCase())
      );
      
      if (partialMatch) {
        getWeatherByCity(partialMatch);
      } else {
        // If no match, default to New York with error message
        setError(`City "${locationInput}" not found. Try New York, London, or Tokyo.`);
        getWeatherByCity('New York');
      }
    }
  };
  
  // Toggle units between metric and imperial
  const toggleUnits = () => {
    const newUnits = units === 'metric' ? 'imperial' : 'metric';
    setUnits(newUnits);
    
    // Refresh weather data with new units if we have location
    if (location) {
      getWeatherByCity(location.name);
    }
  };
  
  // Get day name from date
  const getDayName = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };
  
  // Format date to readable string
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Format time to readable string
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  
  // Get background color based on temperature
  const getTemperatureColor = (temp) => {
    if (units === 'metric') {
      if (temp < 0) return 'bg-blue-800';
      if (temp < 10) return 'bg-blue-600';
      if (temp < 20) return 'bg-green-600';
      if (temp < 30) return 'bg-yellow-600';
      return 'bg-red-600';
    } else {
      if (temp < 32) return 'bg-blue-800';
      if (temp < 50) return 'bg-blue-600';
      if (temp < 68) return 'bg-green-600';
      if (temp < 86) return 'bg-yellow-600';
      return 'bg-red-600';
    }
  };

  // Set default city on component mount
  useEffect(() => {
    getWeatherByCity('New York');
  }, []);
  
  return (
    <div className="h-full flex flex-col bg-gray-900 p-4 rounded-lg overflow-hidden text-white">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-3">Weather Information</h2>
        
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Try: New York, London, Tokyo"
            className="flex-grow px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md"
            disabled={isLoading}
          >
            Search
          </button>
          <button
            type="button"
            onClick={getWeatherByLocation}
            className="px-3 py-2 bg-green-600 hover:bg-green-500 rounded-md text-white"
            disabled={isLoading}
          >
            📍 Current
          </button>
        </form>
        
        <div className="flex justify-between items-center">
          <div>
            {location && (
              <h3 className="text-lg font-medium">{location.name}, {location.country}</h3>
            )}
          </div>
          <button
            onClick={toggleUnits}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            {units === 'metric' ? 'Switch to °F' : 'Switch to °C'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      {isLoading && (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading weather data...</p>
          </div>
        </div>
      )}
      
      {!isLoading && weather && (
        <div className="flex-grow flex flex-col">
          {/* Current weather */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <span className="text-5xl mr-3">
                    {weatherIcons[weather.icon] || weatherIcons.default}
                  </span>
                  <div>
                    <h3 className="text-2xl font-bold">
                      {Math.round(weather.temp)}{unitSymbols[units].temp}
                    </h3>
                    <p className="capitalize">{weather.conditions}</p>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p>Feels like: {Math.round(weather.feelslike)}{unitSymbols[units].temp}</p>
                <p>Humidity: {Math.round(weather.humidity)}%</p>
                <p>Wind: {Math.round(weather.windspeed)} {unitSymbols[units].speed}</p>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-gray-400">Min</p>
                <p>{Math.round(weather.tempmin)}{unitSymbols[units].temp}</p>
              </div>
              <div>
                <p className="text-gray-400">Max</p>
                <p>{Math.round(weather.tempmax)}{unitSymbols[units].temp}</p>
              </div>
              <div>
                <p className="text-gray-400">UV Index</p>
                <p>{weather.uvindex}</p>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-400">Sunrise</p>
                <p>{formatTime(weather.sunrise)}</p>
              </div>
              <div>
                <p className="text-gray-400">Sunset</p>
                <p>{formatTime(weather.sunset)}</p>
              </div>
            </div>
          </div>
          
          {/* 5-day forecast */}
          {forecast && (
            <div className="bg-gray-800 rounded-lg p-4 overflow-auto">
              <h3 className="font-medium mb-3">5-Day Forecast</h3>
              <div className="grid grid-cols-5 gap-2">
                {forecast.map((day, index) => (
                  <div 
                    key={index} 
                    className="bg-gray-700 rounded-md p-2 text-center"
                  >
                    <p className="text-sm font-medium">{getDayName(day.datetime)}</p>
                    <p className="text-xs text-gray-400">{formatDate(day.datetime)}</p>
                    <div className="text-2xl my-1">
                      {weatherIcons[day.icon] || weatherIcons.default}
                    </div>
                    <div 
                      className={`text-sm font-bold rounded-full px-2 py-1 ${getTemperatureColor(day.temp)}`}
                    >
                      {Math.round(day.temp)}{unitSymbols[units].temp}
                    </div>
                    <p className="text-xs mt-1 capitalize">{day.conditions}</p>
                    {day.precipprob > 0 && (
                      <p className="text-xs text-blue-300">
                        {Math.round(day.precipprob)}% 💧
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {!isLoading && !weather && !error && (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🌤️</div>
            <p>Enter a city name or use your current location</p>
            <p className="text-sm text-gray-400 mt-2">to get weather information</p>
          </div>
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-400 text-center">
        <p>⚠️ Simulated weather data - no API calls</p>
        <p>Available cities: New York, London, Tokyo</p>
      </div>
    </div>
  );
};

export default WeatherPanel;
