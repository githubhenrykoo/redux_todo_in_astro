import type { APIRoute } from 'astro';
import { SQLiteEngine } from '../../engine/sqlite_engine.js';
import { CardCollection } from '../../content/model/card-collection.js';

interface RetrieverParams {
  hashValue?: string;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
}

/**
 * API endpoint to retrieve cards from the database
 * Supports:
 * - Get by hash: ?hash=<hash_value>
 * - Get all cards with pagination: ?page=<number>&pageSize=<number>
 * - Search by content: ?search=<term>&page=<number>&pageSize=<number>
 */
export const GET: APIRoute = async ({ request }) => {
  console.log('GET /api/retrieve called');
  
  // Parse the URL to get the query parameters
  const url = new URL(request.url);
  const params: RetrieverParams = {
    hashValue: url.searchParams.get('hash') || undefined,
    pageNumber: parseInt(url.searchParams.get('page') || '1'),
    pageSize: parseInt(url.searchParams.get('pageSize') || '10'),
    searchTerm: url.searchParams.get('search') || undefined
  };

  try {
    // Create a database connection and CardCollection
    const engine = new SQLiteEngine();
    const cardCollection = new CardCollection(engine);
    
    let result: any;
    
    // Handle different retrieval scenarios
    if (params.hashValue) {
      // Get a specific card by hash
      console.log(`Retrieving card with hash: ${params.hashValue}`);
      const card = cardCollection.get(params.hashValue);
      
      if (!card) {
        return new Response(
          JSON.stringify({ error: 'Card not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Transform to a standardized format using CardCollection's Page format
      result = {
        items: [card],
        total_items: 1,
        page_number: 1,
        page_size: 1,
        has_next: false,
        has_previous: false,
        total_pages: 1,
        previous_page: null,
        next_page: null
      };
    } else if (params.searchTerm) {
      // Search cards by content using CardCollection
      console.log(`Searching for cards with term: ${params.searchTerm}`);
      result = cardCollection.search_by_content(
        params.searchTerm, 
        params.pageNumber, 
        params.pageSize
      );
    } else {
      // Get all cards with pagination using CardCollection
      console.log(`Retrieving all cards, page ${params.pageNumber}, size ${params.pageSize}`);
      result = cardCollection.get_page(params.pageNumber, params.pageSize);
    }

    // Add server timestamp and metadata
    const responseData = {
      ...result,
      serverTimestamp: new Date().toISOString(),
      retrievalMethod: params.hashValue ? 'hash' : 
                       params.searchTerm ? 'search' : 'all'
    };

    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error retrieving cards:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to retrieve cards', 
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
