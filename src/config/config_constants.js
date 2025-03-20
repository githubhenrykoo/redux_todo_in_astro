import dotenv from 'dotenv';
dotenv.config();
import path from 'path';

// Determine the current directory path
const projectRoot = process.cwd();

// Database Configuration
const DEFAULT_PAGE_SIZE = process.env.DEFAULT_PAGE_SIZE || 10;
const CARDS_DB_PATH = process.env.MCARD_DB_PATH || path.join(projectRoot, 'public', 'data', 'cards.db');
const TEST_DB_PATH = process.env.TEST_DB_PATH || path.join(projectRoot,'src','test', 'db' ,'test.db');
// Default Configuration Values
const DEFAULT_HASH_ALGORITHM = process.env.MCARD_HASH_ALGORITHM || 'md5';
const DEFAULT_HASH_LENGTH = process.env.DEFAULT_HASH_LENGTH || 64;

// Logging Configuration
const DEFAULT_LOG_LEVEL = 'info';
const LOG_LEVEL = process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL;

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
HashAlgorithm.DEFAULT = 'md5';

// Hash Algorithm Hierarchy
const HASH_ALGORITHM_HIERARCHY = {
  [HashAlgorithm.MD5]: HashAlgorithm.SHA1,
  [HashAlgorithm.SHA1]: HashAlgorithm.SHA224,
  [HashAlgorithm.SHA224]: HashAlgorithm.SHA256,
  [HashAlgorithm.SHA256]: HashAlgorithm.SHA384,
  [HashAlgorithm.SHA384]: HashAlgorithm.SHA512
};

// Hash Algorithm Metadata
const HashAlgorithmMetadata = {
  [HashAlgorithm.MD5]: {
    name: HashAlgorithm.MD5,
    description: 'MD5 hash function',
    outputLength: 32,
    isDefault: true
  },
  [HashAlgorithm.SHA1]: {
    name: HashAlgorithm.SHA1,
    description: 'SHA-1 hash function',
    outputLength: 40,
    isDefault: false
  },
  [HashAlgorithm.SHA224]: {
    name: HashAlgorithm.SHA224,
    description: 'SHA-224 hash function',
    outputLength: 56,
    isDefault: false
  },
  [HashAlgorithm.SHA256]: {
    name: HashAlgorithm.SHA256,
    description: 'SHA-256 hash function',
    outputLength: 64,
    isDefault: false
  },
  [HashAlgorithm.SHA384]: {
    name: HashAlgorithm.SHA384,
    description: 'SHA-384 hash function',
    outputLength: 96,
    isDefault: false
  },
  [HashAlgorithm.SHA512]: {
    name: HashAlgorithm.SHA512,
    description: 'SHA-512 hash function',
    outputLength: 128,
    isDefault: false
  }
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

// Export Strategy Notes:
// 1. Default Export: Allows importing the entire configuration object
//    Example: import configConstants from './config_constants.js'
//    Usage: configConstants.LOG_LEVEL
//
// 2. Named Exports: Allows importing specific constants directly
//    Example: import { LOG_LEVEL, HashAlgorithm } from './config_constants.js'
//    Usage: Directly use LOG_LEVEL or HashAlgorithm
//
// This approach provides maximum flexibility for importing and using constants

export default {
  // Database Constants
  DEFAULT_PAGE_SIZE,
  CARDS_DB_PATH,

  // Store Constants
  DEFAULT_HASH_ALGORITHM,
  DEFAULT_HASH_LENGTH,

  // Logging Constants
  DEFAULT_LOG_LEVEL,
  LOG_LEVEL,

  // Hash-related Exports
  HashAlgorithm,
  HASH_ALGORITHM_HIERARCHY,
  HashAlgorithmMetadata,
  VALID_HASH_FUNCTIONS,
  
  // Project Root
  projectRoot
};

export const configConstants = {
  // Database Constants
  DEFAULT_PAGE_SIZE,
  CARDS_DB_PATH,
  TEST_DB_PATH,

  // Store Constants
  DEFAULT_HASH_ALGORITHM,
  DEFAULT_HASH_LENGTH,

  // Logging Constants
  DEFAULT_LOG_LEVEL,
  LOG_LEVEL,

  // Hash-related Exports
  HashAlgorithm,
  HASH_ALGORITHM_HIERARCHY,
  HashAlgorithmMetadata,
  VALID_HASH_FUNCTIONS,
  
  // Project Root
  projectRoot
};

export {
  // Database Constants
  DEFAULT_PAGE_SIZE,
  CARDS_DB_PATH,
  TEST_DB_PATH,

  // Store Constants
  DEFAULT_HASH_ALGORITHM,
  DEFAULT_HASH_LENGTH,

  // Logging Constants
  DEFAULT_LOG_LEVEL,
  LOG_LEVEL,

  // Hash-related Exports
  HashAlgorithm,
  HASH_ALGORITHM_HIERARCHY,
  HashAlgorithmMetadata,
  VALID_HASH_FUNCTIONS,
  
  // Project Root
  projectRoot
};
