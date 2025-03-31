import type { APIRoute } from 'astro';
import { MCard, MCardFromData } from '../../content/model/mcard.js';
import { CardCollection } from '../../content/model/card-collection.js';
import { SQLiteEngine } from '../../engine/sqlite_engine.js';
import { getStoreEngine } from '../../utils/storeAdapter.js';
import { encodeText } from '../../utils/textEncoderPolyfill.js';
import { SafeBuffer } from '../../utils/bufferPolyfill.js';
import { DEFAULT_PAGE_SIZE } from '../../config/config_constants.js';
import logger from '../../services/logger.js';

/**
 * Unified API for CardCollection operations
 * Supports: add, get, delete, getPage, searchByContent
 */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  // Initialize engine and card collection
  const engine = getStoreEngine();
  const cardCollection = new CardCollection(engine);
  
  try {
    logger.debug(`CardCollection API: Processing GET request with action: ${action}`);
    
    // Handle different actions
    switch (action) {
      case 'get': {
        const hash = url.searchParams.get('hash');
        
        if (!hash) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Invalid hash',
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
              timestamp: card.g_time || new Date().toISOString()
            },
            serverTimestamp: new Date().toISOString()
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      case 'getPage': {
        const pageNumber = parseInt(url.searchParams.get('pageNumber') || '1');
        const pageSize = parseInt(url.searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE));
        
        // Validate pagination parameters
        if (pageNumber < 1) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Invalid page number',
              timestamp: new Date().toISOString()
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        if (pageSize < 1) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Invalid page size',
              timestamp: new Date().toISOString()
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        try {
          const result = cardCollection.get_page(pageNumber, pageSize);
          
          return new Response(
            JSON.stringify({
              success: true,
              ...result,
              serverTimestamp: new Date().toISOString()
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          // This catches cases where page number is beyond total pages
          const errorMessage = error instanceof Error ? error.message : 'Invalid pagination parameters';
          return new Response(
            JSON.stringify({
              success: false,
              error: errorMessage,
              timestamp: new Date().toISOString()
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      
      case 'searchByContent': {
        const searchTerm = url.searchParams.get('searchTerm');
        const pageNumber = parseInt(url.searchParams.get('pageNumber') || '1');
        const pageSize = parseInt(url.searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE));
        
        if (!searchTerm) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Search string cannot be empty',
              timestamp: new Date().toISOString()
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        try {
          const result = cardCollection.search_by_content(searchTerm, pageNumber, pageSize);
          
          return new Response(
            JSON.stringify({
              success: true,
              ...result,
              serverTimestamp: new Date().toISOString()
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error searching for content';
          return new Response(
            JSON.stringify({
              success: false,
              error: errorMessage,
              timestamp: new Date().toISOString()
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      
      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: `Unknown action: ${action}`,
            timestamp: new Date().toISOString()
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    logger.error('Error in CardCollection GET API:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Server error',
        details: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const action = data.action;
    
    // Initialize engine and card collection
    const engine = getStoreEngine();
    const cardCollection = new CardCollection(engine);
    
    logger.debug(`CardCollection API: Processing POST request with action: ${action}`);
    
    switch (action) {
      case 'add': {
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
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error adding card';
          return new Response(
            JSON.stringify({
              success: false,
              error: errorMessage,
              timestamp: new Date().toISOString()
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      
      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: `Unknown action: ${action}`,
            timestamp: new Date().toISOString()
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    logger.error('Error in CardCollection POST API:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Server error',
        details: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  // Initialize engine and card collection
  const engine = getStoreEngine();
  const cardCollection = new CardCollection(engine);
  
  try {
    logger.debug(`CardCollection API: Processing DELETE request with action: ${action}`);
    
    if (action !== 'delete') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid action for DELETE: ${action}`,
          timestamp: new Date().toISOString()
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const hash = url.searchParams.get('hash');
    
    if (!hash) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Hash is required',
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
  } catch (error) {
    logger.error('Error in CardCollection DELETE API:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Server error',
        details: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
