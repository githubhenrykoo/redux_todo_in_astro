// API endpoint to proxy requests to Ollama server
export async function post({ request }) {
    try {
      // Get the request body
      const body = await request.json();
      
      // Default to localhost:11434 for Ollama
      const ollamaUrl = 'http://localhost:11434';
      
      // Extract the endpoint from the request body or use default
      const endpoint = body.endpoint || '/api/chat';
      delete body.endpoint; // Remove endpoint from the body before forwarding
      
      // Construct the full URL for the API endpoint
      const url = `${ollamaUrl}${endpoint}`;
      
      console.log(`Proxying POST request to: ${url}`);
      console.log('Request body:', JSON.stringify(body));
      
      // Forward the request to Ollama
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      // If it's a streaming response, we need to handle it differently
      if (body.stream) {
        // Create a new ReadableStream to forward the response
        const { readable, writable } = new TransformStream();
        
        // Pipe the response body to our writable stream
        response.body.pipeTo(writable);
        
        // Return the readable stream as the response
        return new Response(readable, {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      }
      
      // For non-streaming responses, just return the JSON
      const data = await response.json();
      
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    } catch (error) {
      console.error('Error in Ollama proxy:', error);
      
      return new Response(JSON.stringify({
        error: error.message || 'An error occurred while processing your request',
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
  }
  
  // API endpoint to get model tags from Ollama
  export async function get({ request }) {
    try {
      const url = new URL(request.url);
      const endpoint = url.searchParams.get('endpoint') || '/api/tags';
      
      // Default to localhost:11434 for Ollama
      const ollamaUrl = 'http://localhost:11434';
      
      // Construct the full URL
      const fullUrl = `${ollamaUrl}${endpoint}`;
      
      console.log(`Proxying GET request to: ${fullUrl}`);
      
      // Forward the request to Ollama
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    } catch (error) {
      console.error('Error in Ollama proxy GET:', error);
      
      return new Response(JSON.stringify({
        error: error.message || 'An error occurred while processing your request',
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
  }
  
  // Handle OPTIONS requests for CORS preflight
  export function options() {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }