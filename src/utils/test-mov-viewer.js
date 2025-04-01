// Test script for MOV viewer detection and display
import ContentTypeInterpreter from '../content/model/content_type_detector.js';

// Example MOV file header bytes (QuickTime format)
const createMOVBuffer = () => {
  // QuickTime container format signature
  const movSignature = new Uint8Array([
    0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74, 0x20, 0x20, 
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);
  
  // Create Buffer JSON format (what we'd get from a database)
  return {
    type: "Buffer",
    data: Array.from(movSignature)
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
  console.log("====== MOV VIEWER TEST ======");
  
  // Create a MOV Buffer example
  const movBufferExample = createMOVBuffer();
  
  // Test detection
  console.log("\nTesting MOV detection:");
  console.log("Buffer hex dump:", decodeBuffer(movBufferExample));
  const movResult = ContentTypeInterpreter.detectContentType(movBufferExample);
  console.log("Detection result:", movResult);
  
  // Verify it's correctly identified as QuickTime/MOV
  if (movResult.mimeType === 'video/quicktime' && movResult.extension === 'mov') {
    console.log("\n✅ SUCCESS: Correctly identified as video/quicktime (mov)");
  } else {
    console.log("\n❌ FAILURE: Not correctly identified as MOV");
    console.log(`Instead detected as: ${movResult.mimeType} (${movResult.extension})`);
  }
  
  // Show which viewer would be used
  console.log("\nIn the application, this would be displayed using:");
  console.log("- Primary: MOVViewer.jsx (specialized for QuickTime format)");
  console.log("- Fallback: VideoViewer.jsx (if MOVViewer fails)");
  console.log("- Last resort: BinaryViewer.jsx (for binary data)");
  
  console.log("\n====== END OF TEST ======");
}

runTests();

// Run this with Node.js: node src/utils/test-mov-viewer.js
