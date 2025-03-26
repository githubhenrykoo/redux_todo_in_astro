import { HashAlgorithm as HashAlgorithmEnum } from './hash/enums.js';
import HashValidator from './hash/validator.js';
import { GTime as GTimeUtil } from './g_time.js';
import { HASH_ALGORITHM_HIERARCHY as ALGORITHM_HIERARCHY } from '../../config/config_constants.js';

// Destructure the enum values
const { 
  MD5, 
  SHA1, 
  SHA224, 
  SHA256, 
  SHA384, 
  SHA512, 
  DEFAULT
} = HashAlgorithmEnum;

// Event type constants
const TYPE = 'type';
const HASH = 'hash';
const CONTENT_TYPE = 'content_type';
const TIMESTAMP = 'timestamp';
const EXISTING_CARD_HASH = 'existing_card_hash';
const NEW_CARD_HASH = 'new_card_hash';
const FIRST_G_TIME = 'first_g_time';
const CONTENT_SIZE = 'content_size';
const COLLISION_TIME = 'collision_time';
const UPGRADED_FUNCTION = 'upgraded_function';
const UPGRADED_HASH = 'upgraded_hash';
const DUPLICATE_TIME = 'duplicate_time';
const DUPLICATE_EVENT_TYPE = 'duplicate';
const COLLISION_EVENT_TYPE = 'collision';

// Predefined hash function progression order
const HASH_FUNCTION_ORDER = ['md5', 'sha1', 'sha224', 'sha256', 'sha384', 'sha512'];

// Create a new HashValidator instance for use
const hashValidator = new HashValidator(Buffer.from(''), 'sha256');

// Explicitly define HASH_ALGORITHM_HIERARCHY
const HASH_ALGORITHM_HIERARCHY = {
  [MD5]: [SHA1],
  [SHA1]: [SHA224],
  [SHA224]: [SHA256],
  [SHA256]: [SHA384],
  [SHA384]: [SHA512],
  [SHA512]: []
};

// Replace existing nextHashFunction with method from instance
function nextHashFunction(currentHashFunction) {
  const algMap = {
    'md5': MD5,
    'sha1': SHA1,
    'sha224': SHA224, 
    'sha256': SHA256,
    'sha384': SHA384,
    'sha512': SHA512
  };
  
  const currFunc = algMap[currentHashFunction] || currentHashFunction;
  
  const hashFunctions = Object.values(HashAlgorithmEnum).filter(
    func => func !== currFunc && typeof func === 'string' 
  );
  
  const strongerFunctions = hashFunctions.filter(func => {
    const currentStrongerFuncs = HASH_ALGORITHM_HIERARCHY[currFunc] || [];
    return currentStrongerFuncs.includes(func);
  });
  
  return strongerFunctions.length > 0 
    ? strongerFunctions[0] 
    : currFunc; 
}

// Generate a duplication event for the given card
// @param {Object} card - The card being duplicated
// @returns {string} JSON-stringified duplication event
function generateDuplicationEvent(card) {
  const event = {
    [TYPE]: DUPLICATE_EVENT_TYPE,
    [HASH]: card.hash,
    [CONTENT_TYPE]: card.contentType,
    [TIMESTAMP]: GTimeUtil.stampNow(card.hashFunction || HashAlgorithmEnum.DEFAULT),
    [DUPLICATE_TIME]: card.g_time
  };
  return JSON.stringify(event);
}

// Generate a collision event for the given event data
// @param {Object} newCard - The new card
// @param {Object} existingCard - The existing card
// @returns {string} JSON-stringified collision event
function generateCollisionEvent(newCard, existingCard = null) {
  const event = {
    type: 'collision',
    original_hash: existingCard ? existingCard.hash : null,
    new_hash: newCard.hash,
    timestamp: GTimeUtil.stampNow(
      newCard.hashFunction || 
      existingCard?.hashFunction || 
      HashAlgorithmEnum.DEFAULT
    ),
    content_size: typeof newCard.content === 'string' ? 
      Buffer.from(newCard.content).length : 
      newCard.content.length
  };

  if (existingCard) {
    const upgradedFunction = nextHashFunction(existingCard.hashFunction);
    event.upgraded_function = upgradedFunction;
    event.upgraded_hash = existingCard.hash;  
    event.hash_algorithm = upgradedFunction;  
  }

  return JSON.stringify(event);
}

export {
  MD5,
  SHA1,
  SHA224,
  SHA256,
  SHA384,
  SHA512,
  TYPE,
  HASH,
  CONTENT_TYPE,
  TIMESTAMP,
  EXISTING_CARD_HASH,
  NEW_CARD_HASH,
  FIRST_G_TIME,
  CONTENT_SIZE,
  COLLISION_TIME,
  UPGRADED_FUNCTION,
  UPGRADED_HASH,
  DUPLICATE_TIME,
  DUPLICATE_EVENT_TYPE,
  COLLISION_EVENT_TYPE,
  HASH_FUNCTION_ORDER,
  HASH_ALGORITHM_HIERARCHY,
  nextHashFunction,
  generateDuplicationEvent,
  generateCollisionEvent
};
