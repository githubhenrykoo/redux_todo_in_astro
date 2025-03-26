/**
 * Environment-aware configuration entry point
 * 
 * This file detects whether we're in a browser or Node.js environment
 * and exports the appropriate configuration constants accordingly.
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Import the configuration module - this will work because config_constants.js 
// now has environment-aware code that works in both browser and Node.js
import * as config from './config_constants.js';

// Export everything from config_constants
export default config.default || config;
export const configConstants = config;

// Re-export named exports for convenience
export const {
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
  projectRoot
} = config;
