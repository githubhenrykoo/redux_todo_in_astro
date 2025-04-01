// Test script for content type detection

import { detectContentType, convertBufferToString } from './bufferContentHelper.js';

// Example CSV data in Buffer JSON format
const csvBufferJson = {"type":"Buffer","data":[105,100,44,110,97,109,101,44,118,97,108,117,101,10,49,44,73,116,101,109,32,49,44,49,48,48,10,50,44,73,116,101,109,32,50,44,50,48,48,10,51,44,73,116,101,109,32,51,44,51,48,48,10]};

// Test detection
console.log("Testing CSV Buffer detection:");
console.log("Detected content type:", detectContentType(csvBufferJson));

// Show the decoded content
console.log("\nDecoded content:");
console.log(convertBufferToString(csvBufferJson));

// Run this with: node src/utils/testDetection.js
