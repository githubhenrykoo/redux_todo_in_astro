// Simple test for Python server
import { WebSocket } from 'ws';

// Connect to the server 
console.log('Connecting to Python server...');
const ws = new WebSocket('ws://localhost:3010');

ws.on('open', function open() {
  console.log('Connected!');
  
  // Send a simple Python command
  setTimeout(() => {
    const command = 'print("Hello from Python test")';
    console.log(`Sending: ${command}`);
    ws.send(JSON.stringify({
      type: 'input',
      data: command + '\n'
    }));
  }, 500);
});

ws.on('message', function message(data) {
  try {
    const parsed = JSON.parse(data);
    console.log('Received:', parsed);
  } catch (e) {
    console.log('Raw message:', data.toString());
  }
});

ws.on('error', console.error);

// Keep the process running for a bit
setTimeout(() => process.exit(0), 3000);
