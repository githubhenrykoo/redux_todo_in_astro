import { GTime } from '../content/model/g_time.js';
import { HashAlgorithm } from '../config/config_constants.js';

describe('GTime', () => {
  describe('stampNow', () => {
    test('should generate a timestamp with default hash function', () => {
      const timestamp = GTime.stampNow();
      
      // Validate timestamp format
      expect(timestamp).toMatch(/^[a-z0-9]+\|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z\|[A-Z]+$/);
      
      // Check default hash function
      const hashFunction = GTime.get_hash_function(timestamp);
      expect(hashFunction).toBe(HashAlgorithm.DEFAULT);
    });

    test('should generate a timestamp with specified hash function', () => {
      const hashFunctions = [
        HashAlgorithm.MD5,
        HashAlgorithm.SHA256,
        'md5',
        'sha256'
      ];

      hashFunctions.forEach(func => {
        const timestamp = GTime.stampNow(func);
        
        // Validate timestamp format
        expect(timestamp).toMatch(/^[a-z0-9]+\|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z\|[A-Z]+$/);
        
        // Check hash function
        const hashFunction = GTime.get_hash_function(timestamp);
        // Expect the hash function to match the input (after normalization)
        expect(hashFunction).toBe(HashAlgorithm(func.toString().toLowerCase()));
      });
    });

    test('should use default hash function for null or undefined', () => {
      const testCases = [null, undefined];

      testCases.forEach(func => {
        const timestamp = GTime.stampNow(func);
        expect(GTime.get_hash_function(timestamp)).toBe(HashAlgorithm.DEFAULT);
      });
    });
  });

  describe('get_hash_function', () => {
    test('should extract hash function from timestamp', () => {
      const testCases = [
        { input: 'md5|2023-01-01T12:00:00.000000Z|ASIA', expected: HashAlgorithm.MD5 },
        { input: 'sha256|2023-01-01T12:00:00.000000Z|EUROPE', expected: HashAlgorithm.SHA256 }
      ];

      testCases.forEach(({ input, expected }) => {
        const hashFunction = GTime.get_hash_function(input);
        expect(hashFunction).toBe(expected);
      });
    });

    test('should throw error for invalid hash function inputs', () => {
      const invalidInputs = [
        '',
        null,
        undefined,
        '|2023-01-01T12:00:00.000000Z|ASIA',
        'invalid|2023-01-01T12:00:00.000000Z|ASIA',
        'md5|2023-01-01T12:00:00.000000Z',
        'md5|2023-01-01T12:00:00.000000Z|',
        'MD5 |2023-01-01T12:00:00.000000Z|ASIA',
        'MD5|2023-01-01T12:00:00.000000Z| ASIA',
        'MD5|2023-01-01T12:00:00.000000Z|ASIA ',
        ' MD5|2023-01-01T12:00:00.000000Z|ASIA',
        'MD5 |2023-01-01T12:00:00.000000Z| ASIA',
        'MD5| 2023-01-01T12:00:00.000000Z|ASIA',
        'MD5|2023-01-01T12:00:00.000000Z |ASIA',
        'MD5|2023-01-01T12:00:00.000000Z|ASIA|',
        'MD5||2023-01-01T12:00:00.000000Z|ASIA',
        '|MD5|2023-01-01T12:00:00.000000Z|ASIA',
        'MD5|2023-01-01T12:00:00.000000Z||ASIA',
        'md5|2023-01-01T12:00:00.000000Z|asia',
        'md5|2023-01-01T12:00:00.000000Z|Asia',
        'md5|2023-01-01 12:00:00.000000Z|ASIA',
        'md5|2023-01-01T12:00:00Z|ASIA',
        'md5|2023-01-01T12:00:00.123Z|ASIA',
        'md5|2023-01-01T12:00:00.1234567Z|ASIA',
        'md5|2023-01-01T12:00:00.123456789Z|ASIA',
        'md5|2023-01-01T12:00:00.1234567890Z|ASIA',
        'md5||2023-01-01T12:00:00.000000Z|ASIA',
        'md5|2023-01-01T12:00:00.000000Z||ASIA',
        'md5|2023-01-01T12:00:00.000000Z|ASIA|extra',
        '|md5|2023-01-01T12:00:00.000000Z|ASIA',
        'md5|2023-01-01T12:00:00.000000Z|ASIA|',
        'md5|2023-01-01T12:00:00.000000Z|ASIA|extra|extra',
        'md5|2023-01-01T12:00:00.000000Z|ASIA extra',
        'md5|2023-01-01T12:00:00.000000Z| extra ASIA',
        'md5|2023-01-01T12:00:00.000000Z|ASIA extra',
        'md5|2023-01-01T12:00:00.000000Z|extra ASIA',
        'md5|2023-01-01T12:00:00.000000Z|ASIA extra|',
        'md5|2023-01-01T12:00:00.000000Z| extra ASIA|',
        'md5|2023-01-01T12:00:00.000000Z|ASIA extra|',
        'md5|2023-01-01T12:00:00.000000Z|extra ASIA|',
        'md5|2023-01-01T12:00:00.000000Z|ASIA extra|extra',
        'md5|2023-01-01T12:00:00.000000Z| extra ASIA|extra',
        'md5|2023-01-01T12:00:00.000000Z|ASIA extra|extra',
        'md5|2023-01-01T12:00:00.000000Z|extra ASIA|extra',
        'md5|2023-01-01T12:00:00.000000Z|ASIA extra|extra|extra',
        'md5|2023-01-01T12:00:00.000000Z| extra ASIA|extra|extra',
        'md5|2023-01-01T12:00:00.000000Z|ASIA extra|extra|extra',
        'md5|2023-01-01T12:00:00.000000Z|extra ASIA|extra|extra'
      ];

      invalidInputs.forEach(input => {
        expect(() => GTime.get_hash_function(input)).toThrow('Invalid hash function');
      });
    });
  });

  describe('get_timestamp', () => {
    test('should extract timestamp from formatted string', () => {
      const input = 'md5|2023-01-01T12:00:00.123456Z|ASIA';
      const timestamp = GTime.get_timestamp(input);
      expect(timestamp).toBe('2023-01-01T12:00:00.123456Z');
    });
  });

  describe('get_region_code', () => {
    test('should extract region code from formatted string', () => {
      const input = 'md5|2023-01-01T12:00:00.123456Z|ASIA';
      const regionCode = GTime.get_region_code(input);
      expect(regionCode).toBe('ASIA');
    });
  });

  describe('is_valid_hash_function', () => {
    test('should validate hash functions', () => {
      const validFunctions = [
        HashAlgorithm.MD5,
        HashAlgorithm.SHA256,
        'md5',
        'sha256'
      ];

      const invalidFunctions = [
        'invalid_hash',
        123,
        '',
        ' ',
        null,
        undefined,
        'md5 ',
        'SHA-256',
        'SHA256',
        'Md5',
        'MD5',
        'sha1',
        'MD5 ',
        'md 5',
        'md5 hash',
        {},
        [],
        true,
        false,
        'MD5 ',
        ' md5',
        'md5 '
      ];

      validFunctions.forEach(func => {
        expect(GTime.is_valid_hash_function(func)).toBe(true, `Expected ${func} to be valid`);
      });

      invalidFunctions.forEach(func => {
        expect(GTime.is_valid_hash_function(func)).toBe(false, `Expected ${func} to be invalid`);
      });
    });
  });

  describe('is_valid_region_code', () => {
    test('should validate region codes', () => {
      const validCodes = [
        'ASIA',
        'EUROPE',
        'NORTH_AMERICA'
      ];

      const invalidCodes = [
        'asia',
        'Europe',
        '',
        ' ',
        123,
        null,
        undefined
      ];

      validCodes.forEach(code => {
        expect(GTime.is_valid_region_code(code)).toBe(true);
      });

      invalidCodes.forEach(code => {
        expect(GTime.is_valid_region_code(code)).toBe(false);
      });
    });
  });

  describe('is_iso_format', () => {
    test('should validate ISO format timestamps', () => {
      const validTimestamps = [
        '2023-01-01T12:00:00.123456Z',
        '2023-12-31T23:59:59.999999Z'
      ];

      const invalidTimestamps = [
        '2023/01/01 12:00:00',
        '01-01-2023T12:00:00Z',
        'invalid_timestamp',
        '2023-01-01T12:00:00Z', // Missing milliseconds
        '2023-01-01T12:00:00.123Z', // Incorrect decimal places
        '2023-01-01T12:00:00.1234567Z' // Too many decimal places
      ];

      validTimestamps.forEach(timestamp => {
        expect(GTime.is_iso_format(timestamp)).toBe(true);
      });

      invalidTimestamps.forEach(timestamp => {
        expect(GTime.is_iso_format(timestamp)).toBe(false);
      });
    });

    test('should handle null and undefined', () => {
      expect(GTime.is_iso_format(null)).toBe(false);
      expect(GTime.is_iso_format(undefined)).toBe(false);
    });
  });

  describe('stamp_now (alias)', () => {
    test('should be an alias for stampNow', () => {
      // We can't compare exact timestamps due to microsecond differences
      const stampNowResult = GTime.stampNow();
      const stampNowAliasResult = GTime.stamp_now();
      
      expect(stampNowResult.split('|')[0]).toBe(stampNowAliasResult.split('|')[0]);
      expect(stampNowResult.split('|')[2]).toBe(stampNowAliasResult.split('|')[2]);
    });
  });
});
