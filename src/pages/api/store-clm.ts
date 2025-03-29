import type { APIRoute } from 'astro';
import { MCard } from '../../content/model/mcard.js';
import { SQLiteEngine } from '../../engine/sqlite_engine.js';
import { CardCollection } from '../../content/model/card-collection.js';
import { storeData, getCardByHash, getStoreEngine } from '../../utils/storeAdapter';
import { encodeText } from '../../utils/textEncoderPolyfill.js';

// Define types for the CLM dimensions
type CLMDimension = 'abstractSpecification' | 'concreteImplementation' | 'balancedExpectations';
type DimensionContent = Record<CLMDimension, string>;
type DimensionHashes = Record<CLMDimension, string | null>;

/**
 * API endpoint to store CLM data as a MCard
 */
export const POST: APIRoute = async ({ request }) => {
  console.log('POST /api/store-clm called');
  
  try {
    // Get the request body
    const data = await request.json();
    console.log('Received CLM data to store:', { title: data.title, format: data.format });
    
    // Validate required fields
    if (!data.title || !data.content) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request. Title and content are required.', 
          timestamp: new Date().toISOString() 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Initialize database connection and card collection
    const engine = getStoreEngine();
    const cardCollection = new CardCollection(engine);
    
    // Store the root CLM card
    const rootClmCard = new MCard(data.content.rootClm);
    const rootClmHash = cardCollection.add(rootClmCard);
    console.log('Root CLM card stored with hash:', rootClmHash);
    
    // Store the dimension cards
    const dimensionHashes: DimensionHashes = {
      abstractSpecification: null,
      concreteImplementation: null,
      balancedExpectations: null
    };
    
    // Type-safe way to handle dimensions
    for (const [dimensionKey, content] of Object.entries(data.content.dimensions)) {
      const dimension = dimensionKey as CLMDimension;
      if (dimension in dimensionHashes) {
        const dimensionCard = new MCard(content);
        const dimensionHash = cardCollection.add(dimensionCard);
        dimensionHashes[dimension] = dimensionHash;
        console.log(`${dimension} dimension card stored with hash:`, dimensionHash);
      }
    }
    
    // Create a metadata card to represent the entire CLM structure
    const metadataCard = new MCard({
      title: data.title,
      type: 'clm',
      timestamp: data.timestamp || new Date().toISOString(),
      format: data.format || 'yaml',
      rootHash: rootClmHash,
      dimensions: dimensionHashes,
      __stateTimestamp: new Date().toISOString()
    });
    
    const metadataHash = cardCollection.add(metadataCard);
    console.log('CLM metadata card stored with hash:', metadataHash);
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        clmHash: metadataHash,
        rootHash: rootClmHash,
        dimensionHashes,
        timestamp: new Date().toISOString(),
        title: data.title
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error storing CLM data:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to store CLM data', 
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
