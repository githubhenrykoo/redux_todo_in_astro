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
type CLMContent = {
  title: string;
  created: string;
  dimensions: {
    abstract_specification: any;
    concrete_implementation: any;
    balanced_expectations: any;
  };
};

/**
 * API endpoint to store CLM data as a MCard
 */
export const POST: APIRoute = async ({ request }) => {
  console.log('POST /api/store-clm called');
  
  try {
    // Get the request body
    const data = await request.json();
    console.log('Received CLM data to store:', { 
      title: data.title, 
      format: data.format,
      contentKeys: data.content ? Object.keys(data.content) : 'No content',
      dimensionKeys: data.content?.dimensions ? Object.keys(data.content.dimensions) : 'No dimensions'
    });
    
    // Validate required fields with more detailed checks
    if (!data.title) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request. Title is required.', 
          timestamp: new Date().toISOString() 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!data.content || !data.content.dimensions) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request. Content and dimensions are required.', 
          details: {
            contentExists: !!data.content,
            dimensionsExists: !!data.content?.dimensions
          },
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
    
    // Extract the dimensions from the content
    const dimensionContent = data.content.dimensions;
    
    // Store the dimension cards
    const dimensionHashes: DimensionHashes = {
      abstractSpecification: null,
      concreteImplementation: null,
      balancedExpectations: null
    };
    
    // Create and store individual dimension cards
    if (dimensionContent.abstract_specification) {
      const abstractCard = new MCard(dimensionContent.abstract_specification);
      dimensionHashes.abstractSpecification = cardCollection.add(abstractCard);
      console.log('Abstract Specification dimension card stored with hash:', dimensionHashes.abstractSpecification);
    }
    
    if (dimensionContent.concrete_implementation) {
      const concreteCard = new MCard(dimensionContent.concrete_implementation);
      dimensionHashes.concreteImplementation = cardCollection.add(concreteCard);
      console.log('Concrete Implementation dimension card stored with hash:', dimensionHashes.concreteImplementation);
    }
    
    if (dimensionContent.balanced_expectations) {
      const balancedCard = new MCard(dimensionContent.balanced_expectations);
      dimensionHashes.balancedExpectations = cardCollection.add(balancedCard);
      console.log('Balanced Expectations dimension card stored with hash:', dimensionHashes.balancedExpectations);
    }
    
    // Create the metadata card to represent the entire CLM structure
    // Simplified metadata with only essential fields
    const metadataCard = new MCard({
      title: data.title,
      dimensions: dimensionHashes
    });
    
    const metadataHash = cardCollection.add(metadataCard);
    console.log('CLM metadata card stored with hash:', metadataHash);
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        clmHash: metadataHash,
        dimensionHashes,
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
