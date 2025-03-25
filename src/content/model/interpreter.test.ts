import { describe, it, expect } from '@jest/globals';
import { ContentTypeInterpreter } from './interpreter';

describe('ContentTypeInterpreter', () => {
  // Binary Type Detection Tests
  describe('Binary Type Detection', () => {
    const testBinarySignatures = [
      { 
        name: 'PNG Image', 
        input: new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52]),
        expectedType: 'image/png',
        expectedSubtype: 'png'
      },
      { 
        name: 'JPEG Image', 
        input: new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]),
        expectedType: 'image/jpeg',
        expectedSubtype: 'jpeg'
      },
      { 
        name: 'PDF Document', 
        input: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x37]),
        expectedType: 'application/pdf',
        expectedSubtype: 'pdf'
      }
    ];

    testBinarySignatures.forEach(({ name, input, expectedType, expectedSubtype }) => {
      it(`should detect ${name}`, () => {
        const result = ContentTypeInterpreter.detectContentType(input);
        expect(result.type).toBe(expectedType);
        expect(result.subtype).toBe(expectedSubtype);
      });
    });
  });

  // Text Type Detection Tests
  describe('Text Type Detection', () => {
    const testTextTypes = [
      {
        name: 'JSON Object',
        input: '{"name": "test", "value": 42}',
        expectedType: 'text/json',
        expectedSubtype: 'json'
      },
      {
        name: 'JSON Array',
        input: '[1, 2, 3, 4]',
        expectedType: 'text/json',
        expectedSubtype: 'json'
      },
      {
        name: 'Markdown',
        input: '# Heading\n\nThis is a paragraph with a [link](https://example.com)',
        expectedType: 'text/markdown',
        expectedSubtype: 'markdown'
      },
      {
        name: 'CSV',
        input: 'name,age,city\nJohn,30,New York\nJane,25,San Francisco',
        expectedType: 'text/csv',
        expectedSubtype: 'csv'
      },
      {
        name: 'XML',
        input: '<?xml version="1.0" encoding="UTF-8"?>\n<root><child>value</child></root>',
        expectedType: 'text/xml',
        expectedSubtype: 'xml'
      }
    ];

    testTextTypes.forEach(({ name, input, expectedType, expectedSubtype }) => {
      it(`should detect ${name}`, () => {
        const result = ContentTypeInterpreter.detectContentType(input);
        expect(result.type).toBe(expectedType);
        expect(result.subtype).toBe(expectedSubtype);
      });
    });
  });

  // Content Analysis Tests
  describe('Content Analysis', () => {
    it('should handle string input', () => {
      const result = ContentTypeInterpreter.analyzeContentType('Hello, world!');
      expect(result.isString).toBe(true);
      expect(result.isBinary).toBe(false);
      expect(result.contentType).toBe('text/plain');
      expect(result.length).toBe(13);
    });

    it('should detect binary content', () => {
      const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
      const result = ContentTypeInterpreter.analyzeContentType(binaryData);
      expect(result.isString).toBe(false);
      expect(result.isBinary).toBe(true);
      expect(result.length).toBe(8);
    });
  });

  // Utility Method Tests
  describe('Utility Methods', () => {
    it('should detect Markdown content', () => {
      const markdownContent = '# Title\n\n- List item\n1. Numbered list\n[Link](url)';
      const nonMarkdownContent = 'Plain text without Markdown elements';

      expect(ContentTypeInterpreter['isMarkdownContent'](markdownContent)).toBe(true);
      expect(ContentTypeInterpreter['isMarkdownContent'](nonMarkdownContent)).toBe(false);
    });

    it('should detect JSON content', () => {
      const jsonContent = '{"key": "value"}';
      const invalidJsonContent = '{key: "value"}';

      expect(ContentTypeInterpreter['isJSONContent'](jsonContent)).toBe(true);
      expect(ContentTypeInterpreter['isJSONContent'](invalidJsonContent)).toBe(false);
    });

    it('should detect CSV content', () => {
      const csvContent = 'name,age\nJohn,30\nJane,25';
      const nonCsvContent = 'Just some text';

      expect(ContentTypeInterpreter['isCSVContent'](csvContent)).toBe(true);
      expect(ContentTypeInterpreter['isCSVContent'](nonCsvContent)).toBe(false);
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const result = ContentTypeInterpreter.detectContentType('');
      expect(result.type).toBe('text/plain');
      expect(result.subtype).toBe('plain');
    });

    it('should handle conversion error', () => {
      const invalidInput = Symbol('invalid');
      const result = ContentTypeInterpreter.detectContentType(invalidInput);
      expect(result.type).toBe('application/octet-stream');
      expect(result.subtype).toBe('unknown');
    });
  });
});
