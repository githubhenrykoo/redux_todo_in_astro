/**
 * ContentTypeInterpreter Test Suite
 * 
 * Tests the functionality of content type detection in both browser and Node.js environments,
 * using both string and binary data from the test database.
 */

import { ContentTypeInterpreter } from '../content/model/content_type_detector.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { TextDecoder } from 'util';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import SafeBuffer from your polyfill if available
let SafeBuffer;
try {
  // Use dynamic import for module compatibility
  SafeBuffer = (await import('../utils/bufferPolyfill.js')).SafeBuffer;
} catch (e) {
  console.warn('SafeBuffer polyfill not available, some tests will be skipped');
  SafeBuffer = Buffer;
}

// Mock window.TextEncoder for browser compatibility testing
global.TextEncoder = TextEncoder;
global.window = {
  TextEncoder
};

describe('ContentTypeInterpreter', () => {
  let testDb;
  let testCards = [];
  const testDataDir = path.join(__dirname, 'test_data');
  const dbPath = path.join(testDataDir, 'test-cards.db');

  // Setup: Load test database data
  beforeAll(async () => {
    // Only run DB tests if the test database exists
    if (fs.existsSync(dbPath)) {
      try {
        testDb = new sqlite3.Database(dbPath);
        
        // Load test cards from database
        await new Promise((resolve, reject) => {
          testDb.all('SELECT hash, content, g_time FROM card', [], (err, rows) => {
            if (err) {
              reject(err);
              return;
            }
            
            testCards = rows.map(row => ({
              hash: row.hash,
              content: row.content, // This could be Buffer or string
              g_time: row.g_time
            }));
            resolve();
          });
        });
      } catch (error) {
        console.error('Failed to load test database:', error);
      }
    }
  });

  // Cleanup
  afterAll(() => {
    if (testDb) {
      testDb.close();
    }
  });

  // Basic string content tests
  describe('String content detection', () => {
    test('should detect JSON content', () => {
      const jsonContent = '{"test": "value"}';
      const result = ContentTypeInterpreter.detectContentType(jsonContent);
      
      expect(result.mimeType).toBe('application/json');
      expect(result.extension).toBe('json');
      expect(result.isValid).toBe(true);
    });

    test('should detect XML content', () => {
      const xmlContent = '<root><item>Test</item></root>';
      const result = ContentTypeInterpreter.detectContentType(xmlContent);
      
      expect(result.mimeType).toBe('application/xml');
      expect(result.extension).toBe('xml');
      expect(result.isValid).toBe(true);
    });

    test('should detect Mermaid diagram content', () => {
      const mermaidContent = 'graph TD\n  A[Start] --> B[End]';
      const result = ContentTypeInterpreter.detectContentType(mermaidContent);
      
      expect(result.mimeType).toBe('text/x-mermaid');
      expect(result.extension).toBe('mmd');
      expect(result.isValid).toBe(true);
    });

    test('should handle malformed JSON content', () => {
      const malformedJson = '{ "invalid": "json",  }';
      const result = ContentTypeInterpreter.detectContentType(malformedJson);
      
      // It should detect as text
      expect(result.mimeType).toBe('text/plain');
      expect(result.extension).toBe('txt');
    });

    test('should handle empty content', () => {
      const result = ContentTypeInterpreter.detectContentType('');
      
      expect(result.mimeType).toBe('application/octet-stream');
      expect(result.extension).toBe('');
      expect(result.isValid).toBe(false);
    });

    test('should handle null content', () => {
      const result = ContentTypeInterpreter.detectContentType(null);
      
      expect(result.mimeType).toBe('application/octet-stream');
      expect(result.extension).toBe('');
      expect(result.isValid).toBe(false);
    });

    test('should handle Redux state JSON patterns', () => {
      const reduxStateContent = `{
        "state": {
          "todos": [
            {"id": 1, "text": "Test todo", "completed": false}
          ],
          "filter": "all"
        }
      }`;
      
      const result = ContentTypeInterpreter.detectContentType(reduxStateContent);
      
      expect(result.mimeType).toBe('application/json');
      expect(result.extension).toBe('json');
      expect(result.isValid).toBe(true);
    });
  });

  // Binary content tests
  describe('Binary content detection', () => {
    // Create some test binary content
    const createTestBinary = (signature) => {
      return Buffer.from(signature);
    };

    test('should detect PNG image', () => {
      const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
      const pngBuffer = createTestBinary(pngSignature);
      const result = ContentTypeInterpreter.detectContentType(pngBuffer);
      
      expect(result.mimeType).toBe('image/png');
      expect(result.extension).toBe('png');
      expect(result.isValid).toBe(true);
    });
    
    test('should detect PDF document', () => {
      const pdfSignature = [0x25, 0x50, 0x44, 0x46];
      const pdfBuffer = createTestBinary(pdfSignature);
      const result = ContentTypeInterpreter.detectContentType(pdfBuffer);
      
      expect(result.mimeType).toBe('application/pdf');
      expect(result.extension).toBe('pdf');
      expect(result.isValid).toBe(true);
    });
    
    test('should detect JPEG image', () => {
      const jpegSignature = [0xFF, 0xD8, 0xFF];
      const jpegBuffer = createTestBinary(jpegSignature);
      const result = ContentTypeInterpreter.detectContentType(jpegBuffer);
      
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.extension).toBe('jpg');
      expect(result.isValid).toBe(true);
    });
    
    test('should detect WAV audio file', () => {
      // RIFF header + WAVE identifier
      const wavSignature = [0x52, 0x49, 0x46, 0x46, 0xAC, 0x58, 0x01, 0x00, 0x57, 0x41, 0x56, 0x45];
      const wavBuffer = createTestBinary(wavSignature);
      const result = ContentTypeInterpreter.detectContentType(wavBuffer);
      
      expect(result.mimeType).toBe('audio/wav');
      expect(result.extension).toBe('wav');
      expect(result.isValid).toBe(true);
    });
    
    test('should detect CSV text file', () => {
      const csvContent = "id,name,value\n1,Item 1,100\n2,Item 2,200\n3,Item 3,300\n";
      const encoder = new TextEncoder();
      const csvBuffer = encoder.encode(csvContent);
      const result = ContentTypeInterpreter.detectContentType(csvBuffer);
      
      expect(result.mimeType).toBe('text/csv');
      expect(result.extension).toBe('csv');
      expect(result.isValid).toBe(true);
    });
    
    test('should detect plain text file', () => {
      const textContent = "This is test file 1 content\n";
      const encoder = new TextEncoder();
      const textBuffer = encoder.encode(textContent);
      const result = ContentTypeInterpreter.detectContentType(textBuffer);
      
      expect(result.mimeType).toBe('text/plain');
      expect(result.extension).toBe('txt');
      expect(result.isValid).toBe(true);
    });
  });
});
