import type { APIRoute } from 'astro';
import { storeData } from '../../utils/storeAdapter.js';

export const POST: APIRoute = async ({ request }) => {
  console.log('API: Submit endpoint hit');
  
  try {
    // Get request body as text
    const bodyText = await request.text();
    console.log('API: Request body length:', bodyText.length);
    
    // If we have data, try to parse it as JSON
    if (bodyText && bodyText.trim()) {
      try {
        // Parse JSON
        const jsonData = JSON.parse(bodyText);
        console.log('API: Successfully parsed JSON with keys:', Object.keys(jsonData));
        
        // Store in database
        const hash = storeData(jsonData);
        console.log('API: Successfully stored data with hash:', hash);
        
        // Return success response
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Data stored successfully',
            hash: hash
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (error) {
        console.error('API: Error parsing JSON:', error);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid JSON data',
            message: 'Could not parse request body as JSON'
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
    } else {
      // No data provided
      console.log('API: No data provided in request body');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No data provided',
          message: 'Request body is empty'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
  } catch (error) {
    // Server error
    console.error('API: Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Server error',
        message: error instanceof Error ? error.message : 'Unknown error'
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