import type { APIRoute } from 'astro';
import { SQLiteEngine } from '../../engine/sqlite_engine';
import { DEFAULT_PAGE_SIZE } from '../../config/config_constants';

export const GET: APIRoute = async ({ url }) => {
  try {
    // Parse page number from query parameters, default to 1
    const pageParam = url.searchParams.get('page');
    const page = pageParam ? parseInt(pageParam, 10) : 1;

    // Optional: Allow custom page size, default to config
    const pageSizeParam = url.searchParams.get('pageSize');
    const pageSize = pageSizeParam 
      ? parseInt(pageSizeParam, 10) 
      : DEFAULT_PAGE_SIZE;

    // Create SQLite engine instance
    const engine = new SQLiteEngine();

    // Fetch page of cards
    const cardPage = engine.get_all(page, pageSize);

    // Return as JSON response
    return new Response(JSON.stringify(cardPage), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to retrieve cards', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
