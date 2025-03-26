/**
 * Browser-compatible configuration constants
 * This file is only used in browser environments and contains no Node.js specific code
 */

// Hash constants
const MD5 = 'md5';
const SHA1 = 'sha1';
const SHA224 = 'sha224';
const SHA256 = 'sha256';
const SHA384 = 'sha384';
const SHA512 = 'sha512';

// Browser-safe constants
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_HASH_ALGORITHM = MD5;
const DEFAULT_HASH_LENGTH = 64;
const DEFAULT_LOG_LEVEL = 'info';
const LOG_LEVEL = DEFAULT_LOG_LEVEL;
const CARDS_DB_PATH = '/data/cards.db';
const TEST_DB_PATH = '/test/db/test.db';
const projectRoot = '';

// Browser-safe algorithm config
const HashAlgorithm = function(input) {
  if (!input) return DEFAULT_HASH_ALGORITHM;
  
  if (typeof input === 'string') {
    const normalized = input.toLowerCase();
    switch (normalized) {
      case MD5:
      case SHA1:
      case SHA224:
      case SHA256:
      case SHA384:
      case SHA512:
        return normalized;
      default:
        return DEFAULT_HASH_ALGORITHM;
    }
  }
  
  return DEFAULT_HASH_ALGORITHM;
};

// Add properties to HashAlgorithm
HashAlgorithm.MD5 = MD5;
HashAlgorithm.SHA1 = SHA1;
HashAlgorithm.SHA224 = SHA224;
HashAlgorithm.SHA256 = SHA256;
HashAlgorithm.SHA384 = SHA384;
HashAlgorithm.SHA512 = SHA512;
HashAlgorithm.DEFAULT = DEFAULT_HASH_ALGORITHM;

// Hash algorithm hierarchy
const HASH_ALGORITHM_HIERARCHY = {
  [MD5]: SHA1,
  [SHA1]: SHA224,
  [SHA224]: SHA256,
  [SHA256]: SHA384,
  [SHA384]: SHA512,
  [SHA512]: SHA512
};

// Hash metadata
const HashAlgorithmMetadata = {
  [MD5]: {
    name: 'MD5',
    description: 'MD5 message digest algorithm',
    secure: false,
    strength: 1
  },
  [SHA1]: {
    name: 'SHA-1',
    description: 'Secure Hash Algorithm 1',
    secure: false,
    strength: 2
  },
  [SHA224]: {
    name: 'SHA-224',
    description: 'Secure Hash Algorithm 2 (224 bits)',
    secure: true,
    strength: 3
  },
  [SHA256]: {
    name: 'SHA-256',
    description: 'Secure Hash Algorithm 2 (256 bits)',
    secure: true,
    strength: 4
  },
  [SHA384]: {
    name: 'SHA-384',
    description: 'Secure Hash Algorithm 2 (384 bits)',
    secure: true,
    strength: 5
  },
  [SHA512]: {
    name: 'SHA-512',
    description: 'Secure Hash Algorithm 2 (512 bits)',
    secure: true,
    strength: 6
  }
};

const VALID_HASH_FUNCTIONS = Object.keys(HashAlgorithmMetadata);

// Browser-safe path joining utility
const pathJoin = (...parts) => {
  return parts.filter(part => part && part.trim() !== '').join('/');
};

// Create config object for export
const configConstants = {
  DEFAULT_PAGE_SIZE,
  CARDS_DB_PATH,
  TEST_DB_PATH,
  DEFAULT_HASH_ALGORITHM,
  DEFAULT_HASH_LENGTH,
  DEFAULT_LOG_LEVEL,
  LOG_LEVEL,
  HashAlgorithm,
  HASH_ALGORITHM_HIERARCHY,
  HashAlgorithmMetadata,
  VALID_HASH_FUNCTIONS,
  projectRoot,
  pathJoin
};

// ES modules exports
export default configConstants;
export {
  DEFAULT_PAGE_SIZE,
  CARDS_DB_PATH,
  TEST_DB_PATH,
  DEFAULT_HASH_ALGORITHM,
  DEFAULT_HASH_LENGTH,
  DEFAULT_LOG_LEVEL,
  LOG_LEVEL,
  HashAlgorithm,
  HASH_ALGORITHM_HIERARCHY,
  HashAlgorithmMetadata,
  VALID_HASH_FUNCTIONS,
  projectRoot,
  pathJoin,
  configConstants
};
