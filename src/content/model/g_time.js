import { HashAlgorithm } from '../../config/config_constants.js';

export class GTime {
  /**
   * Get current timestamp in ISO format with hash function and region code
   * @param {string|HashAlgorithm} hashFunction - Hash function to use
   * @returns {string} Formatted timestamp string
   */
  static stampNow(hashFunction) {
    // Use default hash algorithm if no function is provided
    if (hashFunction === null || hashFunction === undefined) {
      hashFunction = HashAlgorithm.DEFAULT;
    }

    // Convert string to HashAlgorithm if needed
    let normalizedHashFunction = hashFunction;
    if (typeof hashFunction === 'string') {
      const trimmedFunc = hashFunction.toLowerCase().trim();
      if (!Object.values(HashAlgorithm).filter(func => typeof func === 'string').map(func => func.toLowerCase()).includes(trimmedFunc)) {
        throw new Error(`Invalid hash function: ${hashFunction}`);
      }
      try {
        normalizedHashFunction = HashAlgorithm[trimmedFunc.toUpperCase()];
      } catch (error) {
        throw new Error(`Invalid hash function: ${hashFunction}`);
      }
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // Ensure 6 decimal places for microseconds
    const microseconds = String(Math.floor(performance.now() % 1 * 1000000)).padStart(6, '0').slice(0, 6);

    const timestamp = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${microseconds}Z`;
    const regionCode = Intl.DateTimeFormat().resolvedOptions().timeZone.split('/')[0].toUpperCase();

    return `${normalizedHashFunction}|${timestamp}|${regionCode}`;
  }

  /**
   * Alias for stampNow to maintain backwards compatibility
   * @param {string|HashAlgorithm} hashFunction - Hash function to use
   * @returns {string} Formatted timestamp string
   */
  static stamp_now(hashFunction) {
    return this.stampNow(hashFunction);
  }

  /**
   * Get the hash function from the formatted string
   * @param {string} stringValue - Formatted timestamp string
   * @returns {string} Hash function
   */
  static get_hash_function(stringValue) {
    // Validate input is a non-empty string
    if (!stringValue || typeof stringValue !== 'string' || stringValue.trim() === '') {
      throw new Error('Invalid hash function: Empty or non-string input');
    }

    // Validate exact number of parts
    const parts = stringValue.split('|');
    if (parts.length !== 3) {
      throw new Error('Invalid hash function: Incorrect number of components');
    }

    // Validate each part is non-empty and has no extra whitespace
    const [hashFunctionStr, timestamp, regionCode] = parts;
    if (!hashFunctionStr || !timestamp || !regionCode) {
      throw new Error('Invalid hash function: Missing components');
    }

    // Validate hash function format (must be exactly lowercase, no extra whitespace)
    const trimmedHashFunc = hashFunctionStr.trim();
    const validLowercaseHashes = Object.values(HashAlgorithm).filter(func => typeof func === 'string').map(func => func.toLowerCase());
    
    if (!validLowercaseHashes.includes(trimmedHashFunc) || 
        trimmedHashFunc !== hashFunctionStr) {
      throw new Error(`Invalid hash function: ${hashFunctionStr}`);
    }

    // Validate timestamp format (strict ISO 8601 with exactly 6 decimal places)
    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;
    const trimmedTimestamp = timestamp.trim();
    
    if (!timestampRegex.test(trimmedTimestamp) || 
        trimmedTimestamp !== timestamp) {
      throw new Error('Invalid hash function: Incorrect timestamp format');
    }

    // Validate region code format (must be all uppercase letters, no extra whitespace)
    const trimmedRegionCode = regionCode.trim();
    if (!/^[A-Z]+$/.test(trimmedRegionCode) || 
        trimmedRegionCode !== regionCode) {
      throw new Error('Invalid hash function: Incorrect region code format');
    }

    try {
      return HashAlgorithm[trimmedHashFunc.toUpperCase()];
    } catch (error) {
      throw new Error(`Invalid hash function: ${trimmedHashFunc}`);
    }
  }

  /**
   * Get the timestamp from the formatted string
   * @param {string} stringValue - Formatted timestamp string
   * @returns {string} Timestamp in ISO format
   */
  static get_timestamp(stringValue) {
    return stringValue.split('|')[1];
  }

  /**
   * Get the region code from the formatted string
   * @param {string} stringValue - Formatted timestamp string
   * @returns {string} Region code
   */
  static get_region_code(stringValue) {
    return stringValue.split('|')[2];
  }

  /**
   * Check if the provided hash function is valid
   * @param {string|HashAlgorithm} hashFunction - Hash function to validate
   * @returns {boolean} Whether the hash function is valid
   */
  static is_valid_hash_function(hashFunction) {
    // Strict validation for null or undefined
    if (hashFunction === null || hashFunction === undefined) {
      return false;
    }

    // Reject any non-string, non-object inputs
    if (typeof hashFunction !== 'string' && 
        typeof hashFunction !== 'object' && 
        typeof hashFunction !== 'boolean') {
      return false;
    }

    // Reject non-string objects
    if (typeof hashFunction === 'object' && 
        !(hashFunction instanceof String)) {
      return false;
    }

    // Reject empty strings or whitespace
    if (typeof hashFunction === 'string' && 
        (hashFunction.trim() === '' || hashFunction !== hashFunction.trim())) {
      return false;
    }

    // For string inputs, be extremely strict
    if (typeof hashFunction === 'string' || hashFunction instanceof String) {
      // Convert to string 
      const strFunc = String(hashFunction);
      
      // All valid hash functions, lowercase
      const validLowercaseHashes = Object.values(HashAlgorithm).filter(func => typeof func === 'string').map(func => func.toLowerCase());
      
      // Reject any input that doesn't match exactly
      const isValid = validLowercaseHashes.includes(strFunc) && 
                      strFunc === strFunc.toLowerCase() && 
                      strFunc.trim() === strFunc;

      // Extra checks to reject inputs like 'md 5', 'md5 hash', 'SHA-256', 'MD5', etc.
      if (!isValid || strFunc.includes(' ')) {
        return false;
      }

      return true;
    }
    
    // If we reach here, it means the input is a valid HashAlgorithm value
    return Object.values(HashAlgorithm).includes(hashFunction);
  }

  /**
   * Check if the provided region code is valid
   * @param {string} regionCode - Region code to validate
   * @returns {boolean} Whether the region code is valid
   */
  static is_valid_region_code(regionCode) {
    if (regionCode === null || regionCode === undefined) {
      return false;
    }

    return typeof regionCode === 'string' && 
           regionCode.trim().length > 0 && 
           regionCode.trim() === regionCode.trim().toUpperCase() &&
           regionCode.trim() === regionCode; // No extra whitespace
  }

  /**
   * Check if the provided timestamp is in ISO format
   * @param {string} timestamp - Timestamp to validate
   * @returns {boolean} Whether the timestamp is in ISO format
   */
  static is_iso_format(timestamp) {
    if (timestamp === null || timestamp === undefined) {
      return false;
    }

    try {
      // Use Date.parse to validate ISO format
      const parsedDate = Date.parse(timestamp);
      const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;
      
      return !isNaN(parsedDate) && 
             timestampRegex.test(timestamp);
    } catch (error) {
      return false;
    }
  }
}

export default GTime;
