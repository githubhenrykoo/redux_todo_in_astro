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

const PORT = 3011; // Changed from 3010 to avoid conflict

// Set up Python interpreter
const shell = platform() === 'win32' ? 'powershell.exe' : 'python3';
const pythonArgs = platform() === 'win32' ? ['-Command', 'python'] : [];

// Store active sessions
const sessions = new Map();

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Create PTY process for Python
  const ptyProcess = pty.spawn(shell, pythonArgs, {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.cwd(),
    env: process.env
  });
  
  const sessionId = Date.now().toString();
  sessions.set(sessionId, { ptyProcess, ws });
  
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
        let input = parsedMessage.data;
        
        // Prevent exit commands to keep the REPL alive
        if (input.trim().toLowerCase() === 'exit()' || 
            input.trim().toLowerCase() === 'quit()' || 
            input.trim().toLowerCase() === 'sys.exit()') {
          
          ws.send(JSON.stringify({
            type: 'output',
            data: '\r\n[Exit command blocked to keep REPL session alive]\r\n>>> '
          }));
          return;
        }
        
        // Send input to PTY
        ptyProcess.write(input);
      } else if (parsedMessage.type === 'resize') {
        // Handle terminal resize
        ptyProcess.resize(parsedMessage.cols, parsedMessage.rows);
      }
    } catch (err) {
      console.error('Error processing message:', err);
    }
  });
  
  // Clean up on close
  ws.on('close', () => {
    console.log('Client disconnected');
    if (sessions.has(sessionId)) {
      const session = sessions.get(sessionId);
      session.ptyProcess.kill();
      sessions.delete(sessionId);
    }
  });
  
  // Send session ID to client
  ws.send(JSON.stringify({
    type: 'session',
    id: sessionId
  }));
});

// Start server
server.listen(PORT, () => {
  console.log(`Python REPL server running on port ${PORT}`);
});
