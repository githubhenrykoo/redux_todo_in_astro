import type { APIRoute } from 'astro';
import { CardCollection } from '../../../content/model/card-collection.js';
import { getStoreEngine } from '../../../utils/storeAdapter.js';
import logger from '../../../services/logger.js';

/**
 * API endpoint for retrieving cards from the collection
 * GET /api/card-collection/get
 */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const hash = url.searchParams.get('hash');
  
  // Initialize engine and card collection
  const engine = getStoreEngine();
  const cardCollection = new CardCollection(engine);
  
  try {
    logger.debug(`CardCollection GET API: Processing GET request for hash: ${hash}`);
    
    if (!hash) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Hash parameter is required',
          timestamp: new Date().toISOString()
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const card = cardCollection.get(hash);
    
    if (!card) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Card not found',
          timestamp: new Date().toISOString()
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Return card data
    return new Response(
      JSON.stringify({
        success: true,
        card: {
          hash: card.hash,
          content: card.content,
          hash_algorithm: card.hash_algorithm,
          timestamp: card.g_time || new Date().toISOString(),
          content_type: card.get_content_type?.() || 'unknown'
        },
        serverTimestamp: new Date().toISOString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const error = err as Error; // Type assertion
    logger.error('Error in CardCollection GET API:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Server error',
        details: error.message || String(error),
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
