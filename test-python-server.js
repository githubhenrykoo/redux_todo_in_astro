// Simple test script to check Python REPL server connectivity
import WebSocket from 'ws';

console.log('Attempting to connect to Python REPL server...');

const ws = new WebSocket('ws://localhost:3010');

ws.on('open', () => {
  console.log('Successfully connected to Python REPL server!');
  
  // Send a simple Python command
  ws.send(JSON.stringify({
    type: 'input',
    data: 'print("Hello from test script!")\r'
  }));
  
  // Wait a bit then send another command
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'input',
      data: 'import sys; print(f"Python version: {sys.version}")\r'
    }));
  }, 1000);
});

ws.on('message', (data) => {
  try {
    const parsed = JSON.parse(data);
    console.log('Received:', parsed.data);
  } catch (e) {
    console.log('Received raw data:', data);
  }
});

ws.on('error', (error) => {
  console.error('Connection error:', error.message);
});

ws.on('close', () => {
  console.log('Connection closed');
});

// Keep the script running for a while
setTimeout(() => {
  console.log('Test complete, closing connection');
  ws.close();
  process.exit(0);
}, 5000);
