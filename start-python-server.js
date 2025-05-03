// Simple Python server for script execution
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import * as pty from 'node-pty';
import { platform } from 'os';

// Create Express app
const app = express();
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

const PORT = 3010; // Use port 3010 consistently

// Set up Python interpreter
const shell = platform() === 'win32' ? 'powershell.exe' : 'python3';
const pythonArgs = platform() === 'win32' ? [] : ['-i']; // Use interactive mode

// Add health check endpoint
app.get('/health', (req, res) => {
  res.send({ status: 'ok', uptime: process.uptime() });
});

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Python client connected');
  
  // Create PTY process for Python
  const ptyProcess = pty.spawn(shell, pythonArgs, {
    name: 'xterm-color',
    cols: 120,
    rows: 40,
    cwd: process.cwd(),
    env: process.env
  });
  
  // Send output from PTY to WebSocket
  ptyProcess.onData(data => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'output',
        data: data
      }));
    }
  });
  
  // Handle messages from WebSocket client
  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      
      if (parsedMessage.type === 'input') {
        // Send input to PTY
        ptyProcess.write(parsedMessage.data);
      }
    } catch (err) {
      console.error('Error processing message:', err);
    }
  });
  
  // Clean up on close
  ws.on('close', () => {
    console.log('Python client disconnected');
    try {
      ptyProcess.kill();
      console.log('Python process terminated');
    } catch (e) {
      console.error('Error killing Python process:', e);
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Python REPL server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}/health to check server status`);
});
