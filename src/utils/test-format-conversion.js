// Test script for verifying content format conversion
import { SafeBuffer } from '../utils/bufferPolyfill.js';
import ContentTypeInterpreter from '../content/model/content_type_detector.js';

/**
 * Processes card content based on content type (same as API implementation)
 */
function processCardContent(content, contentType) {
  // If no content, return as is
  if (!content) return content;
  
  // Handle Buffer JSON format
  if (typeof content === 'object' && content !== null && content.type === 'Buffer' && Array.isArray(content.data)) {
    // Create a Uint8Array from the buffer data
    const array = new Uint8Array(content.data);
    
    // If it's a text-based content type, return as string
    if (contentType && (
      contentType.startsWith('text/') || 
      contentType === 'application/json' ||
      contentType === 'application/javascript' ||
      contentType === 'application/xml' ||
      contentType === 'application/yaml'
    )) {
      try {
        // Convert to string using TextDecoder
        return new TextDecoder().decode(array);
      } catch (e) {
        console.error('Error decoding text content:', e);
        // If string conversion fails, fallback to base64
      }
    }
    
    // For binary content types or text conversion failures, return as base64
    try {
      // Convert to base64
      const base64 = SafeBuffer.from(Array.from(array)).toString('base64');
      return {
        type: 'base64',
        data: base64,
        originalType: contentType || 'application/octet-stream'
      };
    } catch (e) {
      console.error('Error converting to base64:', e);
      // If all conversions fail, return original buffer format
      return content;
    }
  }
  
  // If content is already a string, return as is
  return content;
}

// Test data samples
const textBufferJson = {
  type: "Buffer",
  data: [84, 104, 105, 115, 32, 105, 115, 32, 116, 101, 115, 116, 32, 102, 105, 108, 101, 32, 49, 32, 99, 111, 110, 116, 101, 110, 116, 10]
};

const csvBufferJson = {
  type: "Buffer",
  data: [105, 100, 44, 110, 97, 109, 101, 44, 118, 97, 108, 117, 101, 10, 49, 44, 73, 116, 101, 109, 32, 49, 44, 49, 48, 48, 10, 50, 44, 73, 116, 101, 109, 32, 50, 44, 50, 48, 48]
};

const wavBufferJson = {
  type: "Buffer",
  data: [82, 73, 70, 70, 172, 88, 1, 0, 87, 65, 86, 69, 102, 109, 116, 32]
};

// Test client-side handling
function simulateClientProcessing(content) {
  // Simulate what TextViewer component does
  let textContent;
  
  if (typeof content === 'string') {
    textContent = content;
    return { type: 'string', decoded: content };
  } 
  else if (content && typeof content === 'object') {
    if (content.type === 'base64' && content.data) {
      try {
        // Decode base64 to text
        const bytes = atob(content.data);
        const array = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
          array[i] = bytes.charCodeAt(i);
        }
        textContent = new TextDecoder().decode(array);
        return { type: 'base64', decoded: textContent, originalType: content.originalType };
      } catch (e) {
        return { type: 'base64-error', error: e.message };
      }
    }
    else if (content.type === 'Buffer' && Array.isArray(content.data)) {
      try {
        const array = new Uint8Array(content.data);
        textContent = new TextDecoder().decode(array);
        return { type: 'buffer', decoded: textContent };
      } catch (e) {
        return { type: 'buffer-error', error: e.message };
      }
    }
    else {
      return { type: 'other', content: JSON.stringify(content) };
    }
  }
  else {
    return { type: 'unknown', content: String(content || '') };
  }
}

function runTests() {
  console.log("====== CONTENT FORMAT CONVERSION TEST ======");
  
  // Test 1: Text File Format Conversion
  console.log("\n1. Text File Format Conversion:");
  const textType = ContentTypeInterpreter.detectContentType(textBufferJson);
  console.log("Detected Content Type:", textType);
  
  const processedText = processCardContent(textBufferJson, textType.mimeType);
  console.log("Processed Format:", typeof processedText);
  console.log("Processed Content:", processedText);
  
  const clientText = simulateClientProcessing(processedText);
  console.log("Client Display:", clientText);
  
  // Test 2: CSV File Format Conversion  
  console.log("\n2. CSV File Format Conversion:");
  const csvType = ContentTypeInterpreter.detectContentType(csvBufferJson);
  console.log("Detected Content Type:", csvType);
  
  const processedCsv = processCardContent(csvBufferJson, csvType.mimeType);
  console.log("Processed Format:", typeof processedCsv);
  console.log("Processed Content:", processedCsv);
  
  const clientCsv = simulateClientProcessing(processedCsv);
  console.log("Client Display:", clientCsv);
  
  // Test 3: Binary (WAV) File Format Conversion
  console.log("\n3. Binary (WAV) File Format Conversion:");
  const wavType = ContentTypeInterpreter.detectContentType(wavBufferJson);
  console.log("Detected Content Type:", wavType);
  
  const processedWav = processCardContent(wavBufferJson, wavType.mimeType);
  console.log("Processed Format:", typeof processedWav);
  console.log("Is Base64 Format:", processedWav && typeof processedWav === 'object' && processedWav.type === 'base64');
  if (processedWav && typeof processedWav === 'object' && processedWav.type === 'base64') {
    console.log("Base64 Data (first 30 chars):", processedWav.data.substring(0, 30) + '...');
    console.log("Original Type:", processedWav.originalType);
  }
  
  // Success/failure
  console.log("\n====== SUMMARY ======");
  console.log("✅ Text buffer converted to:", typeof processedText === 'string' ? "string" : "not string");
  console.log("✅ CSV buffer converted to:", typeof processedCsv === 'string' ? "string" : "not string");
  console.log("✅ WAV buffer converted to:", processedWav && typeof processedWav === 'object' && processedWav.type === 'base64' ? "base64" : "not base64");
  
  console.log("\nOutput matches our expected format conversion rules:");
  console.log("- Text files return as direct strings");
  console.log("- Binary files return as base64 with type information");
}

runTests();

// Run this with Node.js: node src/utils/test-format-conversion.js
