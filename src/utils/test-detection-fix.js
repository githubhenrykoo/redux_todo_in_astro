// Test script for fixing content type detection issues
import ContentTypeInterpreter from '../content/model/content_type_detector.js';

// Create test examples based on the actual files in your database
const getWavExample = () => {
  // Partial WAV header from your database file (7f204fc6...)
  // RIFF header followed by WAVE
  const wavHeader = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0xAC, 0x58, 0x01, 0x00, 
    0x57, 0x41, 0x56, 0x45, 0x66, 0x6D, 0x74, 0x20
  ]);
  
  return {
    type: "Buffer",
    data: Array.from(wavHeader)
  };
};

const getCsvExample = () => {
  // CSV content from your database file (2f9aea91...)
  const csvContent = "id,name,value\n1,Item 1,100\n2,Item 2,200\n3,Item 3,300\n";
  
  // Convert to Buffer JSON format
  const encoder = new TextEncoder();
  const bytes = encoder.encode(csvContent);
  
  return {
    type: "Buffer",
    data: Array.from(bytes)
  };
};

const getTxtExample = () => {
  // Text content from your database file (157aef08...)
  const textContent = "This is test file 1 content\n";
  
  // Convert to Buffer JSON format
  const encoder = new TextEncoder();
  const bytes = encoder.encode(textContent);
  
  return {
    type: "Buffer",
    data: Array.from(bytes)
  };
};

// Create a webp example
const getWebpExample = () => {
  // RIFF header followed by WEBP
  const webpHeader = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0x24, 0x58, 0x01, 0x00, 
    0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20
  ]);
  
  return {
    type: "Buffer",
    data: Array.from(webpHeader)
  };
};

// Function to decode buffer content to readable format (for debugging)
function decodeBuffer(bufferJson) {
  if (typeof bufferJson === 'object' && bufferJson.type === 'Buffer' && Array.isArray(bufferJson.data)) {
    const array = new Uint8Array(bufferJson.data);
    return Array.from(array).map(byte => byte.toString(16).padStart(2, '0')).join(' ');
  }
  return "Not a buffer format";
}

function runTests() {
  console.log("====== CONTENT TYPE DETECTION TEST ======");
  
  // Test 1: WAV file detection
  const wavBuffer = getWavExample();
  console.log("\n1. Testing WAV file detection (previously misidentified as webp):");
  console.log("Buffer hex dump:", decodeBuffer(wavBuffer));
  const wavResult = ContentTypeInterpreter.detectContentType(wavBuffer);
  console.log("Detection result:", wavResult);
  
  // Test 2: CSV file detection
  const csvBuffer = getCsvExample();
  console.log("\n2. Testing CSV file detection (previously misidentified as 'data'):");
  const csvResult = ContentTypeInterpreter.detectContentType(csvBuffer);
  console.log("Detection result:", csvResult);
  
  // Test 3: TXT file detection
  const txtBuffer = getTxtExample();
  console.log("\n3. Testing TXT file detection (previously misidentified as 'data'):");
  const txtResult = ContentTypeInterpreter.detectContentType(txtBuffer);
  console.log("Detection result:", txtResult);
  
  // Test 4: Make sure WEBP is still correctly identified
  const webpBuffer = getWebpExample();
  console.log("\n4. Testing WEBP file detection (make sure we didn't break it):");
  console.log("Buffer hex dump:", decodeBuffer(webpBuffer));
  const webpResult = ContentTypeInterpreter.detectContentType(webpBuffer);
  console.log("Detection result:", webpResult);
  
  // Summary
  console.log("\n====== SUMMARY ======");
  console.log("WAV file detected as:", wavResult.mimeType, "("+wavResult.extension+")");
  console.log("CSV file detected as:", csvResult.mimeType, "("+csvResult.extension+")");
  console.log("TXT file detected as:", txtResult.mimeType, "("+txtResult.extension+")");
  console.log("WEBP file detected as:", webpResult.mimeType, "("+webpResult.extension+")");
  
  // Success/failure
  let allPassed = true;
  
  if (wavResult.extension !== 'wav') {
    console.log("❌ WAV detection FAILED");
    allPassed = false;
  }
  
  if (csvResult.extension !== 'csv') {
    console.log("❌ CSV detection FAILED");
    allPassed = false;
  }
  
  if (txtResult.extension !== 'txt') {
    console.log("❌ TXT detection FAILED");
    allPassed = false;
  }
  
  if (webpResult.extension !== 'webp') {
    console.log("❌ WEBP detection FAILED");
    allPassed = false;
  }
  
  if (allPassed) {
    console.log("✅ All tests PASSED! The content type detection has been fixed.");
  }
}

runTests();

// Run this with Node.js: node src/utils/test-detection-fix.js
