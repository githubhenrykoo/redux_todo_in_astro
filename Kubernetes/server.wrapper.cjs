const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

console.log("Starting wrapper server...");
console.log("Current directory:", process.cwd());
console.log("Directory listing:", fs.readdirSync(process.cwd()));

// Try different server entry points
const possibleEntryPoints = [
  './output/functions/_render.func/server/entry.mjs',
  './server/entry.mjs',
  './output/server/entry.mjs'
];

let handlerLoaded = false;

// Serve static assets if they exist
if (fs.existsSync('./output/static')) {
  console.log("Serving static assets from ./output/static");
  app.use(express.static('./output/static'));
}

// Static fallback page in case the handler fails
const fallbackPage = `
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
    pre { background: #f1f1f1; padding: 1rem; overflow-x: auto; }
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
    <pre id="server-info"></pre>
    <script>
      document.getElementById('server-info').textContent = 
        JSON.stringify({
          url: window.location.href,
          path: window.location.pathname,
          userAgent: navigator.userAgent
        }, null, 2);
    </script>
  </div>
</body>
</html>
`;

// Try to load the handler from different entry points
async function loadHandler() {
  for (const entryPoint of possibleEntryPoints) {
    try {
      if (fs.existsSync(entryPoint)) {
        console.log(`Attempting to load handler from: ${entryPoint}`);
        const module = await import(entryPoint);
        console.log("Handler loaded successfully!");
        handlerLoaded = true;
        return module.default;
      }
    } catch (err) {
      console.error(`Error loading handler from ${entryPoint}:`, err);
    }
  }
  console.warn("Could not load any handler, falling back to static mode");
  return null;
}

// Set up routes
async function setupServer() {
  try {
    const handler = await loadHandler();
    
    app.use(express.json());
    
    // If handler loaded successfully, use it for all routes
    if (handler) {
      app.all('*', async (req, res) => {
        try {
          // Intercept routes that might cause path-to-regexp errors
          if (req.path.includes('https://git.new/')) {
            console.log(`Intercepted problematic path: ${req.path}`);
            return res.send(fallbackPage);
          }
          
          console.log(`Processing request for: ${req.path}`);
          const result = await handler(req);
          res.status(result.status || 200)
             .set(result.headers || {})
             .end(result.body);
        } catch (error) {
          console.error("Handler error:", error);
          res.send(fallbackPage);
        }
      });
    } else {
      // Fallback to serving static welcome page
      app.all('*', (req, res) => {
        res.send(fallbackPage);
      });
    }

    // Start the server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      if (handlerLoaded) {
        console.log("Running in SSR mode with handler");
      } else {
        console.log("Running in static fallback mode");
      }
    });
  } catch (err) {
    console.error('Fatal error setting up server:', err);
    process.exit(1);
  }
}

// Initialize the server
setupServer();
