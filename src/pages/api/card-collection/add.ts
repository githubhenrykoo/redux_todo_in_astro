import type { APIRoute } from 'astro';
import { MCard } from '../../../content/model/mcard.js';
import { CardCollection } from '../../../content/model/card-collection.js';
import { getStoreEngine } from '../../../utils/storeAdapter.js';
import { SafeBuffer } from '../../../utils/bufferPolyfill.js';
import logger from '../../../services/logger.js';

/**
 * API endpoint for adding cards to the collection
 * POST /api/card-collection/add
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Initialize engine and card collection
    const engine = getStoreEngine();
    const cardCollection = new CardCollection(engine);
    
    logger.debug(`CardCollection ADD API: Processing POST request`);
    
    if (!data.card || typeof data.card !== 'object') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Card data is required',
          timestamp: new Date().toISOString()
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract content and hash_algorithm
    const { content, hash_algorithm } = data.card;
    
    if (content === undefined) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Card content is required',
          timestamp: new Date().toISOString()
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    try {
      // Create a new MCard
      const card = new MCard(content, hash_algorithm);
      
      // Add to collection
      const hash = cardCollection.add(card);
      
      // Return result
      return new Response(
        JSON.stringify({
          success: true,
          hash,
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      const error = err as Error; // Type assertion
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || 'Error adding card',
          timestamp: new Date().toISOString()
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (err) {
    const error = err as Error; // Type assertion
    logger.error('Error in CardCollection ADD API:', error);
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
