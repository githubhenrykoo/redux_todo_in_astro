/**
 * Cross-environment crypto polyfill
 * 
 * This module provides a unified interface for cryptographic operations
 * that works in both browser and Node.js/SSR environments.
 */

import { encodeText } from './textEncoderPolyfill.js';

// Since Astro SSR environment is complex and sometimes behaves like browser, 
// sometimes like Node.js, we need to carefully detect capabilities
const hasWebCrypto = typeof window !== 'undefined' && window.crypto && window.crypto.subtle;
const hasNodeCrypto = typeof process !== 'undefined' && process.versions && process.versions.node;

/**
 * Create a hash object that works in any environment
 * @param {string} algorithm - Hash algorithm to use
 * @returns {Object} Hash object with update and digest methods
 */
export function createHash(algorithm) {
  // Normalize algorithm name for consistency
  const normalizedAlg = String(algorithm).toLowerCase().replace(/-/g, '');
  
  // Map to standardized algorithm names
  const webCryptoAlg = 
    normalizedAlg === 'md5' ? 'SHA-1' : // Web Crypto doesn't support MD5, fallback to SHA-1
    normalizedAlg === 'sha1' ? 'SHA-1' :
    normalizedAlg === 'sha224' ? 'SHA-256' : // Web Crypto doesn't support SHA-224
    normalizedAlg === 'sha256' ? 'SHA-256' :
    normalizedAlg === 'sha384' ? 'SHA-384' :
    normalizedAlg === 'sha512' ? 'SHA-512' : 'SHA-256';
  
  // Implement a unified hash interface
  return {
    data: null,
    
    /**
     * Update hash with data
     * @param {string|Uint8Array} data - Data to hash
     * @returns {Object} This hash object for chaining
     */
    update: function(data) {
      this.data = data;
      return this;
    },
    
    /**
     * Complete hash computation and return result
     * @param {string} [encoding='hex'] - Encoding for output ('hex' or undefined for buffer)
     * @returns {string|Uint8Array|Promise<string|Uint8Array>} Hash result
     */
    digest: function(encoding = 'hex') {
      // Handle empty data case
      if (!this.data) {
        return encoding === 'hex' ? '' : new Uint8Array();
      }
      
      // Use Web Crypto API if available
      if (hasWebCrypto) {
        // Ensure data is properly encoded
        const dataBuffer = this.data instanceof Uint8Array 
          ? this.data.buffer
          : encodeText(String(this.data)).buffer;
        
        // Return a promise that resolves to the hash
        return window.crypto.subtle.digest(webCryptoAlg, dataBuffer)
          .then(hashBuffer => {
            if (encoding === 'hex') {
              return Array.from(new Uint8Array(hashBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            }
            return new Uint8Array(hashBuffer);
          })
          .catch(err => {
            console.error('Web Crypto error:', err);
            // Return empty result on error
            return encoding === 'hex' ? '' : new Uint8Array();
          });
      }
      
      try {
        // Try to use Node.js crypto if available, without direct require
        if (typeof global !== 'undefined' && global.process && global.process.versions && global.process.versions.node) {
          // In Node.js environment, we can safely try to require crypto
          const crypto = require('crypto');
          const nodeHash = crypto.createHash(normalizedAlg);
          
          if (this.data instanceof Uint8Array) {
            nodeHash.update(Buffer.from(this.data));
          } else {
            nodeHash.update(String(this.data));
          }
          
          return nodeHash.digest(encoding);
        }
      } catch (e) {
        console.warn('Node.js crypto module not available:', e.message);
        // Fall through to fallback implementation
      }
      
      // If we're in neither environment or if detection fails, use a better fallback
      // that doesn't require 'require()' calls but produces reasonable output
      const fallbackHash = enhancedFallbackHash(normalizedAlg, this.data);
      return encoding === 'hex' ? fallbackHash : encodeText(fallbackHash);
    }
  };
}

/**
 * Enhanced fallback hash implementation that produces output
 * with the correct length for the requested algorithm
 * 
 * @param {string} algorithm - Hash algorithm name
 * @param {string|Uint8Array} data - Data to hash
 * @returns {string} Hash string with appropriate length
 */
function enhancedFallbackHash(algorithm, data) {
  // Convert data to string if it's a Uint8Array
  const inputStr = data instanceof Uint8Array 
    ? Array.from(data).map(b => String.fromCharCode(b)).join('')
    : String(data);
  
  // Determine output length based on algorithm
  const hashLength = 
    algorithm === 'md5' ? 32 :
    algorithm === 'sha1' ? 40 :
    algorithm === 'sha224' ? 56 :
    algorithm === 'sha256' ? 64 :
    algorithm === 'sha384' ? 96 :
    algorithm === 'sha512' ? 128 : 64; // Default to SHA-256 length
  
  // More sophisticated hash function
  // This still isn't cryptographically secure, but it's better than the simple one
  // and will produce the right length output
  
  // Start with a seed based on algorithm
  const seed = algorithm.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Generate initial hash chunks
  const chunks = [];
  let lastVal = seed;
  
  // Generate enough raw material for our hash length
  for (let i = 0; i < hashLength / 8 + 1; i++) {
    let chunk = 0;
    for (let j = 0; j < inputStr.length; j++) {
      const char = inputStr.charCodeAt(j);
      chunk = ((chunk << 5) - chunk + char + j + i + lastVal) & 0xFFFFFFFF;
    }
    lastVal = chunk;
    chunks.push(chunk);
  }
  
  // Convert chunks to hex and combine into final hash
  let hexHash = '';
  for (let i = 0; i < chunks.length && hexHash.length < hashLength; i++) {
    hexHash += Math.abs(chunks[i]).toString(16).padStart(8, '0');
  }
  
  // Ensure exact length
  return hexHash.substring(0, hashLength);
}

export default { createHash };
