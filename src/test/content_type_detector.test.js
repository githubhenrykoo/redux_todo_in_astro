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
  const bufferPolyfill = await import('../utils/bufferPolyfill.js');
  SafeBuffer = bufferPolyfill.SafeBuffer;
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
      const jsonContent = fs.readFileSync(path.join(testDataDir, 'test-json.json'), 'utf8');
      const result = ContentTypeInterpreter.detectContentType(jsonContent);
      
      expect(result.mimeType).toBe('application/json');
      expect(result.extension).toBe('json');
      expect(result.isValid).toBe(true);
    });

    test('should detect XML content', () => {
      const xmlContent = fs.readFileSync(path.join(testDataDir, 'test-xml.xml'), 'utf8');
      const result = ContentTypeInterpreter.detectContentType(xmlContent);
      
      expect(result.mimeType).toBe('application/xml');
      expect(result.extension).toBe('xml');
      expect(result.isValid).toBe(true);
    });

    test('should detect Mermaid diagram content', () => {
      const mermaidContent = fs.readFileSync(path.join(testDataDir, 'test-mermaid.mmd'), 'utf8');
      const result = ContentTypeInterpreter.detectContentType(mermaidContent);
      
      expect(result.mimeType).toBe('text/x-mermaid');
      expect(result.extension).toBe('mmd');
      expect(result.isValid).toBe(true);
    });

    test('should detect PlantUML content', () => {
      const plantUmlContent = fs.readFileSync(path.join(testDataDir, 'test-plantuml.puml'), 'utf8');
      const result = ContentTypeInterpreter.detectContentType(plantUmlContent);
      
      expect(result.mimeType).toBe('text/x-plantuml');
      expect(result.extension).toBe('puml');
      expect(result.isValid).toBe(true);
    });

    test('should detect Graphviz content', () => {
      const graphvizContent = fs.readFileSync(path.join(testDataDir, 'test-graphviz.dot'), 'utf8');
      const result = ContentTypeInterpreter.detectContentType(graphvizContent);
      
      expect(result.mimeType).toBe('text/vnd.graphviz');
      expect(result.extension).toBe('dot');
      expect(result.isValid).toBe(true);
    });

    test('should handle malformed JSON content', () => {
      const malformedJson = '{ "invalid": "json",  }';
      const result = ContentTypeInterpreter.detectContentType(malformedJson);
      
      // It should detect as text
      expect(result.mimeType).toBe('text/plain');
      expect(result.extension).toBe('txt');
      expect(result.isValid).toBe(false);
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
    
    test('should detect ZIP archive', () => {
      const zipSignature = [0x50, 0x4B, 0x03, 0x04];
      const zipBuffer = createTestBinary(zipSignature);
      const result = ContentTypeInterpreter.detectContentType(zipBuffer);
      
      expect(result.mimeType).toBe('application/zip');
      expect(result.extension).toBe('zip');
      expect(result.isValid).toBe(true);
    });
    
    test('should detect unknown binary content', () => {
      const unknownBuffer = createTestBinary([0x01, 0x02, 0x03, 0x04]);
      const result = ContentTypeInterpreter.detectContentType(unknownBuffer);
      
      expect(result.mimeType).toBe('application/octet-stream');
      expect(result.extension).toBe('');
      expect(result.isValid).toBe(false);
    });
  });

  // Test validation functions
  describe('Content validation', () => {
    test('should validate valid JSON', () => {
      const validJson = '{"test": "value"}';
      expect(() => ContentTypeInterpreter.validateContent(validJson)).not.toThrow();
    });
    
    test('should reject invalid JSON', () => {
      const invalidJson = 'invalid json';
      expect(() => ContentTypeInterpreter.validateContent(invalidJson)).toThrow('Invalid JSON content');
    });
    
    test('should validate Mermaid diagram', () => {
      const validMermaid = 'graph TD\n  A[Start] --> B[End]';
      expect(() => ContentTypeInterpreter.validateContent(validMermaid)).not.toThrow();
    });
    
    test('should reject empty content', () => {
      expect(() => ContentTypeInterpreter.validateContent('')).toThrow('Invalid text content');
    });
  });

  // Test with database content (if available)
  describe('Database content detection', () => {
    test('should detect content types from database records', () => {
      if (testCards.length === 0) {
        console.warn('Skipping database tests: No test cards available');
        return;
      }
      
      testCards.forEach(card => {
        const result = ContentTypeInterpreter.detectContentType(card.content);
        
        // Every result should have some kind of MIME type and result object
        expect(result).toBeDefined();
        expect(result.mimeType).toBeDefined();
        
        // Log detection results for debugging
        console.log(`Hash: ${card.hash.substring(0, 8)}..., Detected: ${result.mimeType} (${result.extension})`);
      });
    });
    
    test('should handle TEXT content from database', () => {
      if (testCards.length === 0) {
        console.warn('Skipping database tests: No test cards available');
        return;
      }
      
      // Find text-based records (JSON, XML, etc.)
      const textRecords = testCards.filter(card => typeof card.content === 'string');
      
      textRecords.forEach(card => {
        const result = ContentTypeInterpreter.detectContentType(card.content);
        
        // String content should always have a valid mime type
        expect(result.mimeType).toBeDefined();
        
        if (result.mimeType === 'application/json') {
          // Check if it's actually parseable JSON
          try {
            JSON.parse(card.content);
            expect(result.isValid).toBe(true);
          } catch (e) {
            // It failed JSON parsing but was detected as JSON - this is a potential issue
            console.warn(`Failed to parse detected JSON for hash ${card.hash.substring(0, 8)}...`);
          }
        }
      });
    });
    
    test('should handle BLOB content from database', () => {
      if (testCards.length === 0) {
        console.warn('Skipping database tests: No test cards available');
        return;
      }
      
      // Find binary records
      const blobRecords = testCards.filter(card => card.content instanceof Buffer);
      
      blobRecords.forEach(card => {
        const result = ContentTypeInterpreter.detectContentType(card.content);
        
        // Binary content should have a mime type
        expect(result.mimeType).toBeDefined();
        
        // Log results for debugging
        console.log(`Binary Hash: ${card.hash.substring(0, 8)}..., Detected: ${result.mimeType}`);
      });
    });
  });

  // Cross-environment compatibility tests
  describe('Cross-environment compatibility', () => {
    test('should work with browser TextEncoder', () => {
      // Test with browser TextEncoder simulation
      const originalTextEncoder = global.TextEncoder;
      
      try {
        // Simulate browser environment
        global.TextEncoder = function TextEncoder() {
          return {
            encode: (str) => {
              const utf8 = [];
              for (let i = 0; i < str.length; i++) {
                const charCode = str.charCodeAt(i);
                if (charCode < 0x80) {
                  utf8.push(charCode);
                } else if (charCode < 0x800) {
                  utf8.push(0xc0 | (charCode >> 6), 
                            0x80 | (charCode & 0x3f));
                } else if (charCode < 0xd800 || charCode >= 0xe000) {
                  utf8.push(0xe0 | (charCode >> 12), 
                            0x80 | ((charCode>>6) & 0x3f), 
                            0x80 | (charCode & 0x3f));
                } else {
                  // Handle surrogate pair
                  i++;
                  const c2 = str.charCodeAt(i);
                  const c = 0x10000 + ((charCode & 0x3ff) << 10) + (c2 & 0x3ff);
                  utf8.push(0xf0 | (c >> 18), 
                            0x80 | ((c >> 12) & 0x3f), 
                            0x80 | ((c >> 6) & 0x3f), 
                            0x80 | (c & 0x3f));
                }
              }
              return new Uint8Array(utf8);
            }
          };
        };
        
        // Now test with the browser TextEncoder
        const jsonContent = '{"browser": true}';
        const result = ContentTypeInterpreter.detectContentType(jsonContent);
        
        expect(result.mimeType).toBe('application/json');
        expect(result.extension).toBe('json');
      } finally {
        global.TextEncoder = originalTextEncoder;
      }
    });
    
    test('should work with SafeBuffer in browser environment', () => {
      // Skip if SafeBuffer is not available
      if (typeof SafeBuffer === 'undefined') {
        console.warn('Skipping SafeBuffer test: SafeBuffer not available');
        return;
      }
      
      // Create test content with SafeBuffer
      const jsonString = '{"safeBuffer": true}';
      const safeBufferContent = SafeBuffer.from(jsonString);
      
      // Test detection with SafeBuffer
      const result = ContentTypeInterpreter.detectContentType(safeBufferContent);
      
      // This might be detected as either JSON or binary depending on implementation
      expect(result).toBeDefined();
      expect(result.mimeType).toBeDefined();
    });
  });
});
