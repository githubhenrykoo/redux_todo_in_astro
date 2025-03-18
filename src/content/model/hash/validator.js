import crypto from 'crypto';
import { TextEncoder } from 'util';
import { 
  HashAlgorithm, 
  HASH_ALGORITHM_HIERARCHY, 
  VALID_HASH_FUNCTIONS 
} from '../../../config/config_constants.js';

export default class HashValidator {
  /**
   * Constructor for HashValidator
   */
  constructor(content, hashAlgorithm = HashAlgorithm.DEFAULT) {
    // Convert content to Buffer if it's a string
    this.content = content instanceof Buffer 
      ? content 
      : new TextEncoder().encode(content);
    
    this.hashAlgorithm = this.normalizeHashAlgorithm(hashAlgorithm);
    this.hashValue = this.computeHash();
  }

  /**
   * Normalizes the hash algorithm input
   * @param {string|Object} hashAlgorithm - The hash algorithm to normalize
   * @returns {string} Normalized hash algorithm
   */
  normalizeHashAlgorithm(hashAlgorithm) {
    // Handle undefined or null input
    if (hashAlgorithm === undefined || hashAlgorithm === null) {
      return HashAlgorithm.DEFAULT;
    }
    
    // If input is an object, try to extract the type
    if (typeof hashAlgorithm === 'object') {
      hashAlgorithm = hashAlgorithm.type || hashAlgorithm.value || HashAlgorithm.DEFAULT;
    }
    
    // Convert to lowercase string
    const normalizedAlgo = String(hashAlgorithm).toLowerCase();
    
    // Validate the hash algorithm
    if (!HashValidator.isValidHashFunction(normalizedAlgo)) {
      throw new Error(`Invalid hash algorithm: ${normalizedAlgo}`);
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
    return crypto.getHashes().includes(normalizedFunc);
  }

  /**
   * Computes hash for the content
   * @returns {string} Computed hash
   */
  computeHash() {
    try {
      const hash = crypto.createHash(this.hashAlgorithm);
      hash.update(this.content);
      return hash.digest('hex');
    } catch (error) {
      console.error(`Error computing hash with ${this.hashAlgorithm}:`, error);
      return null;
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
   * @param {Buffer|string} content - Content to hash
   * @param {string} [hashAlgorithm=HashAlgorithm.DEFAULT] - Hash algorithm to use
   * @returns {string} Computed hash
   */
  static computeHash(content, hashAlgorithm = HashAlgorithm.DEFAULT) {
    const encoder = new TextEncoder();
    const buffer = content instanceof Buffer 
      ? content 
      : encoder.encode(content);
    
    const hash = crypto.createHash(hashAlgorithm);
    hash.update(buffer);
    return hash.digest('hex');
  }

  /**
   * Validate hash against an expected hash
   * @param {string} [expectedHash] - Expected hash value
   * @returns {boolean} True if hash matches, false otherwise
   */
  validate(expectedHash) {
    if (!expectedHash) return false;
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
