const express = require('express');
const app = express();
const { default: handler } = require('./server/entry.mjs');

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
