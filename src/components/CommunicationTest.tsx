import React, { useState } from 'react';

export const CommunicationTest: React.FC = () => {
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Sending...');
    
    try {
      // Try sending as form data first
      const formData = new URLSearchParams();
      formData.append('text', input);
      
      console.log('Sending message:', input);
      
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      try {
        const data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
        setResponse(data);
        setMessage(data.message || 'Request processed successfully');
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
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Enter message..." 
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        
        <button 
          type="submit" 
          className="w-full py-2 rounded-md text-white font-semibold bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
        >
          Send to Server
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
    </div>
  );
};
