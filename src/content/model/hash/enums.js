import crypto from 'crypto';
import { HashAlgorithm, HashAlgorithmMetadata } from '../../config/config_constants.js';

/**
 * Create a function to get hash algorithm details
 * @param {string} algorithm - Hash algorithm value
 * @returns {Object} Hash algorithm details
 */
const getAlgorithmDetails = (algorithm) => {
  const normalizedAlgo = algorithm.toLowerCase();
  const algorithmDetails = Object.values(HashAlgorithmMetadata)
    .find(algo => algo.value === normalizedAlgo);
  
  if (!algorithmDetails) {
    throw new Error(`Unsupported hash algorithm: ${algorithm}`);
  }
  
  return algorithmDetails;
};

/**
 * Compute hash for given content using specified algorithm
 * @param {Uint8Array} content - Content to hash
 * @param {string} algorithm - Hash algorithm
 * @returns {string} Computed hash
 */
const hash = (content, algorithm) => {
  const hash = crypto.createHash(algorithm.toLowerCase());
  hash.update(content);
  return hash.digest('hex');
};

// Utility function for hash generation
const generateHash = (input, algorithm = HashAlgorithm.DEFAULT) => {
  const hash = crypto.createHash(algorithm);
  hash.update(input);
  return hash.digest('hex');
};

// Correct way to do a default export
const HashAlgorithmEnum = {
  HashAlgorithm,
  HashAlgorithmMetadata,
  getAlgorithmDetails,
  hash,
  generateHash
};

export default HashAlgorithmEnum;  // This is the key line
