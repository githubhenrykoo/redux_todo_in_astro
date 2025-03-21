import type { APIRoute } from 'astro';
import { getCardByHash } from '../../utils/storeAdapter';

/**
 * API endpoint to retrieve a card by its hash
 */
export const GET: APIRoute = async ({ request }) => {
  console.log('GET /api/get-card called');
  
  // Parse the URL to get the query parameters
  const url = new URL(request.url);
  const hash = url.searchParams.get('hash');

  // Validate hash parameter
  if (!hash) {
    console.error('Missing required hash parameter');
    return new Response(
      JSON.stringify({ 
        error: 'Missing required hash parameter' 
      }),
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    console.log('Retrieving card with hash:', hash);
    const card = getCardByHash(hash);
    
    if (!card) {
      console.log('Card not found for hash:', hash);
      return new Response(
        JSON.stringify({ 
          error: 'Card not found' 
        }),
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Add server timestamp
    const responseData = {
      ...card,
      serverTimestamp: new Date().toISOString(),
    };

    console.log('Card retrieved successfully');
    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error retrieving card:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to retrieve card', 
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};
