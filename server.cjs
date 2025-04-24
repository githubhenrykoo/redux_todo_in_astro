const express = require('express');
const app = express();

// Use dynamic import for ES modules
let handler;
import('./server/entry.mjs').then(module => {
  handler = module.default;
  
  app.use(express.json());
  app.all('*', async (req, res) => {
    try {
      const result = await handler(req);
      res.status(result.status).set(result.headers).end(result.body);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to load handler:', err);
  process.exit(1);
});
