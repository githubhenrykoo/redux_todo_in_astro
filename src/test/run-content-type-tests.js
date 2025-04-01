/**
 * ContentTypeInterpreter Test Runner
 * 
 * A simplified test runner for testing the ContentTypeInterpreter without requiring Jest
 * This makes it easier to test in ESM environments
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ContentTypeInterpreter } from '../content/model/content_type_detector.js';
import sqlite3 from 'sqlite3';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test data paths
const testDataDir = path.join(__dirname, 'test_data');
const dbPath = path.join(testDataDir, 'test-cards.db');

// Testing helpers
function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    console.error(`❌ FAIL: ${message}`);
    console.error(`  Expected: ${expected}`);
    console.error(`  Actual: ${actual}`);
    return false;
  }
  console.log(`✅ PASS: ${message}`);
  return true;
}

function assertObject(actual, expected, message) {
  let pass = true;
  Object.keys(expected).forEach(key => {
    if (actual[key] !== expected[key]) {
      console.error(`❌ FAIL: ${message} - ${key}`);
      console.error(`  Expected: ${expected[key]}`);
      console.error(`  Actual: ${actual[key]}`);
      pass = false;
    }
  });
  
  if (pass) {
    console.log(`✅ PASS: ${message}`);
  }
  return pass;
}

async function runTests() {
  let passCount = 0;
  let failCount = 0;
  let testCount = 0;
  
  console.log('🧪 Running ContentTypeInterpreter Tests');
  console.log('=======================================');
  
  // Test 1: JSON detection
  try {
    const jsonContent = fs.readFileSync(path.join(testDataDir, 'test-json.json'), 'utf8');
    const result = ContentTypeInterpreter.detectContentType(jsonContent);
    
    if (assertObject(result, {
      mimeType: 'application/json',
      extension: 'json',
      isValid: true
    }, 'Should detect JSON content')) {
      passCount++;
    } else {
      failCount++;
    }
  } catch (error) {
    console.error('❌ Error running JSON test:', error);
    failCount++;
  }
  testCount++;
  
  // Test 2: XML detection
  try {
    const xmlContent = fs.readFileSync(path.join(testDataDir, 'test-xml.xml'), 'utf8');
    const result = ContentTypeInterpreter.detectContentType(xmlContent);
    
    if (assertObject(result, {
      mimeType: 'application/xml',
      extension: 'xml',
      isValid: true
    }, 'Should detect XML content')) {
      passCount++;
    } else {
      failCount++;
    }
  } catch (error) {
    console.error('❌ Error running XML test:', error);
    failCount++;
  }
  testCount++;
  
  // Test 3: Mermaid detection
  try {
    const mermaidContent = fs.readFileSync(path.join(testDataDir, 'test-mermaid.mmd'), 'utf8');
    const result = ContentTypeInterpreter.detectContentType(mermaidContent);
    
    if (assertObject(result, {
      mimeType: 'text/x-mermaid',
      extension: 'mmd',
      isValid: true
    }, 'Should detect Mermaid content')) {
      passCount++;
    } else {
      failCount++;
    }
  } catch (error) {
    console.error('❌ Error running Mermaid test:', error);
    failCount++;
  }
  testCount++;
  
  // Test 4: PlantUML detection
  try {
    const pumlContent = fs.readFileSync(path.join(testDataDir, 'test-plantuml.puml'), 'utf8');
    const result = ContentTypeInterpreter.detectContentType(pumlContent);
    
    if (assertObject(result, {
      mimeType: 'text/x-plantuml',
      extension: 'puml',
      isValid: true
    }, 'Should detect PlantUML content')) {
      passCount++;
    } else {
      failCount++;
    }
  } catch (error) {
    console.error('❌ Error running PlantUML test:', error);
    failCount++;
  }
  testCount++;
  
  // Test 5: Graphviz detection
  try {
    const dotContent = fs.readFileSync(path.join(testDataDir, 'test-graphviz.dot'), 'utf8');
    const result = ContentTypeInterpreter.detectContentType(dotContent);
    
    if (assertObject(result, {
      mimeType: 'text/vnd.graphviz',
      extension: 'dot',
      isValid: true
    }, 'Should detect Graphviz content')) {
      passCount++;
    } else {
      failCount++;
    }
  } catch (error) {
    console.error('❌ Error running Graphviz test:', error);
    failCount++;
  }
  testCount++;
  
  // Test 6: Empty content
  try {
    const result = ContentTypeInterpreter.detectContentType('');
    
    if (assertObject(result, {
      mimeType: 'application/octet-stream',
      extension: '',
      isValid: false
    }, 'Should handle empty content')) {
      passCount++;
    } else {
      failCount++;
    }
  } catch (error) {
    console.error('❌ Error running empty content test:', error);
    failCount++;
  }
  testCount++;
  
  // Test 7: Binary detection (PNG signature)
  try {
    const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const result = ContentTypeInterpreter.detectContentType(pngSignature);
    
    if (assertObject(result, {
      mimeType: 'image/png',
      extension: 'png',
      isValid: true
    }, 'Should detect PNG signature')) {
      passCount++;
    } else {
      failCount++;
    }
  } catch (error) {
    console.error('❌ Error running PNG signature test:', error);
    failCount++;
  }
  testCount++;
  
  // Test 8: Binary detection (PDF signature)
  try {
    const pdfSignature = Buffer.from([0x25, 0x50, 0x44, 0x46]);
    const result = ContentTypeInterpreter.detectContentType(pdfSignature);
    
    if (assertObject(result, {
      mimeType: 'application/pdf',
      extension: 'pdf',
      isValid: true
    }, 'Should detect PDF signature')) {
      passCount++;
    } else {
      failCount++;
    }
  } catch (error) {
    console.error('❌ Error running PDF signature test:', error);
    failCount++;
  }
  testCount++;
  
  // Test 9: Database content tests (if database exists)
  if (fs.existsSync(dbPath)) {
    console.log('\n📊 Testing with database content');
    console.log('--------------------------------');
    
    try {
      const db = new sqlite3.Database(dbPath);
      
      // Get all test cards from the database
      const testCards = await new Promise((resolve, reject) => {
        db.all('SELECT hash, content, g_time FROM card', [], (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        });
      });
      
      console.log(`Found ${testCards.length} records in test database`);
      
      // Test each card
      for (const card of testCards) {
        try {
          const result = ContentTypeInterpreter.detectContentType(card.content);
          console.log(`Hash: ${card.hash.substring(0, 8)}..., Detected: ${result.mimeType} (${result.extension || 'no-ext'})`);
          
          // Just ensure we get some result
          if (result && result.mimeType) {
            passCount++;
          } else {
            failCount++;
            console.error('❌ Failed to detect content type for hash:', card.hash.substring(0, 8));
          }
          testCount++;
        } catch (error) {
          console.error(`❌ Error detecting content for hash ${card.hash.substring(0, 8)}:`, error);
          failCount++;
          testCount++;
        }
      }
      
      db.close();
    } catch (error) {
      console.error('❌ Error accessing test database:', error);
      failCount++;
      testCount++;
    }
  } else {
    console.log('⚠️ Skipping database tests: test database not found');
  }
  
  // Test summary
  console.log('\n📝 Test Summary');
  console.log('===============');
  console.log(`Total Tests: ${testCount}`);
  console.log(`Passed: ${passCount} ✅`);
  console.log(`Failed: ${failCount} ❌`);
  
  if (failCount === 0) {
    console.log('\n🎉 All tests passed!');
    return true;
  } else {
    console.log('\n⚠️ Some tests failed');
    return false;
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
