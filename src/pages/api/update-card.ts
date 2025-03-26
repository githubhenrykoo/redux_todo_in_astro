import type { APIRoute } from 'astro';
import { SQLiteEngine } from '../../engine/sqlite_engine.js';
import { CardCollection } from '../../content/model/card-collection.js';
import { getCardByHash } from '../../utils/storeAdapter';

/**
 * API endpoint to update a card's content by hash
 */
export const POST: APIRoute = async ({ request }) => {
  console.log('POST /api/update-card called');
  
  try {
    // Get the request body
    const data = await request.json();
    console.log('Received update request:', { hash: data.hash, contentType: typeof data.content });
    
    // Validate request data
    if (!data.hash || data.content === undefined) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request. Hash and content are required.', 
          timestamp: new Date().toISOString() 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Add updated timestamp to the content (if it's an object)
    let updatedContent = data.content;
    if (typeof updatedContent === 'object' && updatedContent !== null) {
      updatedContent = {
        ...updatedContent,
        __stateTimestamp: new Date().toISOString()
      };
    }
    
    // Initialize database connection and card collection
    const engine = new SQLiteEngine();
    const cardCollection = new CardCollection(engine);
    
    // Check if the card exists
    const existingCard = cardCollection.get(data.hash);
    if (!existingCard) {
      return new Response(
        JSON.stringify({ 
          error: 'Card not found', 
          timestamp: new Date().toISOString() 
        }),
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Update the card
    const success = cardCollection.update(data.hash, updatedContent);
    
    if (!success) {
      throw new Error('Failed to update card in database');
    }
    
    // Get the updated card
    const updatedCard = getCardByHash(data.hash);
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        hash: data.hash,
        updatedAt: new Date().toISOString(),
        cardData: {
          hash: updatedCard?.hash,
          contentType: typeof updatedCard?.content,
          updatedAt: new Date().toISOString(),
          content: updatedCard?.content
        }
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error updating card:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to update card', 
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
