import crypto from 'crypto';
import { HashAlgorithm, HashAlgorithmMetadata } from '../../../config/config_constants.js';

/**
 * Create a function to get hash algorithm details
 * @param {string} algorithm - Hash algorithm to get details for
 * @returns {Object} Details of the hash algorithm
 */
export function getHashAlgorithmDetails(algorithm) {
  const normalizedAlgorithm = HashAlgorithm(algorithm);
  return HashAlgorithmMetadata[normalizedAlgorithm] || null;
}

/**
 * Get the output length of a hash algorithm
 * @param {string} algorithm - Hash algorithm to get output length for
 * @returns {number} Output length of the hash algorithm
 */
export function getHashOutputLength(algorithm) {
  const details = getHashAlgorithmDetails(algorithm);
  return details ? details.outputLength : 64; // Default to 64 if not found
}

/**
 * Check if a hash algorithm is the default
 * @param {string} algorithm - Hash algorithm to check
 * @returns {boolean} Whether the algorithm is the default
 */
export function isDefaultHashAlgorithm(algorithm) {
  const details = getHashAlgorithmDetails(algorithm);
  return details ? details.isDefault : false;
}

/**
 * Generate a hash using a specified algorithm
 * @param {string} input - Input to hash
 * @param {string} [algorithm] - Hash algorithm to use
 * @returns {string} Generated hash
 */
export function generateHash(input, algorithm = HashAlgorithm.DEFAULT) {
  const normalizedAlgorithm = HashAlgorithm(algorithm);
  const hash = crypto.createHash(normalizedAlgorithm);
  hash.update(input);
  return hash.digest('hex');
}

/**
 * Validate a hash against its algorithm
 * @param {string} hash - Hash to validate
 * @param {string} algorithm - Hash algorithm to validate against
 * @returns {boolean} Whether the hash is valid
 */
export function validateHash(hash, algorithm) {
  const details = getHashAlgorithmDetails(algorithm);
  if (!details) return false;

  // Check hash length
  if (hash.length !== details.outputLength) return false;

  // Check if hash contains only hexadecimal characters
  return /^[0-9a-fA-F]+$/.test(hash);
}

export default {
  getHashAlgorithmDetails,
  getHashOutputLength,
  isDefaultHashAlgorithm,
  generateHash,
  validateHash
};
