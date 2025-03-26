// Replace direct crypto import with environment-aware implementation
// import crypto from 'crypto';
import { encodeText } from '../../../../utils/textEncoderPolyfill.js';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Cross-environment hash function (similar to the one in validator.js)
const createHash = (algorithm) => {
  if (isBrowser) {
    // In browser environments, use Web Crypto API
    return {
      update: function(data) {
        this.data = data;
        return this;
      },
      digest: async function(encoding) {
        // Convert algorithm name to one supported by Web Crypto API
        const webCryptoAlg = algorithm === 'md5' ? 'SHA-1' : // Web Crypto doesn't support MD5, fallback to SHA-1
                            algorithm === 'sha1' ? 'SHA-1' :
                            algorithm === 'sha224' ? 'SHA-256' : // Web Crypto doesn't support SHA-224, fallback to SHA-256
                            algorithm === 'sha256' ? 'SHA-256' :
                            algorithm === 'sha384' ? 'SHA-384' :
                            algorithm === 'sha512' ? 'SHA-512' : 'SHA-256';
                            
        // Convert data to ArrayBuffer if needed
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
      }
    };
  } else {
    // In Node.js, use native crypto module
    try {
      // Dynamic require to avoid browser parsing issues
      const dynamicRequire = new Function('module', 'return require(module)');
      const crypto = dynamicRequire('crypto');
      return crypto.createHash(algorithm);
    } catch (e) {
      console.error('Crypto module not available:', e);
      throw new Error('Hash functionality not available in this environment');
    }
  }
};

/**
 * Base class for hash algorithms
 */
class BaseHashAlgorithm {
  /**
   * Constructor for BaseHashAlgorithm
   * @param {string} algorithmName - Name of the hash algorithm
   */
  constructor(algorithmName) {
    this.algorithmName = algorithmName;
  }

  /**
   * Compute hash for given content
   * @param {Uint8Array|string} content - Content to hash
   * @returns {string} Computed hash as hex string
   */
  async computeHash(content) {
    // Convert content to Uint8Array if it's a string
    const contentToHash = content instanceof Uint8Array 
      ? content 
      : encodeText(content);

    const hash = createHash(this.algorithmName);
    hash.update(contentToHash);
    return isBrowser ? await hash.digest('hex') : hash.digest('hex');
  }

  /**
   * Validate hash for given content
   * @param {Uint8Array|string} content - Content to validate
   * @param {string} expectedHash - Expected hash value
   * @returns {boolean} True if hash matches, false otherwise
   */
  async validateHash(content, expectedHash) {
    const computedHash = await this.computeHash(content);
    return computedHash === expectedHash;
  }
}

export default BaseHashAlgorithm;
