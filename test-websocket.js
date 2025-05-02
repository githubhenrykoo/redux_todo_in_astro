// Simple WebSocket client to test the Python server
import WebSocket from 'ws';

console.log('Connecting to Python server...');
const ws = new WebSocket('ws://localhost:3010');

ws.on('open', function open() {
  console.log('Connected to Python server');
  
  // Test with a simple print statement
  console.log('Sending test command...');
  ws.send(JSON.stringify({
    type: 'input',
    data: 'print("Hello from test script!")\n'
  }));
  
  // Send a simple Python script
  setTimeout(() => {
    console.log('Sending sample Python code...');
    const sampleScript = `
print("Running sample script")
for i in range(5, 0, -1):
    print(f"  {i}...")
print("Blast off! 🚀")
`;
    
    ws.send(JSON.stringify({
      type: 'input',
      data: sampleScript + '\n'
    }));
    
    // Close after a delay
    setTimeout(() => {
      console.log('Test complete, closing connection');
      ws.close();
    }, 3000);
  }, 1000);
});

ws.on('message', function incoming(data) {
  try {
    const message = JSON.parse(data);
    if (message.type === 'output') {
      console.log('PYTHON OUTPUT:', message.data);
    } else {
      console.log('OTHER MESSAGE:', message);
    }
  } catch (e) {
    console.log('RAW MESSAGE:', data);
  }
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err);
});

ws.on('close', function close() {
  console.log('Connection closed');
});
