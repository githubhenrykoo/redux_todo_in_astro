/**
 * Simple logging service with configurable log levels
 */
class Logger {
  /**
   * Create a new logger instance
   * @param {string} [level='info'] - Logging level
   */
  constructor(level = 'info') {
    this.level = level.toLowerCase();
    this.levels = ['error', 'warn', 'info', 'debug'];
  }

  /**
   * Check if a log level is enabled
   * @param {string} level - Log level to check
   * @returns {boolean} Whether the log level is enabled
   */
  isLevelEnabled(level) {
    const currentLevelIndex = this.levels.indexOf(this.level);
    const checkLevelIndex = this.levels.indexOf(level);
    return checkLevelIndex <= currentLevelIndex;
  }

  /**
   * Log an error message
   * @param {string} message - Message to log
   * @param {Object} [metadata] - Optional metadata
   */
  error(message, metadata = {}) {
    if (this.isLevelEnabled('error')) {
      console.error(`[ERROR] ${message}`, metadata);
    }
  }

  /**
   * Log a warning message
   * @param {string} message - Message to log
   * @param {Object} [metadata] - Optional metadata
   */
  warn(message, metadata = {}) {
    if (this.isLevelEnabled('warn')) {
      console.warn(`[WARN] ${message}`, metadata);
    }
  }

  /**
   * Log an info message
   * @param {string} message - Message to log
   * @param {Object} [metadata] - Optional metadata
   */
  info(message, metadata = {}) {
    if (this.isLevelEnabled('info')) {
      console.log(`[INFO] ${message}`, metadata);
    }
  }

  /**
   * Log a debug message
   * @param {string} message - Message to log
   * @param {Object} [metadata] - Optional metadata
   */
  debug(message, metadata = {}) {
    if (this.isLevelEnabled('debug')) {
      console.debug(`[DEBUG] ${message}`, metadata);
    }
  }
}

// Create a default logger instance using environment variable
const logger = new Logger(process.env.LOG_LEVEL || 'info');

export default logger;
export { Logger };
