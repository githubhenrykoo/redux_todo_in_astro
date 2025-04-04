/**
 * Environment detection utility for cross-environment compatibility
 */

// Check if running in a browser environment
export const isBrowser = typeof window !== 'undefined';

// Check if running in a Node.js environment
export const isNode = typeof process !== 'undefined' && 
                     process.versions != null && 
                     process.versions.node != null;

// Check for service worker environment
export const isServiceWorker = typeof self === 'object' && 
                              self.constructor && 
                              self.constructor.name === 'ServiceWorkerGlobalScope';

/**
 * Get a safe reference to global scope that works across environments
 * @returns The global scope object (window, global, self)
 */
export const getGlobalScope = () => {
  if (typeof window !== 'undefined') return window;
  if (typeof global !== 'undefined') return global;
  if (typeof self !== 'undefined') return self;
  return {};
};

/**
 * Safely access a property on the global scope
 * @param {string} propertyName - The name of the property to access
 * @returns The property value or undefined if not available
 */
export const getGlobalProperty = (propertyName) => {
  const globalScope = getGlobalScope();
  return globalScope[propertyName];
};

/**
 * Safely set a property on the global scope
 * @param {string} propertyName - The name of the property to set
 * @param {any} value - The value to set
 */
export const setGlobalProperty = (propertyName, value) => {
  const globalScope = getGlobalScope();
  globalScope[propertyName] = value;
};

/**
 * Get an environment-appropriate text encoder
 * @returns A TextEncoder instance or polyfill
 */
export const getTextEncoder = () => {
  // Browser environment
  if (typeof window !== 'undefined' && window.TextEncoder) {
    return new window.TextEncoder();
  }
  
  // Node.js environment
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder();
  }
  
  // Fallback implementation
  return {
    encode: (str) => {
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
          // Handle surrogate pairs
          i++;
          charCode = 0x10000 + (((charCode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
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
