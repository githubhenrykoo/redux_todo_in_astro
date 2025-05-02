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
  console.log('Python client connected');
  
  // Use node-pty to create a pseudo-console specifically for Python
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: {
      ...process.env,
      TERM: 'xterm-256color'
    }
  });

  // Start Python REPL immediately
  setTimeout(() => {
    ptyProcess.write('python3\r');
  }, 500);

  // Handle data from pty process
  ptyProcess.onData(data => {
    if (ws.readyState === WebSocket.OPEN) {
      // Check if Python is trying to exit
      if (data.includes('exit()') || data.includes('quit()') || data.includes('sys.exit')) {
        // If Python somehow exited, restart it
        setTimeout(() => {
          ptyProcess.write('python3\r');
        }, 100);
      }
      
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
        // Check for exit commands and block them
        if (data.data.includes('exit()') || data.data.includes('quit()') || data.data.includes('sys.exit')) {
          ws.send(JSON.stringify({
            type: 'output',
            data: '\r\n\x1b[33mExit command blocked. This Python console cannot be closed.\x1b[0m\r\n>>> '
          }));
          return;
        }
        
        // Send input directly to the pty process
        ptyProcess.write(data.data);
      } else if (data.type === 'resize') {
        // Handle console resize events
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
    console.log('Python client disconnected');
    ptyProcess.kill();
  });

  // Handle process exit
  ptyProcess.onExit(({ exitCode, signal }) => {
    console.log(`Python process exited with code ${exitCode} and signal ${signal}`);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ 
        type: 'output', 
        data: `\nPython process exited with code ${exitCode}. Restarting Python...\n` 
      }));
      
      // Restart Python REPL
      setTimeout(() => {
        ptyProcess.write('python3\r');
      }, 500);
    }
  });

  // Send initial message
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ 
      type: 'output', 
      data: 'Initializing Python REPL...\r\n' 
    }));
  }
});

// Add a simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Python REPL server is running');
});

// Start server
const PORT = process.env.PORT || 3010;
server.listen(PORT, () => {
  console.log(`Python REPL server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}/health to check server status`);
});