const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = 8080;
const HOST = '0.0.0.0'; // Binds to all network interfaces
const DASHBOARD_FILE = path.join(__dirname, 'mqtt_dashboard_darkmode_energypro_fixed.html');

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  // Only serve the dashboard file for all requests
  fs.readFile(DASHBOARD_FILE, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end(`Error loading dashboard: ${err.message}`);
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(content, 'utf-8');
  });
});

// Start the server
server.listen(PORT, HOST, () => {
  console.log(`MQTT Dashboard server running at http://${HOST}:${PORT}/`);
  console.log('Available on:');
  console.log(`- Local: http://localhost:${PORT}/`);
  
  // Show all network interfaces for convenience
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal and non-IPv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`- Network: http://${net.address}:${PORT}/`);
      }
    }
  }
});
