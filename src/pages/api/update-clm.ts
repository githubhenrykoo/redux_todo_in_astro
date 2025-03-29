import type { APIRoute } from 'astro';
import { SQLiteEngine } from '../../engine/sqlite_engine.js';
import { CardCollection } from '../../content/model/card-collection.js';
import { getCardByHash, getStoreEngine } from '../../utils/storeAdapter';
import { MCard } from '../../content/model/mcard.js';

// Define types for the CLM dimensions
type CLMDimension = 'abstractSpecification' | 'concreteImplementation' | 'balancedExpectations';
type DimensionHashes = Record<CLMDimension, string | null>;

/**
 * API endpoint to update a CLM dimension by hash
 */
export const POST: APIRoute = async ({ request }) => {
  console.log('POST /api/update-clm called');
  
  try {
    // Get the request body
    const data = await request.json();
    console.log('Received update request:', { 
      clmHash: data.clmHash, 
      dimension: data.dimension, 
      contentType: typeof data.content 
    });
    
    // Validate request data
    if (!data.clmHash || !data.dimension || data.content === undefined) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request. CLM hash, dimension, and content are required.', 
          timestamp: new Date().toISOString() 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Add updated timestamp to the content
    const updatedTimestamp = new Date().toISOString();
    
    // Initialize database connection and card collection
    const engine = getStoreEngine();
    const cardCollection = new CardCollection(engine);
    
    // Check if the CLM metadata card exists
    const clmMetadataCard = getCardByHash(data.clmHash);
    if (!clmMetadataCard) {
      return new Response(
        JSON.stringify({ 
          error: 'CLM metadata card not found', 
          timestamp: updatedTimestamp
        }),
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Get the content of the CLM metadata card
    const clmMetadata = clmMetadataCard.content;
    
    // Create a new dimension card with updated content
    const updatedDimensionCard = new MCard(data.content);
    const dimensionHash = cardCollection.add(updatedDimensionCard);
    console.log(`Updated ${data.dimension} dimension card with hash:`, dimensionHash);
    
    // Update the CLM metadata card with the new dimension hash
    const updatedDimensionHashes = { ...clmMetadata.dimensions };
    
    // Type-safe dimension assignment
    const dimension = data.dimension as CLMDimension;
    if (dimension in updatedDimensionHashes) {
      updatedDimensionHashes[dimension] = dimensionHash;
    } else {
      return new Response(
        JSON.stringify({ 
          error: `Invalid dimension: ${data.dimension}`, 
          timestamp: updatedTimestamp
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Create an updated metadata card
    const updatedMetadata = {
      ...clmMetadata,
      dimensions: updatedDimensionHashes,
      lastUpdated: updatedTimestamp,
      __stateTimestamp: updatedTimestamp
    };
    
    // Store the updated metadata card
    const updatedMetadataCard = new MCard(updatedMetadata);
    const updatedMetadataHash = cardCollection.add(updatedMetadataCard);
    console.log('Updated CLM metadata card with hash:', updatedMetadataHash);
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        originalClmHash: data.clmHash,
        newClmHash: updatedMetadataHash,
        dimension: data.dimension,
        dimensionHash: dimensionHash,
        timestamp: updatedTimestamp
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error updating CLM dimension:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to update CLM dimension', 
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
