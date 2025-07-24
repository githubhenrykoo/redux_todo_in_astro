// API proxy to forward requests to RAG service
export async function OPTIONS() {
  // Handle CORS preflight requests
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

export async function POST({ request }) {
  console.log('RAG proxy received request:', new Date().toISOString());
  try {
    // Extract the endpoint from URL parameters
    const url = new URL(request.url);
    const ragEndpoint = url.searchParams.get('endpoint') || '';
    console.log('Request URL:', request.url);
    
    if (!ragEndpoint) {
      console.error('Missing endpoint parameter in request');
      return new Response(JSON.stringify({ 
        error: 'Invalid endpoint - must specify endpoint parameter' 
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Log all request headers for debugging
    console.log('Request headers:');
    for (const [key, value] of request.headers.entries()) {
      console.log(`${key}: ${value}`);
    }
    
    console.log(`RAG proxy forwarding to endpoint: ${ragEndpoint}`);
    
    // Clone the request to preserve the body
    const clonedRequest = request.clone();
    
    // Check content type to determine how to process the body
    const contentType = request.headers.get('Content-Type') || '';
    
    // Forward the request to the RAG service
    let ragResponse;
    // Use environment variable or fallback to service name in Docker network
    const ragBaseUrl = process.env.LOCAL_RAG_URL || 'http://local-rag:28302';
    const ragFullUrl = `${ragBaseUrl}/${ragEndpoint}`;
    console.log(`Forwarding to RAG service URL: ${ragFullUrl}`);
    
    if (contentType.includes('multipart/form-data')) {
      // Handle file uploads - directly stream the FormData
      console.log('Handling multipart/form-data upload');
      const rawBody = await request.arrayBuffer();
      console.log(`Raw body size: ${rawBody.byteLength} bytes`);
      
      try {
        ragResponse = await fetch(ragFullUrl, {
          method: 'POST',
          body: rawBody, // Pass the raw body for multipart/form-data
          headers: {
            'Content-Type': contentType
          }
        });
        console.log(`RAG upload response status: ${ragResponse.status} ${ragResponse.statusText}`);
      } catch (fetchError) {
        console.error('Error fetching from RAG service:', fetchError);
        throw new Error(`RAG service connection error: ${fetchError.message}`);
      }
    } else {
      // Handle JSON requests
      console.log('Handling JSON request');
      let body;
      try {
        // For query endpoint, ensure we have a proper query object
        if (ragEndpoint === 'query') {
          const requestBody = await clonedRequest.json().catch(() => ({}));
          body = { query: requestBody.query || '' };
          console.log('Query request:', JSON.stringify(body));
        } else {
          body = await clonedRequest.json();
          console.log('Request body:', JSON.stringify(body));
        }
      } catch (e) {
        console.log('No JSON body or empty body, using default:', e.message);
        // For query endpoint, default to empty query string
        body = ragEndpoint === 'query' ? { query: '' } : {};
      }
      
      try {
        // For query endpoint, ensure we're sending the correct format
        const requestBody = ragEndpoint === 'query' 
          ? JSON.stringify({ query: body.query || '' })
          : JSON.stringify(body);
        
        console.log(`Sending to ${ragFullUrl}:`, requestBody);
        
        ragResponse = await fetch(ragFullUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: requestBody
        });
        
        console.log(`RAG ${ragEndpoint} response status: ${ragResponse.status} ${ragResponse.statusText}`);
        
        // If the response is not OK, try to get the error details
        if (!ragResponse.ok) {
          const errorText = await ragResponse.text().catch(() => 'No error details');
          console.error(`RAG service error (${ragResponse.status}):`, errorText);
          throw new Error(`RAG service returned ${ragResponse.status}: ${ragResponse.statusText}`);
        }
      } catch (fetchError) {
        console.error('Error fetching from RAG service:', fetchError);
        throw new Error(`RAG service connection error: ${fetchError.message}`);
      }
    }
    
    // Process the response
    const responseContentType = ragResponse.headers.get('Content-Type') || 'application/json';
    console.log('RAG response content type:', responseContentType);
    
    // Log all response headers for debugging
    console.log('RAG response headers:');
    for (const [key, value] of ragResponse.headers.entries()) {
      console.log(`${key}: ${value}`);
    }
    
    let responseBody;
    
    if (responseContentType.includes('application/json')) {
      // Handle JSON response
      try {
        responseBody = await ragResponse.json();
        console.log('RAG JSON response:', JSON.stringify(responseBody));
        
        // Return the response to the client with CORS headers
        return new Response(JSON.stringify(responseBody), {
          status: ragResponse.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        });
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        
        // Try to get the text to see what was actually returned
        const rawText = await ragResponse.text().catch(err => 'Could not read response text');
        console.error('Raw response text:', rawText);
        
        return new Response(JSON.stringify({ 
          error: 'Error parsing response from RAG service',
          details: e.message,
          rawResponse: rawText.substring(0, 500) // Limit length for safety
        }), { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    } else {
      // Handle other response types (text, binary, etc.)
      try {
        responseBody = await ragResponse.text();
        console.log('RAG text response:', responseBody.substring(0, 200) + '...');
        
        return new Response(responseBody, {
          status: ragResponse.status,
          headers: {
            'Content-Type': responseContentType
          }
        });
      } catch (textError) {
        console.error('Error reading text response:', textError);
        return new Response(JSON.stringify({
          error: 'Error reading response from RAG service',
          details: textError.message
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    }
  } catch (error) {
    console.error('RAG proxy error:', error);
    console.error('Error stack trace:', error.stack);
    
    // Try to determine if it's a connection issue with the RAG service
    let statusCode = 500;
    let errorType = 'general_error';
    
    if (error.message && error.message.includes('ECONNREFUSED')) {
      errorType = 'connection_refused';
      console.error('Connection to RAG service refused - is the Docker service running?');
    } else if (error.message && error.message.includes('Not Found')) {
      errorType = 'endpoint_not_found';
      statusCode = 404;
    }
    
    return new Response(JSON.stringify({ 
      error: `RAG proxy error: ${error.message}`,
      errorType: errorType,
      timestamp: new Date().toISOString()
    }), { 
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
};
