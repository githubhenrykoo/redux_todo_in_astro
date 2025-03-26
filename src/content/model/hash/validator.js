// Replace direct crypto import with environment-aware implementation
import { encodeText } from '../../../utils/textEncoderPolyfill.js';
import { SafeBuffer } from '../../../utils/bufferPolyfill.js';
import { 
  HashAlgorithm, 
  HASH_ALGORITHM_HIERARCHY, 
  VALID_HASH_FUNCTIONS 
} from '../../../config/config_constants.js';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Create a cross-environment crypto hash function that works in both browser and Node.js
const createHash = (algorithm) => {
  // Convert to lowercase and remove hyphens for consistency
  const normalizedAlg = String(algorithm).toLowerCase().replace('-', '');
  
  if (isBrowser) {
    // In browser environments, use Web Crypto API
    return {
      data: null,
      update: function(data) {
        this.data = data;
        return this;
      },
      digest: async function(encoding) {
        if (!this.data) return encoding === 'hex' ? '' : new Uint8Array();
        
        // Convert algorithm name to one supported by Web Crypto API
        const webCryptoAlg = 
          normalizedAlg === 'md5' ? 'SHA-1' : // Web Crypto doesn't support MD5, fallback to SHA-1
          normalizedAlg === 'sha1' ? 'SHA-1' :
          normalizedAlg === 'sha224' ? 'SHA-256' : // Web Crypto doesn't support SHA-224
          normalizedAlg === 'sha256' ? 'SHA-256' :
          normalizedAlg === 'sha384' ? 'SHA-384' :
          normalizedAlg === 'sha512' ? 'SHA-512' : 'SHA-256';
        
        try {
          // Ensure data is a proper Uint8Array
          const dataBuffer = this.data instanceof Uint8Array 
            ? this.data.buffer 
            : encodeText(this.data).buffer;
          
          // Use Web Crypto API to compute hash
          const hashBuffer = await window.crypto.subtle.digest(webCryptoAlg, dataBuffer);
          
          // Convert to hex string if requested
          if (encoding === 'hex') {
            return Array.from(new Uint8Array(hashBuffer))
              .map(b => b.toString(16).padStart(2, '0'))
              .join('');
          }
          
          // Return raw buffer if no encoding specified
          return new Uint8Array(hashBuffer);
        } catch (e) {
          console.error('Error using Web Crypto API:', e);
          return encoding === 'hex' ? '' : new Uint8Array();
        }
      }
    };
  } else {
    // In Node.js, try to use native crypto module
    try {
      // Only attempt to use require in non-browser environments
      const crypto = require('crypto');
      return crypto.createHash(normalizedAlg);
    } catch (e) {
      console.error('Crypto module not available:', e);
      
      // Return a dummy hash object that does nothing
      return {
        update: function() { return this; },
        digest: function(encoding) { 
          return encoding === 'hex' ? 'no-crypto-available' : new Uint8Array();
        }
      };
    }
  }
};

export default class HashValidator {
  /**
   * Constructor for HashValidator
   */
  constructor(content, hashAlgorithm = HashAlgorithm.DEFAULT) {
    // Convert content to Buffer/Uint8Array if it's a string
    this.content = SafeBuffer.isBuffer(content) 
      ? content 
      : encodeText(content);
    
    this.hashAlgorithm = this.normalizeHashAlgorithm(hashAlgorithm);
    
    // In browser environments, we can't synchronously compute crypto hashes
    if (isBrowser) {
      this.hashValue = "computing...";
      this._computeHashAsync().then(hash => {
        this.hashValue = hash;
      });
    } else {
      this.hashValue = this.computeHash();
    }
  }
  
  /**
   * Async computation of hash for browser environments
   * @private
   */
  async _computeHashAsync() {
    const hash = createHash(this.hashAlgorithm);
    hash.update(this.content);
    return await hash.digest('hex');
  }

  /**
   * Normalizes the hash algorithm input
   * @param {string|Object} hashAlgorithm - The hash algorithm to normalize
   * @returns {string} Normalized hash algorithm
   */
  normalizeHashAlgorithm(hashAlgorithm) {
    // Handle undefined or null input
    if (hashAlgorithm === undefined || hashAlgorithm === null) {
      return HashAlgorithm.DEFAULT || 'sha256';
    }
    
    // If input is an object, try to extract the type
    if (typeof hashAlgorithm === 'object') {
      hashAlgorithm = hashAlgorithm.type || hashAlgorithm.value || HashAlgorithm.DEFAULT || 'sha256';
    }
    
    // Convert to lowercase string and remove dashes for consistency
    const normalizedAlgo = String(hashAlgorithm).toLowerCase().replace('-', '');
    
    // Validate the hash algorithm
    if (!HashValidator.isValidHashFunction(normalizedAlgo)) {
      console.warn(`Invalid hash algorithm: ${normalizedAlgo}, using default instead`);
      return HashAlgorithm.DEFAULT || 'sha256';
    }
    
    return normalizedAlgo;
  }

  /**
   * Validates a hash function
   * @param {string} hashFunction - Hash function to validate
   * @returns {boolean} Whether the hash function is valid
   */
  static isValidHashFunction(hashFunction) {
    if (!hashFunction) return false;
    
    const normalizedFunc = String(hashFunction).toLowerCase().trim();
    
    // Accept both formats: with dashes (Web Crypto format) and without dashes (Node.js format)
    const validAlgorithms = [
      // Node.js format
      'md5', 'sha1', 'sha224', 'sha256', 'sha384', 'sha512',
      // Web Crypto format
      'sha-1', 'sha-256', 'sha-384', 'sha-512'
    ];
    
    return validAlgorithms.includes(normalizedFunc) || 
           validAlgorithms.includes(normalizedFunc.replace('-', ''));
  }

