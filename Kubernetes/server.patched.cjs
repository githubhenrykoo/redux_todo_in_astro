// Hybrid server for SSR Astro app
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 3000;

// Log the environment
console.log('Starting hybrid server...');
console.log('Current directory:', process.cwd());
console.log('Directory contents:', fs.readdirSync(process.cwd()));

// Create temporary index.html for static serving
const createStaticIndex = () => {
  const staticIndexPath = path.join(process.cwd(), 'output/static/index.html');
  const indexContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redux Todo in Astro</title>
  <!-- Load static assets from _astro -->
  <link rel="stylesheet" href="/_astro/Page.4LUmXqNk.css">
  <link rel="stylesheet" href="/_astro/resizablePage.Cz4Ll3ez.css">
  <!-- PWA support -->
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <script src="/registerSW.js"></script>
</head>
<body>
  <div id="app">
    <h1>Redux Todo in Astro</h1>
    <p>Loading application... If this message persists, the SSR handler is not working properly.</p>
    <p>Try loading client-side JS:</p>
    <div id="root"></div>
  </div>

  <!-- Load main client JS bundles -->
  <script type="module" src="/_astro/client.CCosssjk.js"></script>
  <script type="module" src="/_astro/index.CpAdoJIP.js"></script>
  <script type="module" src="/_astro/PanelSystem.BQgzsgwz.js"></script>
  <script>
    // Attempt to initialize the client-side app
    window.addEventListener('DOMContentLoaded', () => {
      console.log('Application initialized in static fallback mode');
    });
  </script>
</body>
</html>
  `;

  try {
    fs.writeFileSync(staticIndexPath, indexContent);
    console.log(`Created fallback index.html at ${staticIndexPath}`);
    return true;
  } catch (err) {
    console.error(`Failed to create fallback index.html: ${err.message}`);
    return false;
  }
};

// Try to create a fallback index.html
createStaticIndex();

// Check and log what directories exist
const possibleDirs = [
  '/app/output',
  '/app/output/static',
  '/app/output/static/_astro',
  '/app/server',
  '/app/server/pages'
];

possibleDirs.forEach(dir => {
  console.log(`Directory ${dir} exists:`, fs.existsSync(dir));
  if (fs.existsSync(dir)) {
    console.log(`Contents of ${dir}:`, fs.readdirSync(dir));
  }
});

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.url}`);
  
  // Static file handling
  const handleStaticFile = () => {
    // For root or index requests, serve our fallback index.html
    let filePath;
    if (req.url === '/' || req.url === '/index.html') {
      filePath = path.join(process.cwd(), 'output/static/index.html');
      
      if (!fs.existsSync(filePath)) {
        // If we don't have a fallback, create one
        if (createStaticIndex()) {
          console.log(`Created and serving fallback index from ${filePath}`);
        } else {
          // If we can't create a fallback, show diagnostic page
          serveErrorPage();
          return;
        }
      }
    } else {
      // For other static assets, check multiple locations
      const possiblePaths = [
        path.join(process.cwd(), 'output/static', req.url),
        path.join(process.cwd(), 'output/static/_astro', req.url),
        path.join(process.cwd(), 'output', req.url),
        path.join(process.cwd(), 'public', req.url)
      ];
      
      let found = false;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
          filePath = testPath;
          found = true;
          break;
        }
      }
      
      if (!found) {
        // If it's an API request, try to proxy it later
        if (req.url.startsWith('/api/')) {
          serveErrorPage(404, 'API endpoint not available in static mode');
          return;
        }
        
        // For other paths that might be app routes, serve index.html
        if (!req.url.includes('.')) {
          filePath = path.join(process.cwd(), 'output/static/index.html');
          if (!fs.existsSync(filePath)) {
            createStaticIndex();
          }
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
      }
    }
    
    // Serve the static file
    serveFile(filePath);
  };
  
  // Helper to serve a file with correct content type
  const serveFile = (filePath) => {
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
      case '.js': contentType = 'text/javascript'; break;
      case '.mjs': contentType = 'text/javascript'; break;
      case '.css': contentType = 'text/css'; break;
      case '.json': contentType = 'application/json'; break;
      case '.png': contentType = 'image/png'; break;
      case '.jpg': contentType = 'image/jpg'; break;
      case '.svg': contentType = 'image/svg+xml'; break;
      case '.webmanifest': contentType = 'application/manifest+json'; break;
    }
    
    // Read and serve the file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end(`Server Error: ${err.message}`);
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      }
    });
  };
  
  // Helper to serve error diagnostic page
  const serveErrorPage = (status = 200, message = 'The application is running but no index.html was found') => {
    res.writeHead(status, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redux Todo in Astro</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
            pre { background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow: auto; }
          </style>
        </head>
        <body>
          <h1>Redux Todo in Astro</h1>
          <p>${message}</p>
          <h2>Environment Information:</h2>
          <pre>${JSON.stringify({
            'Current Directory': process.cwd(),
            'NODE_ENV': process.env.NODE_ENV,
            'Server Directories': possibleDirs.map(dir => ({
              path: dir,
              exists: fs.existsSync(dir),
              contents: fs.existsSync(dir) ? fs.readdirSync(dir).slice(0, 10) : 'N/A'
            })),
            'Request URL': req.url
          }, null, 2)}</pre>
        </body>
      </html>
    `);
  };
  
  // Handle the request using static approach
  handleStaticFile();
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Hybrid server running on port ${PORT}`);
});
