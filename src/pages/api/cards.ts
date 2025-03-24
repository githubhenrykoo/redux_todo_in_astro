import type { APIRoute } from 'astro';
import { SQLiteEngine } from '../../engine/sqlite_engine';
import { DEFAULT_PAGE_SIZE } from '../../config/config_constants';

export const GET: APIRoute = async ({ url }) => {
  try {
    // Parse page number from query parameters, default to 1
    const pageParam = url.searchParams.get('page');
    const page = pageParam !== null 
      ? Number.parseInt(pageParam, 10) 
      : 1;

    // Optional: Allow custom page size, default to config
    const pageSizeParam = url.searchParams.get('pageSize');
    const pageSize = pageSizeParam !== null 
      ? Number.parseInt(pageSizeParam, 10)
      : DEFAULT_PAGE_SIZE;

    // Validate parsed numbers
    const parsedPage = Number(page);
    const parsedPageSize = Number(pageSize);

    if (Number.isNaN(parsedPage) || parsedPage <= 0) {
      return new Response(JSON.stringify({ 
        error: 'Invalid page parameter' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    if (Number.isNaN(parsedPageSize) || parsedPageSize <= 0) {
      return new Response(JSON.stringify({ 
        error: 'Invalid page size parameter' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Create SQLite engine instance
    const engine = new SQLiteEngine();

    // Fetch page of cards
    const cardPage = engine.get_all(parsedPage, parsedPageSize);

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
