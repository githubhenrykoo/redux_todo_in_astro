const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

// Log the environment for debugging
console.log("Starting fixed server...");
console.log("Current directory:", process.cwd());
console.log("Directory listing:", fs.readdirSync(process.cwd()));

// Check for dist directory
if (fs.existsSync("./dist")) {
  console.log("Dist directory contents:", fs.readdirSync("./dist"));
}

// Serve static files from various possible locations
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "dist")));
if (fs.existsSync("./dist/client")) {
  app.use(express.static(path.join(__dirname, "dist/client")));
}

// All routes fallback to index
app.get("*", (req, res) => {
  console.log(`Request for: ${req.url}`);
  
  // Try to find an index.html file in various locations
  const possibleIndexPaths = [
    path.join(__dirname, "dist/client/index.html"),
    path.join(__dirname, "dist/index.html"),
    path.join(__dirname, "dist/static/index.html"),
    path.join(__dirname, "public/index.html")
  ];
  
  // Try to serve from one of the possible index locations
  for (const indexPath of possibleIndexPaths) {
    if (fs.existsSync(indexPath)) {
      console.log(`Serving index from ${indexPath}`);
      return res.sendFile(indexPath);
    }
  }
  
  // If no index.html is found, dynamically generate one
  res.send(`
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
      </style>
    </head>
    <body>
      <div class="welcome">
        <h1>Welcome to Redux Todo in Astro</h1>
        <p>Your application is running in Kubernetes!</p>
        <a href="/Page" class="btn">Enter Application</a>
      </div>
      <div>
        <h3>Server Information:</h3>
        <pre>${JSON.stringify({
          currentDirectory: process.cwd(),
          directoryContents: fs.readdirSync(process.cwd()),
          distExists: fs.existsSync("./dist"),
          distContents: fs.existsSync("./dist") ? fs.readdirSync("./dist") : "Not found",
          publicExists: fs.existsSync("./public"),
          publicContents: fs.existsSync("./public") ? fs.readdirSync("./public") : "Not found",
          requestUrl: req.url
        }, null, 2)}</pre>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
