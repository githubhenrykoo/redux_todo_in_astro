import React, { useState, useEffect } from 'react';
import { store } from '../store';

export const CommunicationTest: React.FC = () => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [currentState, setCurrentState] = useState<any>(null);
  const [hash, setHash] = useState<string | null>(null);
  
  // Get current state directly instead of using useSelector
  const fetchCurrentState = () => {
    try {
      const storeState = store.getState();
      console.log('Retrieved Redux state:', storeState);
      console.log('Redux state contains keys:', Object.keys(storeState));
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
    setHash(null);
    
    try {
      // Get the current store state
      const storeState = fetchCurrentState();
      console.log('Current store state type:', typeof storeState);
      console.log('Current store state keys:', Object.keys(storeState));
      
      // Convert state to a simpler format that's easy to send
      const simplePayload: Record<string, any> = {
        // Always include a timestamp with every payload
        timestamp: new Date().toISOString()
      };
      
      // Only add properties that exist in the state
      if ('theme' in storeState) simplePayload.theme = storeState.theme;
      if ('user' in storeState) simplePayload.user = storeState.user;
      if ('content' in storeState) simplePayload.content = storeState.content;
      if ('todo' in storeState) simplePayload.todo = storeState.todo;
      
      // Add basic information if nothing else is available
      if (Object.keys(simplePayload).length === 1) { // Only timestamp exists
        simplePayload.basic = {
          availableKeys: Object.keys(storeState)
        };
      }
      
      console.log('Sending simplified payload:', simplePayload);
      const stringified = JSON.stringify(simplePayload);
      console.log('Payload JSON string length:', stringified.length);
      
      const response = await fetch('/api/card-collection', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'add',
          card: simplePayload
        })
      });

      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      try {
        const data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
        setResponse(data);
        
        if (data.hash) {
          setHash(data.hash);
          setMessage(`State sent successfully! Hash: ${data.hash}`);
        } else {
          setMessage(data.message || 'State sent successfully');
        }
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
      
      {hash && (
        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <h3 className="font-semibold mb-1">Created Card Hash:</h3>
          <div className="bg-blue-100 p-2 rounded font-mono text-sm overflow-auto select-all">
            {hash}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Use this hash to look up the stored data using the Card Viewer below
          </p>
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
