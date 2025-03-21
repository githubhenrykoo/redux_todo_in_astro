import type { APIRoute } from 'astro';
import { getCardByHash } from '../../utils/storeAdapter.js';

export const GET: APIRoute = async ({ request }) => {
  console.log('API: get-card endpoint hit');
  
  try {
    // Get the URL
    const url = new URL(request.url);
    console.log('API: Requested URL:', url.toString());
    
    // Extract the hash from the query parameters
    const hash = url.searchParams.get('hash');
    console.log('API: Hash parameter:', hash);
    
    if (!hash) {
      console.log('API: No hash parameter provided');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing hash parameter'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Retrieve the card
    console.log('API: Attempting to retrieve card with hash:', hash);
    const cardData = getCardByHash(hash);
    
    if (!cardData) {
      console.log('API: Card not found for hash:', hash);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Card not found',
          hash: hash
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log('API: Card retrieved successfully');
    
    // Parse card data to get timestamp (if available)
    let parsedData;
    let retrievedTimestamp = null;
    
    try {
      parsedData = JSON.parse(cardData.content);
      retrievedTimestamp = parsedData.timestamp;
      console.log('API: Retrieved timestamp:', retrievedTimestamp);
    } catch (parseError) {
      console.warn('API: Could not parse card content as JSON:', parseError);
    }
    
    // Return the card data with retrieved and server timestamps
    return new Response(
      JSON.stringify({
        success: true,
        card: cardData,
        hash: hash,
        timestamp: {
          retrieved: retrievedTimestamp,
          server: new Date().toISOString()
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('API: Error retrieving card:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error'
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
