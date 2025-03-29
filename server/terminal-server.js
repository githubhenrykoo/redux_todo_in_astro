const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');
const cors = require('cors');
const pty = require('node-pty');

// Create express app and HTTP server
const app = express();
app.use(cors());
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Use node-pty to create a pseudo-terminal
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: {
      ...process.env,
      TERM: 'xterm-256color' // Important for TUI apps like Lazygit
    }
  });

  // Handle data from pty process
  ptyProcess.onData(data => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ 
        type: 'output', 
        data: data 
      }));
    }
  });

  // Handle messages from client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'input') {
        // Send input directly to the pty process
        ptyProcess.write(data.data);
      } else if (data.type === 'resize') {
        // Handle terminal resize events
        if (data.cols && data.rows) {
          ptyProcess.resize(data.cols, data.rows);
        }
      }
    } catch (err) {
      console.error('Error processing message:', err);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log('Client disconnected');
    ptyProcess.kill();
  });

  // Handle process exit
  ptyProcess.onExit(({ exitCode, signal }) => {
    console.log(`Terminal process exited with code ${exitCode} and signal ${signal}`);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ 
        type: 'output', 
        data: `\nProcess exited with code ${exitCode}. Reconnecting...\n` 
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