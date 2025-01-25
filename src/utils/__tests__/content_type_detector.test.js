import { ContentTypeInterpreter } from '../content_type_detector';

describe('ContentTypeInterpreter', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new ContentTypeInterpreter();
  });

  describe('Text Content Detection', () => {
    test('should detect plain text content', () => {
      const textContent = 'Hello, this is a plain text content';
      const result = interpreter.detectContentType(textContent);
      expect(result.mimeType).toBe('text/plain');
      expect(result.extension).toBe('txt');
      expect(result.isValid).toBe(true);
    });

    test('should detect JSON content', () => {
      const jsonContent = JSON.stringify({
        name: 'test',
        value: 123,
        nested: { key: 'value' }
      });
      const result = interpreter.detectContentType(jsonContent);
      expect(result.mimeType).toBe('application/json');
      expect(result.extension).toBe('json');
      expect(result.isValid).toBe(true);
    });

    test('should detect malformed JSON as text/plain', () => {
      const malformedJson = '{ "name": "test", value: 123 }'; // missing quotes around value
      const result = interpreter.detectContentType(malformedJson);
      expect(result.mimeType).toBe('text/plain');
      expect(result.extension).toBe('txt');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Image Content Detection', () => {
    test('should detect PNG signature', () => {
      const pngSignature = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00]);
      const result = interpreter.detectContentType(pngSignature);
      expect(result.mimeType).toBe('image/png');
      expect(result.extension).toBe('png');
      expect(result.isValid).toBe(true);
    });

    test('should detect JPEG signature', () => {
      const jpegSignature = new Uint8Array([0xFF, 0xD8, 0xFF, 0x00]);
      const result = interpreter.detectContentType(jpegSignature);
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.extension).toBe('jpg');
      expect(result.isValid).toBe(true);
    });

    test('should detect WebP signature', () => {
      // RIFF....WEBP
      const webpSignature = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00, // Size (placeholder)
        0x57, 0x45, 0x42, 0x50  // WEBP
      ]);
      const result = interpreter.detectContentType(webpSignature);
      expect(result.mimeType).toBe('image/webp');
      expect(result.extension).toBe('webp');
      expect(result.isValid).toBe(true);
    });
  });

  describe('Content Validation', () => {
    test('should validate text content', () => {
      const textContent = 'Hello, this is valid text content';
      expect(() => interpreter.validateContent(textContent)).not.toThrow();
    });

    test('should validate JSON content', () => {
      const jsonContent = JSON.stringify({ test: 'valid json' });
      expect(() => interpreter.validateContent(jsonContent)).not.toThrow();
    });

    test('should throw on invalid content', () => {
      const invalidContent = undefined;
      expect(() => interpreter.validateContent(invalidContent)).toThrow();
    });

    test('should throw on null content', () => {
      const nullContent = null;
      expect(() => interpreter.validateContent(nullContent)).toThrow();
    });
  });
});