  /**
   * Compute hash from content
   * @returns {string} Computed hash
   */
  computeHash() {
    if (isBrowser) {
      // In browser, we can't compute synchronously
      return "computing...";
    }
    
    try {
      const hash = createHash(this.hashAlgorithm);
      hash.update(this.content);
      return hash.digest('hex');
    } catch (e) {
      console.error('Error computing hash:', e);
      return '';
    }
  }

  /**
   * Getter for hash value
   * @returns {string} Hash value
   */
  getHashValue() {
    return this.hashValue;
  }

  /**
   * Getter for hash algorithm
   * @returns {string} Hash algorithm
   */
  getHashAlgorithm() {
    return this.hashAlgorithm;
  }

  /**
   * Static method to compute hash
   * @param {string|Buffer} content - Content to hash
   * @param {string} hashAlgorithm - Algorithm to use
   * @returns {string|Promise<string>} Computed hash or Promise of hash in browser
   */
  static computeHash(content, hashAlgorithm = HashAlgorithm.DEFAULT) {
    const buffer = SafeBuffer.isBuffer(content) 
      ? content 
      : encodeText(content);
    
    const hash = createHash(hashAlgorithm);
    hash.update(buffer);
    
    if (isBrowser) {
      // In browser, we need to handle async
      return hash.digest('hex');
    }
    
    return hash.digest('hex');
  }

  /**
   * Validate hash against an expected hash
   * @param {string} [expectedHash] - Expected hash value
   * @returns {boolean|Promise<boolean>} True if hash matches, false otherwise
   */
  validate(expectedHash) {
    if (!expectedHash) return false;
    
    if (isBrowser) {
      // In browser, we need to handle async validation
      return this._computeHashAsync().then(computedHash => {
        return computedHash === expectedHash;
      });
    }
    
    return this.hashValue === expectedHash;
  }

  /**
   * Gets the strength order of hash algorithms
   * @returns {string[]} Ordered list of hash algorithms by strength
   */
  getHashAlgorithmStrengthOrder() {
    return [
      HashAlgorithm.MD5,
      HashAlgorithm.SHA1,
      HashAlgorithm.SHA224,
      HashAlgorithm.SHA256,
      HashAlgorithm.SHA384,
      HashAlgorithm.SHA512
    ];
  }

  /**
   * Gets the strength index of a hash algorithm
   * @param {string} algorithm - Hash algorithm
   * @returns {number} Strength index
   */
  getHashAlgorithmStrength(algorithm) {
    return this.getHashAlgorithmStrengthOrder().indexOf(algorithm);
  }

  /**
   * Checks if one hash algorithm is stronger than another
   * @param {string} current - Current hash algorithm
   * @param {string} upgrade - Potential upgrade hash algorithm
   * @returns {boolean} Whether the upgrade is stronger
   */
  isStrongerHashAlgorithm(current, upgrade) {
    return this.getHashAlgorithmStrength(upgrade) > this.getHashAlgorithmStrength(current);
  }

  /**
   * Determines the next hash algorithm in the upgrade path
   * @param {string|Object} currentHashFunction - Current hash function
   * @returns {string} Next hash algorithm
   */
  nextHashFunction(currentHashFunction) {
    const strengthOrder = this.getHashAlgorithmStrengthOrder();

    // Handle undefined or null input
    if (currentHashFunction === undefined || currentHashFunction === null) {
      return HashAlgorithm.MD5;
    }

    // Extract hash function value if it's an object
    const currentHash = typeof currentHashFunction === 'object' 
      ? currentHashFunction.value || currentHashFunction.type 
      : currentHashFunction;

    // Normalize to lowercase
    const normalizedHash = (currentHash || '').toLowerCase();

    // Find current index
    const currentIndex = strengthOrder.indexOf(normalizedHash);

    // Special case for SHA512 - wrap around to SHA1
    if (normalizedHash === HashAlgorithm.SHA512) {
      return HashAlgorithm.SHA1;
    }

    // If not found or last in order, return default (first hash function)
    if (currentIndex === -1 || currentIndex === strengthOrder.length - 1) {
      return HashAlgorithm[strengthOrder[0].toUpperCase()];
    }

    // Return the next hash function in the order as an enum
    return HashAlgorithm[strengthOrder[currentIndex + 1].toUpperCase()];
  }

  /**
   * Static method to get supported hash algorithms
   * @returns {string[]} List of supported hash algorithms
   */
  static getSupportedAlgorithms() {
    return [
      HashAlgorithm.MD5,
      HashAlgorithm.SHA1,
      HashAlgorithm.SHA256,
      HashAlgorithm.SHA512
    ];
  }

  static compute_hash(content, hashAlgorithm = HashAlgorithm.DEFAULT) {
    return HashValidator.computeHash(content, hashAlgorithm);
  }

  static HashAlgorithm = HashAlgorithm;
  static HASH_ALGORITHM_HIERARCHY = HASH_ALGORITHM_HIERARCHY;
  static VALID_HASH_FUNCTIONS = VALID_HASH_FUNCTIONS;
}

export { HashAlgorithm, HASH_ALGORITHM_HIERARCHY, VALID_HASH_FUNCTIONS };
