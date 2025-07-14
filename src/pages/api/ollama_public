// Astro API route for Ollama proxy
// This file serves as a middleware to bypass CORS issues with Ollama

export const prerender = false;

const TARGET = 'http://10.241.179.204:11435';

export async function GET({ request, url }) {
  // Extract the endpoint from the query parameters
  const endpoint = url.searchParams.get('endpoint') || '/api/tags';
  
  try {
    console.log(`Proxying GET request to ${TARGET}${endpoint}`);
    const response = await fetch(`${TARGET}${endpoint}`);
    const body = await response.text();
    
    // Create a new Response with CORS headers
    return new Response(body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (err) {
    console.error('Ollama proxy error:', err);
    return new Response(JSON.stringify({ error: 'Ollama fetch failed', message: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function POST({ request }) {
  try {
    // Parse the request body
    const requestData = await request.json();
    
    // Extract the endpoint from the request body and remove it before forwarding
    const endpoint = requestData.endpoint || '/api/chat';
    delete requestData.endpoint;
    
    console.log(`Proxying POST request to ${TARGET}${endpoint}`);
    
    // Forward the request to Ollama
    const response = await fetch(`${TARGET}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    // Handle streaming responses
    if (requestData.stream) {
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body.getReader();
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } catch (error) {
            console.error('Stream error:', error);
          } finally {
            controller.close();
          }
        }
      });
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    } else {
      // Handle regular responses
      const body = await response.text();
      
      return new Response(body, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('content-type') || 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
  } catch (err) {
    console.error('Ollama proxy error:', err);
    return new Response(JSON.stringify({ error: 'Ollama fetch failed', message: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
