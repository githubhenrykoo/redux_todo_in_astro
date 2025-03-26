/**
 * Cross-environment TextEncoder compatibility layer
 * 
 * This module provides a TextEncoder implementation that works in both
 * Node.js and browser environments, avoiding hydration errors.
 */

// Detect the environment
const isBrowser = typeof window !== 'undefined';

// Get the appropriate TextEncoder instance based on environment
const getTextEncoder = () => {
  // Browser environment - use built-in TextEncoder if available
  if (isBrowser && typeof window.TextEncoder !== 'undefined') {
    return new window.TextEncoder();
  }
  
  // Global TextEncoder (modern browsers and some Node.js environments)
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder();
  }
  
  // Node.js environment - use util.TextEncoder but only if we're not in a browser
  if (!isBrowser && typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      // Use dynamic import technique to avoid browser parsing issues
      const dynamicRequire = new Function('module', 'return require(module)');
      const util = dynamicRequire('util');
      if (util && util.TextEncoder) {
        return new util.TextEncoder();
      }
    } catch (e) {
      // Fall through to the polyfill
    }
  }
  
  // Fallback implementation for environments without TextEncoder
  return {
    encode: (str) => {
      if (!str) return new Uint8Array();
      
      const utf8 = [];
      for (let i = 0; i < str.length; i++) {
        let charCode = str.charCodeAt(i);
        if (charCode < 0x80) {
          utf8.push(charCode);
        } else if (charCode < 0x800) {
          utf8.push(0xc0 | (charCode >> 6), 
                    0x80 | (charCode & 0x3f));
        } else if (charCode < 0xd800 || charCode >= 0xe000) {
          utf8.push(0xe0 | (charCode >> 12), 
                    0x80 | ((charCode >> 6) & 0x3f), 
                    0x80 | (charCode & 0x3f));
        } else {
          // Handle surrogate pair
          i++;
          charCode = ((charCode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff);
          charCode += 0x10000;
          utf8.push(0xf0 | (charCode >> 18), 
                    0x80 | ((charCode >> 12) & 0x3f), 
                    0x80 | ((charCode >> 6) & 0x3f), 
                    0x80 | (charCode & 0x3f));
        }
      }
      return new Uint8Array(utf8);
    }
  };
};

// Create a singleton instance
const textEncoder = getTextEncoder();

// Export the encode function as the main API
export const encodeText = (text) => {
  if (text === null || text === undefined) {
    return new Uint8Array();
  }
  
  // Convert non-string inputs to strings
  const inputString = typeof text === 'string' ? text : String(text);
  return textEncoder.encode(inputString);
};

// Export the encoder instance itself
export { textEncoder };

// Default export is the encode function
export default encodeText;
