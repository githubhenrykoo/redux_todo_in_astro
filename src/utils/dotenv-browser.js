/**
 * Browser-compatible dotenv replacement
 * Provides a no-op implementation of dotenv for browser environments
 */

// Create browser-safe "process.env" equivalent
const browserEnv = {};

// Create a browser-safe version of the dotenv module
const dotenvBrowser = {
  // No-op config function that returns an empty object in browser context
  config: () => ({ parsed: {} }),
  
  // Provide access to our browser environment variables
  env: browserEnv,
  
  // Add any variables from window.__ENV__ if it exists (useful for SSR)
  init: () => {
    if (typeof window !== 'undefined' && window.__ENV__) {
      Object.assign(browserEnv, window.__ENV__);
    }
    return browserEnv;
  }
};

// Initialize immediately
dotenvBrowser.init();

export default dotenvBrowser;
