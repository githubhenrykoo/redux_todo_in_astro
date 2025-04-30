// Ultra-minimal HTTP server using ONLY Node.js built-in modules
// No external dependencies to avoid path-to-regexp errors
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Log the environment for debugging
console.log("Starting minimal server...");
console.log("Current directory:", process.cwd());
console.log("Directory listing:", fs.readdirSync(process.cwd()));

// Check for dist directory
if (fs.existsSync("./dist")) {
  console.log("Dist directory contents:", fs.readdirSync("./dist"));
  if (fs.existsSync("./dist/pages")) {
    console.log("Pages directory contents:", fs.readdirSync("./dist/pages"));
  }
}

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

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`Request for: ${req.url}`);
  
  // Parse URL to get the pathname
  let pathname = req.url;
  
  // Remove query string if present
  if (pathname.includes('?')) {
    pathname = pathname.split('?')[0];
  }
  
  // For root requests, always serve our welcome page
  if (pathname === '/') {
    serveWelcomePage(req, res);
    return;
  }
  
  // Try to find the requested file in various locations
  const possiblePaths = [
    path.join(process.cwd(), 'dist', pathname),
    path.join(process.cwd(), 'dist/_astro', pathname),
    path.join(process.cwd(), 'dist/pages', pathname),
    path.join(process.cwd(), 'dist/static', pathname),
    path.join(process.cwd(), 'dist/static/_astro', pathname),
    path.join(process.cwd(), 'public', pathname)
  ];
  
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      console.log(`Found file at ${filePath}`);
      serveFile(filePath, res);
      return;
    }
  }
  
  // If request is for /Page or another Astro route, serve the welcome page
  if (!pathname.includes('.')) {
    console.log(`Serving welcome page for route: ${pathname}`);
    serveWelcomePage(req, res);
    return;
  }
  
  // If all else fails, return 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

// Helper function to serve a file
function serveFile(filePath, res) {
  const extname = path.extname(filePath);
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (e) {
    console.error('Error reading file:', e);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('500 Internal Server Error');
  }
}

// Helper function to serve a welcome page with debug info
function serveWelcomePage(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Redux Todo in Astro</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
        .welcome { text-align: center; }
        a.btn { display: inline-block; background: #0072ff; color: white; padding: 10px 20px; 
                text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .nav { margin-top: 30px; display: flex; justify-content: center; gap: 15px; }
      </style>
    </head>
    <body>
      <div class="welcome">
        <h1>Welcome to Redux Todo in Astro</h1>
        <p>Your application is running in Kubernetes!</p>
        
        <div class="nav">
          <a href="/page" class="btn">Go to Page</a>
          <a href="/resizablepage" class="btn">Resizable Page</a>
          <a href="/urlresiablepage" class="btn">URL Resizable Page</a>
        </div>
      </div>
      <div>
        <h3>Server Information:</h3>
        <pre>${JSON.stringify({
          currentDirectory: process.cwd(),
          directoryContents: fs.readdirSync(process.cwd()),
          distExists: fs.existsSync("./dist"),
          distContents: fs.existsSync("./dist") ? fs.readdirSync("./dist") : "Not found",
          pagesExists: fs.existsSync("./dist/pages"),
          pagesContents: fs.existsSync("./dist/pages") ? fs.readdirSync("./dist/pages") : "Not found",
          publicExists: fs.existsSync("./public"),
          publicContents: fs.existsSync("./public") ? fs.readdirSync("./public") : "Not found",
          requestUrl: req.url
        }, null, 2)}</pre>
      </div>
    </body>
    </html>
  `);
}

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Minimal HTTP server running on port ${PORT}`);
});
