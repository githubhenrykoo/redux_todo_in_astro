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
      try {
        normalizedHashFunction = HashAlgorithm(hashFunction.toLowerCase());
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
    const microseconds = String(Math.floor(performance.now() % 1 * 1000000)).padStart(6, '0');

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
    const hashFunctionStr = stringValue.split('|')[0].toLowerCase();
    
    try {
      return HashAlgorithm(hashFunctionStr);
    } catch (error) {
      throw new Error(`Invalid hash function: ${hashFunctionStr}`);
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
    if (hashFunction instanceof HashAlgorithm) {
      return true;
    }

    if (typeof hashFunction === 'string') {
      try {
        HashAlgorithm(hashFunction.toLowerCase());
        return true;
      } catch (error) {
        return false;
      }
    }

    return false;
  }

  /**
   * Check if the provided region code is valid
   * @param {string} regionCode - Region code to validate
   * @returns {boolean} Whether the region code is valid
   */
  static is_valid_region_code(regionCode) {
    return Boolean(regionCode && regionCode === regionCode.toUpperCase());
  }

  /**
   * Check if the provided timestamp is in ISO format
   * @param {string} timestamp - Timestamp to validate
   * @returns {boolean} Whether the timestamp is in ISO format
   */
  static is_iso_format(timestamp) {
    try {
      // Use Date.parse to validate ISO format
      const parsedDate = Date.parse(timestamp);
      return !isNaN(parsedDate);
    } catch (error) {
      return false;
    }
  }
}

export default GTime;
