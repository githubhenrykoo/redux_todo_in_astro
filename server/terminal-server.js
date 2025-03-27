const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');
const cors = require('cors');

// Create express app and HTTP server
const app = express();
app.use(cors());
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Create shell process
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
  const shellProcess = spawn(shell, [], {
    cwd: process.env.HOME,
    env: process.env,
    shell: true
  });

  // Handle data from shell process
  shellProcess.stdout.on('data', (data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ 
        type: 'output', 
        data: data.toString() 
      }));
    }
  });

  shellProcess.stderr.on('data', (data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ 
        type: 'output', 
        data: data.toString() 
      }));
    }
  });

  // Handle messages from client
  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      
      if (parsedMessage.type === 'input' && parsedMessage.data) {
        shellProcess.stdin.write(parsedMessage.data);
      }
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log('Client disconnected');
    shellProcess.kill();
  });

  // Handle process exit
  shellProcess.on('exit', (code) => {
    console.log(`Shell process exited with code ${code}`);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ 
        type: 'output', 
        data: `\nProcess exited with code ${code}. Reconnecting...\n` 
      }));
    }
  });

  // Send initial message
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ 
      type: 'output', 
      data: 'Terminal session started. Type commands below.\n' 
    }));
  }
});

// Add a simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Terminal server is running');
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Terminal server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}/health to check server status`);
});