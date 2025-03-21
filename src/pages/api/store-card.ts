import type { APIRoute } from 'astro';
import { storeData, getCardByHash } from '../../utils/storeAdapter';

/**
 * API endpoint to store Redux state as a card
 */
export const POST: APIRoute = async ({ request }) => {
  console.log('POST /api/store-card called');
  
  try {
    // Get the request body
    const data = await request.json();
    console.log('Received data to store:', Object.keys(data || {}));
    
    // Store the data and get the hash
    const hash = storeData(data);
    console.log('Data stored successfully with hash:', hash);
    
    // Get the stored card to include in response
    const storedCard = getCardByHash(hash);
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        hash,
        timestamp: new Date().toISOString(),
        cardData: {
          hash: storedCard?.hash,
          contentType: typeof storedCard?.content,
          createdAt: storedCard?.timestamp,
          size: typeof storedCard?.content === 'string' 
            ? storedCard.content.length 
            : JSON.stringify(storedCard?.content).length
        }
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error storing data:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to store data', 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};
