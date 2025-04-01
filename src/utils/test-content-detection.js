// Test script for content type detection
import ContentTypeInterpreter from '../content/model/content_type_detector.js';

// Create test examples
const jsonBufferExample = {"type":"Buffer","data":[123,10,32,32,34,110,97,109,101,34,58,32,34,84,101,115,116,32,79,98,106,101,99,116,34,44,10,32,32,34,112,114,111,112,101,114,116,105,101,115,34,58,32,123,10,32,32,32,32,34,99,111,108,111,114,34,58,32,34,98,108,117,101,34,44,10,32,32,32,32,34,115,105,122,101,34,58,32,49,48,48,44,10,32,32,32,32,34,110,101,115,116,101,100,34,58,32,123,10,32,32,32,32,32,32,34,97,114,114,97,121,34,58,32,91,10,32,32,32,32,32,32,32,32,49,44,10,32,32,32,32,32,32,32,32,50,44,10,32,32,32,32,32,32,32,32,51,10,32,32,32,32,32,32,93,44,10,32,32,32,32,32,32,34,98,111,111,108,101,97,110,34,58,32,116,114,117,101,10,32,32,32,32,125,10,32,32,125,10,125]}; 

const csvBufferExample = {"type":"Buffer","data":[105,100,44,110,97,109,101,44,118,97,108,117,101,10,49,44,73,116,101,109,32,49,44,49,48,48,10,50,44,73,116,101,109,32,50,44,50,48,48,10,51,44,73,116,101,109,32,51,44,51,48,48,10]};

// Plain text example
const txtBufferExample = {"type":"Buffer","data":[84,104,105,115,32,105,115,32,97,32,115,105,109,112,108,101,32,112,108,97,105,110,32,116,101,120,116,32,102,105,108,101,46,10,10,73,116,32,100,111,101,115,110,39,116,32,104,97,118,101,32,97,110,121,32,115,112,101,99,105,97,108,32,102,111,114,109,97,116,116,105,110,103,32,111,114,32,115,116,114,117,99,116,117,114,101,46,10,10,74,117,115,116,32,112,108,97,105,110,32,116,101,120,116,46]};

// Example MOV file header bytes
const movFileHeader = new Uint8Array([
  0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74, 0x20, 0x20, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

// Mock MOV file buffer
const movBufferExample = {
  type: "Buffer",
  data: Array.from(movFileHeader)
};

// Function to decode buffer content to readable format
function decodeBuffer(bufferJson) {
  if (typeof bufferJson === 'object' && bufferJson.type === 'Buffer' && Array.isArray(bufferJson.data)) {
    const array = new Uint8Array(bufferJson.data);
    return new TextDecoder().decode(array);
  }
  return "Not a buffer format";
}

// Test detection without our enhancement
function runTests() {
  console.log("====== TEST RESULTS ======");
  
  // 1. Test JSON Buffer content
  console.log("\n1. Testing JSON Buffer Example:");
  console.log("Decoded content:", decodeBuffer(jsonBufferExample));
  const jsonResult = ContentTypeInterpreter.detectContentType(jsonBufferExample);
  console.log("Detection result:", jsonResult);
  
  // 2. Test CSV Buffer content
  console.log("\n2. Testing CSV Buffer Example:");
  console.log("Decoded content:", decodeBuffer(csvBufferExample));
  const csvResult = ContentTypeInterpreter.detectContentType(csvBufferExample);
  console.log("Detection result:", csvResult);
  
  // 3. Test TXT Buffer content
  console.log("\n3. Testing TXT Buffer Example:");
  console.log("Decoded content:", decodeBuffer(txtBufferExample));
  const txtResult = ContentTypeInterpreter.detectContentType(txtBufferExample);
  console.log("Detection result:", txtResult);
  
  // 4. Test MOV file detection
  console.log("\n4. Testing MOV Buffer Example:");
  console.log("Cannot show decoded binary content");
  const movResult = ContentTypeInterpreter.detectContentType(movBufferExample);
  console.log("Detection result:", movResult);
  
  // Summary
  console.log("\n====== SUMMARY ======");
  console.log("JSON detected as:", jsonResult.mimeType, "("+jsonResult.extension+")");
  console.log("CSV detected as:", csvResult.mimeType, "("+csvResult.extension+")");
  console.log("TXT detected as:", txtResult.mimeType, "("+txtResult.extension+")");
  console.log("MOV detected as:", movResult.mimeType, "("+movResult.extension+")");
}

runTests();

// Run this with Node.js: node src/utils/test-content-detection.js
