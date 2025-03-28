#!/bin/bash

# Kill any existing processes on ports 4321 and 4322
echo "Killing existing processes on ports 4321 and 4322..."
lsof -ti:4321 | xargs kill -9
lsof -ti:4322 | xargs kill -9

# Start the dev server in the background
echo "Starting Astro dev server..."
npm run start &
SERVER_PID=$!

# Wait for the server to start
sleep 10

# Run Playwright tests
echo "Running Playwright tests..."
npx playwright test

# Capture the test result
TEST_RESULT=$?

# Kill the server
kill $SERVER_PID

# Exit with the test result
exit $TEST_RESULT
