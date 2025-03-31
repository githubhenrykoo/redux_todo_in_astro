import type { APIRoute } from 'astro';
import { CardCollection } from '../../../content/model/card-collection.js';
import { getStoreEngine } from '../../../utils/storeAdapter.js';
import logger from '../../../services/logger.js';

/**
 * API endpoint for deleting cards from the collection
 * DELETE /api/card-collection/delete
 */
export const DELETE: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const hash = url.searchParams.get('hash');
  
  // Initialize engine and card collection
  const engine = getStoreEngine();
  const cardCollection = new CardCollection(engine);
  
  try {
    logger.debug(`CardCollection DELETE API: Processing DELETE request for hash: ${hash}`);
    
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
    
    // Check if the card exists first
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
    
    // Delete the card
    const result = cardCollection.delete(hash);
    
    if (!result) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to delete card',
          timestamp: new Date().toISOString()
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const error = err as Error; // Type assertion
    logger.error('Error in CardCollection DELETE API:', error);
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
