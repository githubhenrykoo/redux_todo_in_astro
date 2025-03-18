import { Buffer } from 'buffer';
import { MCard, MCardFromData } from '../content/model/mcard.js';
import { HashAlgorithm } from '../config/config_constants.js';
import GTime from '../content/model/g_time.js';

describe('MCard', () => {
  describe('Constructor', () => {
    test('should create MCard with string content', () => {
      const content = 'Hello, World!';
      const mcard = new MCard(content);
      
      expect(mcard.content).toBeInstanceOf(Buffer);
      expect(mcard.content.toString('utf-8')).toBe(content);
      expect(mcard.hash).toBeTruthy();
      expect(mcard.g_time).toBeTruthy();
    });

    test('should create MCard with object content', () => {
      const content = { key: 'value' };
      const mcard = new MCard(content);
      
      expect(mcard.content).toBeInstanceOf(Buffer);
      expect(mcard.content.toString('utf-8')).toBe(JSON.stringify(content));
      expect(mcard.hash).toBeTruthy();
      expect(mcard.g_time).toBeTruthy();
    });

    test('should create MCard with Buffer content', () => {
      const content = Buffer.from('Binary content');
      const mcard = new MCard(content);
      
      expect(mcard.content).toBeInstanceOf(Buffer);
      expect(mcard.content.toString('utf-8')).toBe('Binary content');
      expect(mcard.hash).toBeTruthy();
      expect(mcard.g_time).toBeTruthy();
    });

    test('should throw error for null content', () => {
      expect(() => new MCard(null)).toThrow('Content cannot be None');
    });

    test('should use specified hash function', () => {
      const content = 'Test content';
      const mcard = new MCard(content, HashAlgorithm.SHA256);
      
      expect(mcard.hash_algorithm).toBe(HashAlgorithm.SHA256);
    });
  });

  describe('Utility Methods', () => {
    test('equals should compare cards correctly', () => {
      const content1 = 'Content 1';
      const content2 = 'Content 1';
      const content3 = 'Different Content';

      const mcard1 = new MCard(content1);
      const mcard2 = new MCard(content2);
      const mcard3 = new MCard(content3);

      expect(mcard1.equals(mcard2)).toBe(true);
      expect(mcard1.equals(mcard3)).toBe(false);
    });

    test('to_dict should return correct dictionary', () => {
      const content = 'Test content';
      const mcard = new MCard(content);
      const dict = mcard.to_dict();

      expect(dict.content).toBeInstanceOf(Buffer);
      expect(dict.hash).toBeTruthy();
      expect(dict.g_time).toBeTruthy();
    });
  });
});

describe('MCardFromData', () => {
  describe('Constructor', () => {
    test('should create MCardFromData with valid inputs', () => {
      const content = Buffer.from('Existing content');
      const hashValue = 'test-hash-value';
      const gTimeStr = 'md5|2023-01-01T12:00:00.000000Z|REGION';

      const mcard = new MCardFromData(content, hashValue, gTimeStr);
      
      expect(mcard.content).toBeInstanceOf(Buffer);
      expect(mcard.content.toString('utf-8')).toBe('Existing content');
      expect(mcard.hash).toBe(hashValue);
      expect(mcard.g_time).toBe(gTimeStr);
    });

    test('should throw error for non-Buffer content', () => {
      const content = 'Not a buffer';
      const hashValue = 'test-hash-value';
      const gTimeStr = 'md5|2023-01-01T12:00:00.000000Z|REGION';

      expect(() => new MCardFromData(content, hashValue, gTimeStr))
        .toThrow("Content must be a Buffer when initializing from existing data.");
    });

    test('should throw error for missing hash value', () => {
      const content = Buffer.from('Content');
      const gTimeStr = 'md5|2023-01-01T12:00:00.000000Z|REGION';

      expect(() => new MCardFromData(content, null, gTimeStr))
        .toThrow("Hash value cannot be None or empty");
    });

    test('should throw error for missing g_time string', () => {
      const content = Buffer.from('Content');
      const hashValue = 'test-hash-value';

      expect(() => new MCardFromData(content, hashValue, null))
        .toThrow("g_time string cannot be None or empty");
    });
  });

  describe('Content Type Detection', () => {
    test('should detect content type', () => {
      const textContent = Buffer.from('Plain text content');
      const gTimeStr = 'md5|2023-01-01T12:00:00.000000Z|REGION';
      const hashValue = 'test-hash-value';

      const mcard = new MCardFromData(textContent, hashValue, gTimeStr);
      
      expect(mcard.get_content_type()).toBeTruthy();
      expect(mcard.get_content_type()).toBe(mcard._content_type);
    });

    test('getContentType should return content type', async () => {
      const textContent = Buffer.from('Plain text content');
      const gTimeStr = 'md5|2023-01-01T12:00:00.000000Z|REGION';
      const hashValue = 'test-hash-value';

      const mcard = new MCardFromData(textContent, hashValue, gTimeStr);
      
      const contentType = await mcard.getContentType();
      expect(contentType).toBeTruthy();
      expect(contentType).toBe(mcard._content_type);
    });
  });

  describe('to_dict Method', () => {
    test('should return dictionary with all properties', () => {
      const content = Buffer.from('Test content');
      const hashValue = 'test-hash-value';
      const gTimeStr = 'md5|2023-01-01T12:00:00.000000Z|REGION';

      const mcard = new MCardFromData(content, hashValue, gTimeStr);
      const dict = mcard.to_dict();

      expect(dict.content).toBeInstanceOf(Buffer);
      expect(dict.hash).toBe(hashValue);
      expect(dict.g_time).toBe(gTimeStr);
      expect(dict.content_type).toBeTruthy();
    });
  });
});
