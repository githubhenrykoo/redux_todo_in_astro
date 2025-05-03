// Direct execution test for Python scripts
import WebSocket from 'ws';

// Create a WebSocket connection to the Python server
const ws = new WebSocket('ws://localhost:3010');

// Sample script to execute
const script = `
print("Hello, World!")
name = "Python User"
print(f"Nice to meet you, {name}!")
print("\\nHere's a small countdown:")
for i in range(5, 0, -1):
    print(f"  {i}...")
print("Blast off! 🚀")
`;

// Track if Python has started
let pythonStarted = false;

ws.on('open', () => {
  console.log('Connected to Python server');
  
  // Send newline to check environment
  ws.send(JSON.stringify({ type: 'input', data: '\n' }));
});

ws.on('message', (message) => {
  try {
    const data = JSON.parse(message);
    
    if (data.type === 'output') {
      const output = data.data.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
      console.log('Output received:', output);
      
      // Check if we're in Python
      if (!pythonStarted && output.includes('Python 3')) {
        pythonStarted = true;
        console.log('Python detected, executing script...');
        
        // Execute the script directly
        setTimeout(() => {
          ws.send(JSON.stringify({ 
            type: 'input', 
            data: script 
          }));
        }, 500);
      } else if (!pythonStarted && (output.includes('.venv') || output.includes('bash'))) {
        // Launch Python if we're in a shell
        console.log('Shell detected, starting Python...');
        ws.send(JSON.stringify({ 
          type: 'input', 
          data: 'python3\n' 
        }));
      }
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Keep the process alive for a bit
setTimeout(() => {
  console.log('Test complete, closing connection');
  ws.close();
  process.exit(0);
}, 10000);

console.log('Running direct execution test...');
