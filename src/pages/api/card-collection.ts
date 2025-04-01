import type { APIRoute } from 'astro';
import { MCard} from '../../content/model/mcard.js';
import { CardCollection } from '../../content/model/card-collection.js';
import { getStoreEngine } from '../../utils/storeAdapter.js';
import { SafeBuffer } from '../../utils/bufferPolyfill.js';
import { DEFAULT_PAGE_SIZE } from '../../config/config_constants.js';
import logger from '../../services/logger.js';
import ContentTypeInterpreter from '../../content/model/content_type_detector.js';

/**
 * Processes card content based on content type to return in the most appropriate format
 * Text formats are returned as plain strings, binary formats as base64
 */
function processCardContent(content: any, contentType: string | null): any {
  // If no content, return as is
  if (!content) return content;
  
  console.log(`Processing content of type ${contentType}, content format:`, typeof content);
  
  // Handle Buffer JSON format
  if (typeof content === 'object' && content !== null && content.type === 'Buffer' && Array.isArray(content.data)) {
    // Create a Uint8Array from the buffer data
    const array = new Uint8Array(content.data);
    
    // Check for WAV signatures before any other processing
    if (content.data.length > 12 && 
        content.data[0] === 0x52 && content.data[1] === 0x49 && 
        content.data[2] === 0x46 && content.data[3] === 0x46 &&
        content.data[8] === 0x57 && content.data[9] === 0x41 && 
        content.data[10] === 0x56 && content.data[11] === 0x45) {
      console.log('Detected WAV file by signature!');
      contentType = 'audio/wav';
    }
    
    // If it's a text-based content type, return as string
    if (contentType && (
      contentType.startsWith('text/') || 
      contentType === 'application/json' ||
      contentType === 'application/javascript' ||
      contentType === 'application/xml' ||
      contentType === 'application/yaml'
    )) {
      try {
        // Convert to string using TextDecoder
        const text = new TextDecoder().decode(array);
        console.log(`Decoded text content (first 50 chars): ${text.substring(0, 50)}...`);
        return text;
      } catch (e) {
        logger.error('Error decoding text content:', e);
        // If string conversion fails, fallback to base64
      }
    }
    
    // For binary content types or text conversion failures, return as base64
    try {
      // Convert to base64 - fix for TypeScript type issues
      const base64 = SafeBuffer.from(Array.from(array)).toString('base64');
      return {
        type: 'base64',
        data: base64,
        originalType: contentType || 'application/octet-stream'
      };
    } catch (e) {
      logger.error('Error converting to base64:', e);
      // If all conversions fail, return original buffer format
      return content;
    }
  }
  
  // If content is already a string, return as is
  return content;
}

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
        
        const card = cardCollection.get(hash as string);
        
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
        
        // Get content type
        let contentTypeInfo: any = null;
        if (card.contentType) {
          contentTypeInfo = card.contentType;
          console.log('Using existing content type:', contentTypeInfo);
        } else {
          // Detect content type if not already available
          contentTypeInfo = ContentTypeInterpreter.detectContentType(card.content);
          console.log('Detected content type:', contentTypeInfo);
        }
        
        // Process content based on content type
        const processedContent = processCardContent(card.content, contentTypeInfo?.mimeType || null);
        
        console.log('card-collection API - Card retrieved:', {
          hash: card.hash,
          g_time: card.g_time,
          contentType: contentTypeInfo,
          contentFormat: processedContent && typeof processedContent === 'object' && processedContent.type === 'base64' 
            ? 'base64' 
            : typeof processedContent,
          contentLength: processedContent ? (typeof processedContent === 'string' ? processedContent.length : 
            (processedContent.data ? processedContent.data.length : 0)) : 0
        });
        
        // Return card data with processed content
        return new Response(
          JSON.stringify({
            success: true,
            card: {
              hash: card.hash,
              content: processedContent,
              hash_algorithm: card.hash_algorithm,
              timestamp: card.g_time || new Date().toISOString(),
              contentType: contentTypeInfo
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
          const errorMessage = error instanceof Error ? error.message : String(error as any);
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
          const errorMessage = error instanceof Error ? error.message : String(error as any);
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
    const errorMessage = error instanceof Error ? error.message : String(error as any);
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
    let action;
    let cardData;
    
    // Check content type to determine how to process the request
    const contentType = request.headers.get('Content-Type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData for binary uploads
      const formData = await request.formData();
      action = formData.get('action')?.toString();
      
      if (action === 'add') {
        const file = formData.get('file');
        const metadataStr = formData.get('metadata')?.toString();
        
        if (!file || !(file instanceof Blob)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'File data is required',
              timestamp: new Date().toISOString()
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        if (!metadataStr) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'File metadata is required',
              timestamp: new Date().toISOString()
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        const metadata = JSON.parse(metadataStr);
        const { fileName, mimeType, size } = metadata;
        
        // Convert file to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Create the content object - use SafeBuffer for binary data to ensure compatibility
        cardData = {
          content: SafeBuffer.from(new Uint8Array(arrayBuffer)), // Convert ArrayBuffer to SafeBuffer for proper binary handling
          hash_algorithm: 'sha256'
        };
      }
    } else {
      // Handle JSON data
      const data = await request.json();
      action = data.action;
      cardData = data.card;
    }
    
    // Initialize engine and card collection
    const engine = getStoreEngine();
    const cardCollection = new CardCollection(engine);
    
    logger.debug(`CardCollection API: Processing POST request with action: ${action}`);
    
    switch (action) {
      case 'add': {
        if (!cardData || typeof cardData !== 'object') {
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
        const { content, hash_algorithm } = cardData;
        
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
          // Create a new MCard with proper type assertions
          const card = new MCard(
            content as string | Buffer | Record<string, any>,
            (hash_algorithm as string) || undefined
          );
          
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
          const errorMessage = error instanceof Error ? error.message : String(error as any);
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
    const errorMessage = error instanceof Error ? error.message : String(error as any);
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
  try {
    const data = await request.json() as { action: string, hash: string };
    const action = data.action;
    
    // Initialize engine and card collection
    const engine = getStoreEngine();
    const cardCollection = new CardCollection(engine);
    
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
    
    const hash = data.hash;
    
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
    
    try {
      // Delete from collection
      cardCollection.delete(hash as string);
      
      return new Response(
        JSON.stringify({
          success: true,
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error as any);
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString()
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    logger.error('Error in CardCollection DELETE API:', error);
    const errorMessage = error instanceof Error ? error.message : String(error as any);
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
