/**
 * Environment-aware configuration entry point
 * 
 * This file detects whether we're in a browser or Node.js environment
 * and exports the appropriate configuration constants accordingly.
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

let config;

// Dynamic import based on environment
if (isBrowser) {
  // In the browser, use the browser-safe configuration
  config = require('./browser-constants.js');
} else {
  // In Node.js, use the full configuration with process.env support
  config = require('./config_constants.js');
}

// Re-export everything from the selected configuration
module.exports = config;

// Maintain compatibility with both named and default exports
if (config.default) {
  module.exports.default = config.default;
}

// Handle direct module references in ESM
export default config.default || config;
export const configConstants = config.configConstants || config;

// Export all named exports
for (const key in config) {
  if (key !== 'default' && key !== 'configConstants') {
    exports[key] = config[key];
  }
}
