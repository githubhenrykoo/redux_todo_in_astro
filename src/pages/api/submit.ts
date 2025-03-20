import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Log the entire request for debugging
    console.log('Received request method:', request.method);
    console.log('Received request headers:', Object.fromEntries(request.headers));
    
    // Check content type
    const contentType = request.headers.get('content-type');
    console.log('Content-Type:', contentType);

    let receivedData: any = {};
    let rawData: string = '';
    
    // Try to extract data using multiple methods
    try {
      // First try to read as text
      rawData = await request.clone().text();
      console.log('Raw request body (string):', rawData);
      console.log('Raw request body (length):', rawData.length);
      
      // Try to parse as form data
      try {
        const formData = await request.clone().formData();
        console.log('Form data entries:', [...formData.entries()]);
        
        // Convert FormData to object
        for (const [key, value] of formData.entries()) {
          receivedData[key] = value;
        }
      } catch (formError) {
        console.log('Not valid form data, continuing...');
      }
      
      // If we don't have any data yet, try JSON parsing
      if (Object.keys(receivedData).length === 0 && rawData.trim().length > 0) {
        try {
          receivedData = JSON.parse(rawData);
          console.log('Parsed as JSON:', receivedData);
        } catch (jsonError) {
          console.log('Not valid JSON, continuing...');
        }
      }
      
      // If we still don't have data, use the raw data as-is
      if (Object.keys(receivedData).length === 0) {
        receivedData = { 
          rawInput: rawData || 'No input data',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error extracting request data:', error);
      // Create a fallback response with empty data
      receivedData = { 
        error: 'Failed to extract data',
        timestamp: new Date().toISOString()
      };
    }

    // Log the parsed data
    console.log('Final processed data:', receivedData);

    // Return a simple response
    return new Response(
      JSON.stringify({
        message: 'Request received successfully!',
        receivedData: receivedData
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    // Handle any unexpected errors
    console.error('Unexpected error processing request:', error);

    return new Response(
      JSON.stringify({ 
        error: 'Unexpected server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
};