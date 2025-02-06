import crypto from 'crypto';

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
  computeHash(content) {
    // Convert content to Uint8Array if it's a string
    const contentToHash = content instanceof Uint8Array 
      ? content 
      : new TextEncoder().encode(content);

    const hash = crypto.createHash(this.algorithmName);
    hash.update(contentToHash);
    return hash.digest('hex');
  }

  /**
   * Validate hash for given content
   * @param {Uint8Array|string} content - Content to validate
   * @param {string} expectedHash - Expected hash value
   * @returns {boolean} True if hash matches, false otherwise
   */
  validateHash(content, expectedHash) {
    const computedHash = this.computeHash(content);
    return computedHash === expectedHash;
  }
}

export default BaseHashAlgorithm;
