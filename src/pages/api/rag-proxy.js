// API proxy to forward requests to RAG service
export const post = async ({ request }) => {
  try {
    // Extract the endpoint from URL parameters
    const url = new URL(request.url);
    const ragEndpoint = url.searchParams.get('endpoint') || '';
    
    if (!ragEndpoint) {
      return new Response(JSON.stringify({ 
        error: 'Invalid endpoint - must specify endpoint parameter' 
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    console.log(`RAG proxy forwarding to endpoint: ${ragEndpoint}`);
    
    // Clone the request to preserve the body
    const clonedRequest = request.clone();
    
    // Check content type to determine how to process the body
    const contentType = request.headers.get('Content-Type') || '';
    
    // Forward the request to the RAG service
    let ragResponse;
    
    if (contentType.includes('multipart/form-data')) {
      // Handle file uploads - directly stream the FormData
      console.log('Handling multipart/form-data upload');
      ragResponse = await fetch(`http://localhost:28302/${ragEndpoint}`, {
        method: 'POST',
        body: await request.arrayBuffer(), // Pass the raw body for multipart/form-data
        headers: {
          'Content-Type': contentType
        }
      });
    } else {
      // Handle JSON requests
      console.log('Handling JSON request');
      let body;
      try {
        body = await clonedRequest.json();
        console.log('Request body:', JSON.stringify(body));
      } catch (e) {
        console.log('No JSON body or empty body');
        body = {};
      }
      
      ragResponse = await fetch(`http://localhost:28302/${ragEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    }
    
    // Process the response
    const responseContentType = ragResponse.headers.get('Content-Type') || 'application/json';
    let responseBody;
    
    if (responseContentType.includes('application/json')) {
      // Handle JSON response
      try {
        responseBody = await ragResponse.json();
        
        // Return the response to the client
        return new Response(JSON.stringify(responseBody), {
          status: ragResponse.status,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        return new Response(JSON.stringify({ 
          error: 'Error parsing response from RAG service' 
        }), { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    } else {
      // Handle other response types (text, binary, etc.)
      responseBody = await ragResponse.text();
      
      return new Response(responseBody, {
        status: ragResponse.status,
        headers: {
          'Content-Type': responseContentType
        }
      });
    }
  } catch (error) {
    console.error('RAG proxy error:', error);
    return new Response(JSON.stringify({ 
      error: `RAG proxy error: ${error.message}` 
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
