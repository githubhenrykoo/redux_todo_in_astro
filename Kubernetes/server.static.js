// Pure static server with no dependencies on Astro handlers
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Log the environment for debugging
console.log("Starting pure static server...");
console.log("Current directory:", process.cwd());
console.log("Directory listing:", fs.readdirSync(process.cwd()));

// MIME type map for common file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain'
};

// Check for output directories
let staticPath = './public';
if (fs.existsSync('./output/static')) {
  staticPath = './output/static';
  console.log("Found ./output/static directory");
  console.log("Static files:", fs.readdirSync('./output/static'));
}

// Welcome page HTML
const welcomeHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redux Todo in Astro</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
    .welcome { text-align: center; }
    .btn { display: inline-block; background: #0072ff; color: white; padding: 10px 20px; 
           text-decoration: none; border-radius: 4px; margin: 20px 10px; }
    .panel { margin-top: 40px; background: #f9f9f9; padding: 20px; border-radius: 8px; }
    pre { background: #eee; padding: 15px; border-radius: 4px; overflow-x: auto; }
    h1 { color: #222; }
    p { color: #444; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="welcome">
    <h1>Redux Todo in Astro</h1>
    <p>Kubernetes Static Deployment</p>
    
    <div>
      <a href="/page" class="btn">Todo App</a>
      <a href="/resizablepage" class="btn">Resizable Page</a>
      <a href="/communication" class="btn">Communication</a>
    </div>
  </div>
  
  <div class="panel">
    <h2>About this deployment</h2>
    <p>This is a static deployment of the Redux Todo application in Kubernetes. The application 
       is built with Astro and uses a custom static server to avoid router configuration issues.</p>
    
    <h3>Environment Info:</h3>
    <pre id="server-info"></pre>
  </div>

  <script>
    // Display some useful information about the environment
    const serverInfo = {
      url: window.location.href,
      path: window.location.pathname,
      timestamp: new Date().toISOString()
    };
    document.getElementById('server-info').textContent = JSON.stringify(serverInfo, null, 2);
  </script>
</body>
</html>
`;

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`Request for: ${req.url}`);
  
  // Parse URL to get the pathname
  let pathname = req.url;
  
  // Remove query string if present
  if (pathname.includes('?')) {
    pathname = pathname.split('?')[0];
  }
  
  // Special case for favicon
  if (pathname === '/favicon.ico') {
    if (fs.existsSync('./public/favicon.svg')) {
      serveFile('./public/favicon.svg', res);
      return;
    } else if (fs.existsSync('./dist/favicon.svg')) {
      serveFile('./dist/favicon.svg', res);
      return;
    } else {
      res.writeHead(404);
      res.end();
      return;
    }
  }
  
  // For root path, serve welcome page
  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(welcomeHtml);
    return;
  }
  
  // For any non-file paths, serve welcome page (SPA behavior)
  if (!pathname.includes('.')) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(welcomeHtml);
    return;
  }
  
  // Try to find the requested file
  let filePath = path.join(staticPath, pathname);
  
  // Check if file exists in the static path
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveFile(filePath, res);
    return;
  }
  
  // If not in static path, try alternative locations
  const altPaths = [
    path.join('./public', pathname),
    path.join('./dist', pathname),
    path.join('./dist/_astro', pathname),
    path.join('./dist/pages', pathname)
  ];
  
  for (const altPath of altPaths) {
    if (fs.existsSync(altPath) && fs.statSync(altPath).isFile()) {
      serveFile(altPath, res);
      return;
    }
  }
  
  // File not found, serve 404
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>404 - Not Found</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
        .error { text-align: center; margin-top: 50px; }
        .btn { display: inline-block; background: #0072ff; color: white; padding: 10px 20px; 
                text-decoration: none; border-radius: 4px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="error">
        <h1>404 - File Not Found</h1>
        <p>The requested file ${pathname} could not be found.</p>
        <a href="/" class="btn">Go to Home Page</a>
      </div>
    </body>
    </html>
  `);
});

// Helper function to serve a file
function serveFile(filePath, res) {
  try {
    const content = fs.readFileSync(filePath);
    const extname = path.extname(filePath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
    console.log(`Successfully served file: ${filePath}`);
  } catch (e) {
    console.error(`Error serving file ${filePath}:`, e);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Static server running on port ${PORT}`);
});
