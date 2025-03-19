#!/bin/bash

# Run all tests 
echo "Running all tests..."
echo "-------------------"

# Run integration tests
echo "Running integration tests..."
npm test integration.test.js

# Run unit tests
echo "Running MCard tests..."
npm test mcard.test.js

echo "Running GTime tests..."
npm test g_time.test.js

echo "Running SQLite engine tests..."
npm test sqlite_engine.test.js

echo "Running Card Collection tests..."
npm test card-collection.test.js

echo "-------------------"
echo "All tests completed!"
