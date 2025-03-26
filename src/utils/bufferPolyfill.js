/**
 * Cross-environment Buffer compatibility layer
 * 
 * This module provides a Buffer implementation that works in both
 * Node.js and browser environments, preventing hydration errors.
 */

import { encodeText } from './textEncoderPolyfill.js';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * SafeBuffer - A cross-environment Buffer-like implementation
 * 
 * Uses Node.js Buffer when available, or a Uint8Array-based implementation in browsers.
 */
class SafeBuffer {
  /**
   * Create a new Buffer from string, array, or ArrayBuffer
   * @param {string|Array|ArrayBuffer|Uint8Array} data - Input data
   * @param {string} [encoding='utf8'] - Encoding to use if data is a string
   * @returns {Uint8Array} - Buffer-like Uint8Array
   */
  static from(data, encoding = 'utf8') {
    // If in Node.js environment, use native Buffer
    if (!isBrowser && typeof Buffer !== 'undefined') {
      return Buffer.from(data, encoding);
    }
    
    // Browser environment implementation
    if (typeof data === 'string') {
      return encodeText(data);
    } else if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
      return data instanceof Uint8Array ? data : new Uint8Array(data);
    } else if (Array.isArray(data)) {
      return new Uint8Array(data);
    } else if (data === null || data === undefined) {
      return new Uint8Array();
    } else if (typeof data === 'object') {
      // Try to convert object to JSON string
      try {
        return encodeText(JSON.stringify(data));
      } catch (e) {
        console.error('Error converting object to Buffer:', e);
        return new Uint8Array();
      }
    }
    
    // Fallback for unexpected inputs
    return new Uint8Array();
  }
  
  /**
   * Create a new Buffer of specified size
   * @param {number} size - Size of the buffer to allocate
   * @param {number} [fill=0] - Value to fill the buffer with
   * @returns {Uint8Array} - Buffer-like Uint8Array
   */
  static alloc(size, fill = 0) {
    // If in Node.js environment, use native Buffer
    if (!isBrowser && typeof Buffer !== 'undefined') {
      return Buffer.alloc(size, fill);
    }
    
    // Browser implementation
    const buffer = new Uint8Array(size);
    if (fill !== 0) {
      buffer.fill(fill);
    }
    return buffer;
  }
  
  /**
   * Combine multiple buffers into one
   * @param {Array<Uint8Array>} buffers - Array of buffers to combine
   * @returns {Uint8Array} - Combined buffer
   */
  static concat(buffers) {
    // If in Node.js environment, use native Buffer
    if (!isBrowser && typeof Buffer !== 'undefined') {
      return Buffer.concat(buffers);
    }
    
    // Browser implementation
    // Calculate total length
    const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
    
    // Create new buffer with total length
    const result = new Uint8Array(totalLength);
    
    // Copy each buffer into the result buffer
    let offset = 0;
    for (const buf of buffers) {
      result.set(buf, offset);
      offset += buf.length;
    }
    
    return result;
  }
  
  /**
   * Check if object is a Buffer
   * @param {any} obj - Object to check
   * @returns {boolean} - True if obj is a Buffer or Uint8Array
   */
  static isBuffer(obj) {
    // If in Node.js environment, use native Buffer.isBuffer
    if (!isBrowser && typeof Buffer !== 'undefined') {
      return Buffer.isBuffer(obj);
    }
    
    // In browser, check if it's a Uint8Array
    return obj instanceof Uint8Array;
  }
  
  /**
   * Convert buffer to string
   * @param {Uint8Array} buffer - Buffer to convert
   * @param {string} [encoding='utf8'] - Encoding to use
   * @returns {string} - String representation of buffer
   */
  static toString(buffer, encoding = 'utf8') {
    // If in Node.js environment, use native Buffer
    if (!isBrowser && typeof Buffer !== 'undefined' && Buffer.isBuffer(buffer)) {
      return buffer.toString(encoding);
    }
    
    // Browser implementation
    // For now, only support UTF-8 encoding
    if (!(buffer instanceof Uint8Array)) {
      return '';
    }
    
    // Use TextDecoder if available
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8').decode(buffer);
    }
    
    // Fallback implementation
    let result = '';
    for (let i = 0; i < buffer.length; i++) {
      result += String.fromCharCode(buffer[i]);
    }
    return result;
  }
}

// Export SafeBuffer as default and named export
export default SafeBuffer;
export { SafeBuffer };
