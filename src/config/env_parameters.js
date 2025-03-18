import dotenv from 'dotenv';
import path from 'path';
import {
  DEFAULT_HASH_LENGTH,
  DEFAULT_LOG_LEVEL
} from './config_constants.js';

class EnvParameters {
  static #instance = null;

  constructor() {
    // Load environment variables
    dotenv.config();

    // Set values from environment or use defaults from config_constants
    this.MCARD_DB_PATH = process.env.MCARD_DB_PATH;
    this.MCARD_HASH_ALGORITHM = process.env.MCARD_HASH_ALGORITHM;
    this.MCARD_HASH_CUSTOM_MODULE = process.env.MCARD_HASH_CUSTOM_MODULE;
    this.MCARD_HASH_CUSTOM_FUNCTION = process.env.MCARD_HASH_CUSTOM_FUNCTION;
    this.MCARD_HASH_LENGTH = parseInt(process.env.MCARD_HASH_LENGTH || DEFAULT_HASH_LENGTH, 10);
    this.MCARD_LOG_LEVEL = process.env.MCARD_LOG_LEVEL || DEFAULT_LOG_LEVEL;
  }

  static getInstance() {
    if (!EnvParameters.#instance) {
      EnvParameters.#instance = new EnvParameters();
    }
    return EnvParameters.#instance;
  }

  static reset() {
    EnvParameters.#instance = null;
  }

  getLogLevel() {
    return this.MCARD_LOG_LEVEL;
  }

  get_log_level() {
    return this.getLogLevel();
  }

  // Getter methods matching Python implementation
  get_db_path() {
    return this.MCARD_DB_PATH;
  }

  get_hash_algorithm() {
    return this.MCARD_HASH_ALGORITHM;
  }

  get_hash_custom_module() {
    return this.MCARD_HASH_CUSTOM_MODULE;
  }

  get_hash_custom_function() {
    return this.MCARD_HASH_CUSTOM_FUNCTION;
  }

  get_hash_custom_length() {
    return this.MCARD_HASH_LENGTH;
  }

  get_default_db_path() {
    return path.resolve(process.cwd(), this.MCARD_DB_PATH);
  }
}

export { EnvParameters as default, EnvParameters };
