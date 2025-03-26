import { 
  HashAlgorithm as ConfigHashAlgorithm, 
  HashAlgorithmMetadata 
} from '../../../config/config_constants.js';
import { encodeText } from '../../../utils/textEncoderPolyfill.js';

/**
 * Common hash algorithm enumerations
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Define valid hash algorithms across environments
const VALID_HASH_ALGORITHMS = [
  'md5',
  'sha1',
  'sha224',
  'sha256',
  'sha384',
  'sha512'
];

// Get list of supported hash functions in the current environment
const getSupportedHashAlgorithms = () => {
  if (isBrowser) {
    // In browser, Web Crypto API generally supports these algorithms
    return [
      'sha-1',
      'sha-256',
      'sha-384',
      'sha-512'
    ];
  } else {
    // In Node.js, try to get the full list from crypto
    try {
      // Dynamic require to avoid browser parsing issues
      const dynamicRequire = new Function('module', 'return require(module)');
      const crypto = dynamicRequire('crypto');
      return crypto.getHashes();
    } catch (e) {
      console.warn('Unable to get hash algorithms from crypto:', e.message);
      // Return common algorithms as fallback
      return VALID_HASH_ALGORITHMS;
    }
  }
};

export const HashAlgorithm = {
  MD5: 'md5',
  SHA1: 'sha1',
  SHA224: 'sha224',
  SHA256: 'sha256',
  SHA384: 'sha384',
  SHA512: 'sha512',
  DEFAULT: 'sha256',
  
  // Method to check if algorithm is supported
  isSupported: (algorithm) => {
    if (!algorithm) return false;
    const normalized = String(algorithm).toLowerCase().trim();
    
    // Get algorithms supported in current environment
    const supportedAlgorithms = getSupportedHashAlgorithms();
    
    return supportedAlgorithms.includes(normalized);
  }
};

/**
 * Create a function to get hash algorithm details
 * 
 * @param {string} algorithm - Algorithm name
 * @returns {Object} Algorithm details
 */
export function getHashAlgorithmDetails(algorithm = HashAlgorithm.DEFAULT) {
  const normalizedAlgorithm = ConfigHashAlgorithm(algorithm);
  return HashAlgorithmMetadata[normalizedAlgorithm] || HashAlgorithmMetadata[HashAlgorithm.DEFAULT];
}

/**
 * Verify if a hash is valid for a given algorithm
 * 
 * @param {string} hash - Hash to verify
 * @param {string} algorithm - Algorithm name
 * @returns {boolean} True if hash is valid
 */
export function isValidHash(hash, algorithm = HashAlgorithm.DEFAULT) {
  if (!hash) return false;
  
  const algDetails = getHashAlgorithmDetails(algorithm);
  return hash.length === algDetails.outputLength;
}

/**
 * Generate a hash from input using specified algorithm
 * 
 * @param {string} input - Input to hash
 * @param {string} algorithm - Algorithm to use
 * @returns {string|Promise<string>} Generated hash (Promise in browser)
 */
export function generateHash(input, algorithm = HashAlgorithm.DEFAULT) {
  const normalizedAlgorithm = ConfigHashAlgorithm(algorithm);
  
  // Convert algorithm name to format supported by Web Crypto API
  const getCryptoAlgorithm = (alg) => {
    switch(alg) {
      case 'md5': return 'SHA-1'; // Web Crypto doesn't support MD5
      case 'sha1': return 'SHA-1';
      case 'sha224': return 'SHA-256'; // Fallback to SHA-256
      case 'sha256': return 'SHA-256';
      case 'sha384': return 'SHA-384';
      case 'sha512': return 'SHA-512';
      default: return 'SHA-256';
    }
  };
  
  if (isBrowser) {
    // In browser, use Web Crypto API
    const textData = typeof input === 'string' ? input : JSON.stringify(input);
    const encodedData = encodeText(textData);
    
    return window.crypto.subtle.digest(
      getCryptoAlgorithm(normalizedAlgorithm),
      encodedData.buffer
    ).then(hash => {
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    });
  } else {
    // In Node.js, use crypto
    try {
      const dynamicRequire = new Function('module', 'return require(module)');
      const crypto = dynamicRequire('crypto');
      const hash = crypto.createHash(normalizedAlgorithm);
      hash.update(typeof input === 'string' ? input : JSON.stringify(input));
      return hash.digest('hex');
    } catch (e) {
      console.error('Error generating hash:', e);
      return '';
    }
  }
}

/**
 * Compare two hashes securely
 * 
 * @param {string} hash1 - First hash
 * @param {string} hash2 - Second hash
 * @returns {boolean} True if hashes match
 */
export function compareHashes(hash1, hash2) {
  if (!hash1 || !hash2) return false;
  if (hash1.length !== hash2.length) return false;
  
  let result = 0;
  for (let i = 0; i < hash1.length; i++) {
    result |= hash1.charCodeAt(i) ^ hash2.charCodeAt(i);
  }
  
  return result === 0;
}

export default {
  HashAlgorithm,
  VALID_HASH_ALGORITHMS,
  getHashAlgorithmDetails,
  isValidHash,
  generateHash,
  compareHashes
};
