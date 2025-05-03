// Simple test client for Python server
import WebSocket from 'ws';

// Connect to the Python REPL server
const ws = new WebSocket('ws://localhost:3010');

ws.on('open', () => {
  console.log('Connected to Python REPL server');
  
  // First, test if Python is ready
  sendCommand('print("PYTHON_READY_TEST")');
  
  // Then, after a delay, try a simple script
  setTimeout(() => {
    console.log('Sending test script...');
    sendCommand(`
print("Hello from test script!")
for i in range(3):
    print(f"Count: {i}")
print("Done!")
`);
  }, 1000);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    if (message.type === 'output') {
      console.log('OUTPUT:', message.data);
    }
  } catch (err) {
    console.error('Error parsing message:', err);
    console.log('Raw data:', data);
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('Connection closed');
});

function sendCommand(command) {
  ws.send(JSON.stringify({
    type: 'input',
    data: command + '\n'
  }));
}

// Keep the process running
setTimeout(() => {
  console.log('Test complete');
  process.exit(0);
}, 5000);
