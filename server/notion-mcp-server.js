const express = require('express');
const { Client } = require('@notionhq/client');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Validate environment variables
if (!process.env.NOTION_API_KEY) {
  console.error('NOTION_API_KEY is not set in environment variables');
  process.exit(1);
}

if (!process.env.NOTION_DATABASE_ID) {
  console.error('NOTION_DATABASE_ID is not set in environment variables');
  process.exit(1);
}

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY.trim()
});

const databaseId = process.env.NOTION_DATABASE_ID.trim();

// Verify API token on startup
async function verifyNotionAccess() {
  try {
    await notion.users.me();
    console.log('Notion API token verified successfully');
    return true;
  } catch (error) {
    console.error('Notion API token verification failed:', error.message);
    return false;
  }
}

// Health check endpoint with API token verification
app.get('/health', async (req, res) => {
  const isValid = await verifyNotionAccess();
  if (isValid) {
    res.json({ status: 'ok' });
  } else {
    res.status(401).json({ 
      status: 'error',
      error: 'Invalid Notion API token'
    });
  }
});

// Download database endpoint
app.post('/sync/database', async (req, res) => {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [{ property: 'Created', direction: 'descending' }]
    });
    res.json({ success: true, documents: response.results });
  } catch (error) {
    console.error('Error downloading database:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to download database' 
    });
  }
});

// Download specific page endpoint
app.post('/sync/page/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    const page = await notion.pages.retrieve({ page_id: pageId });
    const blocks = await notion.blocks.children.list({ block_id: pageId });
    
    res.json({ 
      success: true, 
      document: { page, blocks: blocks.results } 
    });
  } catch (error) {
    console.error('Error downloading page:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to download page' 
    });
  }
});

// Start server
const PORT = process.env.NOTION_PORT || 3002;
app.listen(PORT, () => {
  console.log(`Notion MCP Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}/health to check server status`);
});