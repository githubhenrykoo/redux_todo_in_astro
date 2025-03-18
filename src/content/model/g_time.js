import { HashAlgorithm } from '../../config/config_constants.js';

const VALID_HASH_FUNCTIONS = Object.values(HashAlgorithm)
  .filter(func => typeof func === 'string')
  .map(func => func.toLowerCase());

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
      if (!['md5', 'sha256'].includes(trimmedFunc)) {
        throw new Error(`Invalid hash function: ${hashFunction}`);
      }
      try {
        normalizedHashFunction = HashAlgorithm(trimmedFunc);
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
      throw new Error('Invalid hash function input');
    }

    // Validate the entire string format using a strict regex
    // Format must be exactly: [md5|sha256]|YYYY-MM-DDThh:mm:ss.uuuuuuZ|[A-Z]+
    const fullFormatRegex = /^(md5|sha256)\|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z\|[A-Z]+$/i;
    if (!fullFormatRegex.test(stringValue)) {
      throw new Error('Invalid hash function: Incorrect format');
    }

    // Validate exact number of parts
    const parts = stringValue.split('|');
    if (parts.length !== 3) {
      throw new Error('Invalid hash function: Incorrect timestamp format');
    }

    // Validate each part is non-empty
    const [hashFunctionStr, timestamp, regionCode] = parts;
    if (!hashFunctionStr || !timestamp || !regionCode) {
      throw new Error('Invalid hash function: Missing components');
    }

    // Validate hash function format (must be md5 or sha256, case insensitive)
    const trimmedHashFunc = hashFunctionStr.trim();
    if (!/^(md5|sha256)$/i.test(trimmedHashFunc)) {
      throw new Error(`Invalid hash function: ${hashFunctionStr}`);
    }

    // Validate timestamp format (strict ISO 8601 with 6 decimal places)
    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;
    if (!timestampRegex.test(timestamp.trim()) || timestamp.trim() !== timestamp) {
      throw new Error('Invalid hash function: Incorrect timestamp format');
    }

    // Validate region code format (must be all uppercase letters, no spaces)
    const trimmedRegionCode = regionCode.trim();
    if (!/^[A-Z]+$/.test(trimmedRegionCode) || trimmedRegionCode !== regionCode) {
      throw new Error('Invalid hash function: Incorrect region code format');
    }

    try {
      return HashAlgorithm(trimmedHashFunc.toLowerCase());
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

    // For string inputs, be extremely strict
    if (typeof hashFunction === 'string') {
      // Only accept exact matches for 'md5' or 'sha256' (lowercase only)
      const trimmedFunc = hashFunction.trim();
      
      // Check for exact match with 'md5' or 'sha256' (lowercase only)
      // No upper case, no extra whitespace, no extra characters
      return (trimmedFunc === 'md5' || trimmedFunc === 'sha256') && 
             trimmedFunc === hashFunction;
    }
    
    // For values that equal HashAlgorithm values (as strings), they are valid 
    // but only if they match exactly md5 or sha256
    if (hashFunction === HashAlgorithm.MD5 || hashFunction === HashAlgorithm.SHA256) {
      return true;
    }

    // Reject any other type of input
    return false;
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
