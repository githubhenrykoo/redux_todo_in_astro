// Check if we're in a browser environment
const isBrowser$1 = typeof window !== 'undefined';

// Default empty values that will be replaced in Node.js environment
let projectRoot = '';
let dotenv = null;
let path = null;

// Only import Node.js modules when in Node.js environment
// Use try/catch to make this safe in any environment
if (!isBrowser$1) {
  try {
    // Use dynamic import with eval to prevent browser parsing errors
    // This code won't execute in the browser because of the isBrowser check
    if (typeof process !== 'undefined') {
      projectRoot = process.cwd();
      
      // Only attempt to load Node.js modules in a Node.js environment
      try {
        // Use a function wrapper to avoid direct require syntax that browsers will parse
        const dynamicRequire = new Function('module', 'return require(module)');
        dotenv = dynamicRequire('dotenv');
        path = dynamicRequire('path');
        
        // Configure dotenv if available
        if (dotenv && dotenv.config) {
          dotenv.config();
        }
      } catch (e) {
        console.warn('Node.js modules not available:', e.message);
      }
    }
  } catch (e) {
    console.warn('Unable to determine environment:', e.message);
  }
}

// Safe path join function that works in any environment
const safePath = (base, ...parts) => {
  if (path && path.join) {
    return path.join(base, ...parts);
  } else {
    return [base, ...parts].filter(Boolean).join('/');
  }
};

// Database Configuration
const DEFAULT_PAGE_SIZE = isBrowser$1 ? 10 : (process.env?.DEFAULT_PAGE_SIZE || 10);
const CARDS_DB_PATH = isBrowser$1 
  ? '/data/cards.db' 
  : (process.env?.MCARD_DB_PATH || safePath(projectRoot, 'public', 'data', 'cards.db'));
isBrowser$1
  ? '/test/db/test.db'
  : (process.env?.TEST_DB_PATH || safePath(projectRoot, 'src', 'test', 'db', 'test.db'));

// Default Configuration Values
isBrowser$1 ? 'sha256' : (process.env?.MCARD_HASH_ALGORITHM || 'sha256');
isBrowser$1 ? 64 : (process.env?.DEFAULT_HASH_LENGTH || 64);

// Logging Configuration
const DEFAULT_LOG_LEVEL = 'info';
isBrowser$1 ? DEFAULT_LOG_LEVEL : (process.env?.LOG_LEVEL || DEFAULT_LOG_LEVEL);

// Hash Algorithm Configuration
const HashAlgorithm = (input) => {
  // Return default value for null or undefined
  if (input === null || input === undefined) {
    return HashAlgorithm.DEFAULT;
  }

  // Normalize input to lowercase and trim
  const normalizedInput = input.toString().toLowerCase().trim();

  // Check if the input matches any of the predefined hash algorithms
  return VALID_HASH_FUNCTIONS.includes(normalizedInput) ? normalizedInput : HashAlgorithm.DEFAULT;
};

// Add the existing constants as properties
HashAlgorithm.MD5 = 'md5';
HashAlgorithm.SHA1 = 'sha1';
HashAlgorithm.SHA224 = 'sha224';
HashAlgorithm.SHA256 = 'sha256';
HashAlgorithm.SHA384 = 'sha384';
HashAlgorithm.SHA512 = 'sha512';
HashAlgorithm.CUSTOM = 'custom';
HashAlgorithm.DEFAULT = 'sha256';

// Hash Algorithm Hierarchy
const HASH_ALGORITHM_HIERARCHY = {
  [HashAlgorithm.MD5]: HashAlgorithm.SHA1,
  [HashAlgorithm.SHA1]: HashAlgorithm.SHA224,
  [HashAlgorithm.SHA224]: HashAlgorithm.SHA256,
  [HashAlgorithm.SHA256]: HashAlgorithm.SHA384,
  [HashAlgorithm.SHA384]: HashAlgorithm.SHA512
};

const VALID_HASH_FUNCTIONS = [
  HashAlgorithm.MD5,
  HashAlgorithm.SHA1,
  HashAlgorithm.SHA224,
  HashAlgorithm.SHA256,
  HashAlgorithm.SHA384,
  HashAlgorithm.SHA512,
  HashAlgorithm.CUSTOM
];

/**
 * Cross-environment TextEncoder compatibility layer
 * 
 * This module provides a TextEncoder implementation that works in both
 * Node.js and browser environments, avoiding hydration errors.
 */

// Detect the environment
const isBrowser = typeof window !== 'undefined';

// Get the appropriate TextEncoder instance based on environment
const getTextEncoder = () => {
  // Browser environment - use built-in TextEncoder if available
  if (isBrowser && typeof window.TextEncoder !== 'undefined') {
    return new window.TextEncoder();
  }
  
  // Global TextEncoder (modern browsers and some Node.js environments)
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder();
  }
  
  // Node.js environment - use util.TextEncoder but only if we're not in a browser
  if (!isBrowser && typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      // Use dynamic import technique to avoid browser parsing issues
      const dynamicRequire = new Function('module', 'return require(module)');
      const util = dynamicRequire('util');
      if (util && util.TextEncoder) {
        return new util.TextEncoder();
      }
    } catch (e) {
      // Fall through to the polyfill
    }
  }
  
  // Fallback implementation for environments without TextEncoder
  return {
    encode: (str) => {
      if (!str) return new Uint8Array();
      
      const utf8 = [];
      for (let i = 0; i < str.length; i++) {
        let charCode = str.charCodeAt(i);
        if (charCode < 0x80) {
          utf8.push(charCode);
        } else if (charCode < 0x800) {
          utf8.push(0xc0 | (charCode >> 6), 
                    0x80 | (charCode & 0x3f));
        } else if (charCode < 0xd800 || charCode >= 0xe000) {
          utf8.push(0xe0 | (charCode >> 12), 
                    0x80 | ((charCode >> 6) & 0x3f), 
                    0x80 | (charCode & 0x3f));
        } else {
          // Handle surrogate pair
          i++;
          charCode = ((charCode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff);
          charCode += 0x10000;
          utf8.push(0xf0 | (charCode >> 18), 
                    0x80 | ((charCode >> 12) & 0x3f), 
                    0x80 | ((charCode >> 6) & 0x3f), 
                    0x80 | (charCode & 0x3f));
        }
      }
      return new Uint8Array(utf8);
    }
  };
};

// Create a singleton instance
const textEncoder = getTextEncoder();

// Export the encode function as the main API
const encodeText = (text) => {
  if (text === null || text === undefined) {
    return new Uint8Array();
  }
  
  // Convert non-string inputs to strings
  const inputString = typeof text === 'string' ? text : String(text);
  return textEncoder.encode(inputString);
};

/**
 * Cross-environment crypto polyfill
 * 
 * This module provides a unified interface for cryptographic operations
 * that works in both browser and Node.js/SSR environments.
 */


// Since Astro SSR environment is complex and sometimes behaves like browser, 
// sometimes like Node.js, we need to carefully detect capabilities
const hasWebCrypto = typeof window !== 'undefined' && window.crypto && window.crypto.subtle;
typeof process !== 'undefined' && process.versions && process.versions.node;

/**
 * Create a hash object that works in any environment
 * @param {string} algorithm - Hash algorithm to use
 * @returns {Object} Hash object with update and digest methods
 */
function createHash(algorithm) {
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

export { CARDS_DB_PATH as C, DEFAULT_PAGE_SIZE as D, HashAlgorithm as H, VALID_HASH_FUNCTIONS as V, HASH_ALGORITHM_HIERARCHY as a, createHash as c, encodeText as e };
