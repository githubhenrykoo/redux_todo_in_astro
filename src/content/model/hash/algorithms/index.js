import BaseHashAlgorithm from './base_algorithm.js';
import { HashAlgorithm } from '../../../config/config_constants.js';

// Create specific hash algorithm classes
class MD5Algorithm extends BaseHashAlgorithm {
  constructor() {
    super(HashAlgorithm.MD5);
  }
}

class SHA1Algorithm extends BaseHashAlgorithm {
  constructor() {
    super(HashAlgorithm.SHA1);
  }
}

class SHA224Algorithm extends BaseHashAlgorithm {
  constructor() {
    super(HashAlgorithm.SHA224);
  }
}

class SHA256Algorithm extends BaseHashAlgorithm {
  constructor() {
    super(HashAlgorithm.SHA256);
  }
}

class SHA384Algorithm extends BaseHashAlgorithm {
  constructor() {
    super(HashAlgorithm.SHA384);
  }
}

class SHA512Algorithm extends BaseHashAlgorithm {
  constructor() {
    super(HashAlgorithm.SHA512);
  }
}

export {
  BaseHashAlgorithm,
  MD5Algorithm,
  SHA1Algorithm,
  SHA224Algorithm,
  SHA256Algorithm,
  SHA384Algorithm,
  SHA512Algorithm
};
