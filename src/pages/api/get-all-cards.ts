import type { APIRoute } from 'astro';
import { getAllCards } from '../../utils/storeAdapter';

/**
 * API endpoint to retrieve all cards with pagination
 */
export const GET: APIRoute = async ({ request }) => {
  console.log('GET /api/get-all-cards called');
  
  // Parse the URL to get the query parameters
  const url = new URL(request.url);
  const pageNumber = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '10');

  try {
    console.log(`Retrieving cards page ${pageNumber} with size ${pageSize}`);
    const paginatedCards = getAllCards(pageNumber, pageSize);
    
    // Add server timestamp
    const responseData = {
      ...paginatedCards,
      serverTimestamp: new Date().toISOString(),
    };

    console.log(`Retrieved ${paginatedCards?.items?.length || 0} cards successfully`);
    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error retrieving cards:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to retrieve cards', 
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};
