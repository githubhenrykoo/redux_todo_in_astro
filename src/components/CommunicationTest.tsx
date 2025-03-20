import React, { useState, useEffect } from 'react';
import { store } from '../store';

export const CommunicationTest: React.FC = () => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [currentState, setCurrentState] = useState<any>(null);
  
  // Get current state directly instead of using useSelector
  const fetchCurrentState = () => {
    try {
      const storeState = store.getState();
      setCurrentState(storeState);
      return storeState;
    } catch (error) {
      console.error('Error accessing store state:', error);
      return { error: 'Unable to access store state' };
    }
  };

  // Initial fetch of state
  useEffect(() => {
    fetchCurrentState();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Sending state to server...');
    
    try {
      // Get the current store state
      const storeState = fetchCurrentState();
      console.log('Current store state:', storeState);
      
      // Send only the store state
      const payload = storeState;
      
      console.log('Sending payload:', payload);
      
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      try {
        const data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
        setResponse(data);
        setMessage(data.message || 'State sent successfully');
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        setMessage('Server responded but sent invalid JSON');
      }
    } catch (err) {
      console.error('Request error:', err);
      setMessage(err instanceof Error ? `Error: ${err.message}` : 'Unknown error occurred');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <button 
          type="submit" 
          className="w-full py-2 rounded-md text-white font-semibold bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
        >
          Send Redux State to Server
        </button>
        
        <button 
          type="button" 
          onClick={fetchCurrentState}
          className="w-full py-2 rounded-md text-white font-semibold bg-gray-500 hover:bg-gray-600 active:bg-gray-700"
        >
          Refresh State
        </button>
      </form>
      
      {message && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-center">
          {message}
        </div>
      )}
      
      {response && (
        <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
          <h3 className="font-semibold mb-2">Server Response:</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
        <h3 className="font-semibold mb-2">Current Redux State:</h3>
        <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-60">
          {currentState ? JSON.stringify(currentState, null, 2) : 'Loading state...'}
        </pre>
      </div>
    </div>
  );
};
