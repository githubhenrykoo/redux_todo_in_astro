/**
 * ContentService
 * A service layer for fetching, processing, and caching different content types
 */

import { 
  processContent, 
  processBufferContent, 
  createDataUrlFromBuffer, 
  detectMimeTypeFromBuffer,
  getContentTypeDisplay
} from '../utils/content-utils';

/**
 * Cache map for storing processed content
 * Reduces redundant API calls and processing
 */
const contentCache = new Map();

/**
 * Service for handling content operations
 */
export class ContentService {
  /**
   * Fetch content for a single item
   * @param {string} hash - Item hash
   * @param {Object} options - Optional parameters including retry settings
   * @returns {Promise<Object>} - Processed content result
   */
  static async fetchContent(hash, options = {}) {
    const { useCache = true, maxRetries = 2 } = options;
    
    // Check cache first if enabled
    if (useCache && contentCache.has(hash)) {
      return contentCache.get(hash);
    }
    
    // Fetch with retry capability
    return this.fetchContentWithRetry(hash, { maxRetries });
  }
  
  /**
   * Fetch content with retry logic
   * @param {string} hash - Item hash
   * @param {Object} options - Options including retry count
   * @returns {Promise<Object>} - Processed content result
   */
  static async fetchContentWithRetry(hash, options = {}) {
    const { maxRetries = 2, delay = 500 } = options;
    let lastError = null;
    
    for (let attempt = 0; attempt < maxRetries + 1; attempt++) {
      try {
        // Add cache busting for retries
        const cacheBuster = attempt > 0 ? `&_=${Date.now()}` : '';
        const response = await fetch(`/api/card-collection?action=get&hash=${hash}${cacheBuster}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.card) {
          throw new Error(`Failed to fetch content for ${hash}`);
        }
        
        const { content, contentType } = data.card;
        const processedContent = processContent(content, contentType);
        
        const result = {
          hash,
          raw: data.card,
          processed: processedContent,
          contentType,
          error: null
        };
        
        // Store in cache
        contentCache.set(hash, result);
        
        return result;
      } catch (error) {
        console.error(`Error fetching content ${hash} (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
        lastError = error;
        
        // Only wait if we have more retries to go
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
        }
      }
    }
    
    // All retries failed - return error result
    const errorResult = {
      hash,
      raw: null,
      processed: null,
      contentType: null,
      error: lastError?.message || 'Unknown error during content fetch'
    };
    
    return errorResult;
  }
  
  /**
   * Get data URL for content if possible
   * @param {Object} item - Item with content and contentType
   * @returns {string|null} - Data URL or null
   */
  static getDataUrl(item) {
    if (!item || !item.content) return null;
    
    try {
      // Process the content if needed
      const processed = typeof item.processed === 'object' 
        ? item.processed 
        : processContent(item.content, item.contentType);
      
      // Return URL if already processed to dataUrl
      if (processed.type === 'dataUrl' && processed.url) {
        return processed.url;
      }
      
      // Handle Buffer JSON
      if (item.content.type === 'Buffer' && Array.isArray(item.content.data)) {
        const dataUrl = createDataUrlFromBuffer(
          item.content.data, 
          item.contentType?.mimeType || detectMimeTypeFromBuffer(item.content.data)
        );
        return dataUrl.url;
      }
      
      // Return null if no valid conversion possible
      return null;
    } catch (error) {
      console.error('Error creating data URL:', error);
      return null;
    }
  }
  
  /**
   * Get user-friendly display text for a content type
   * @param {Object} contentType - Content type object
   * @returns {string} - Display text for content type
   */
  static getContentTypeDisplay(contentType) {
    return getContentTypeDisplay(contentType);
  }
  
  /**
   * Clear content from cache
   * @param {string} hash - Optional hash to clear specific item, clears all if omitted
   */
  static clearCache(hash) {
    if (hash) {
      contentCache.delete(hash);
    } else {
      contentCache.clear();
    }
  }
  
  /**
   * Pre-fetch multiple content items for batch operations
   * @param {Array<string>} hashes - Array of item hashes to prefetch
   * @returns {Promise<Object>} - Map of hash to content result
   */
  static async prefetchContent(hashes) {
    if (!Array.isArray(hashes) || hashes.length === 0) {
      return {};
    }
    
    // Limit batch size for efficiency
    const batchSize = 5;
    const results = {};
    
    // Process in batches
    for (let i = 0; i < hashes.length; i += batchSize) {
      const batch = hashes.slice(i, i + batchSize);
      const promises = batch.map(hash => this.fetchContent(hash));
      
      const batchResults = await Promise.all(promises);
      
      // Collect results
      batchResults.forEach((result, index) => {
        const hash = batch[index];
        results[hash] = result;
      });
    }
    
    return results;
  }
}
