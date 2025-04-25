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
    // First, retrieve the database structure
    const database = await notion.databases.retrieve({
      database_id: databaseId
    });

    // Then query the database without assuming specific properties
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 100
    });

    // Transform the results to include table data
    const documents = await Promise.all(response.results.map(async (page) => {
      // Get page blocks to find tables
      const blocks = await notion.blocks.children.list({
        block_id: page.id,
        page_size: 100
      });

      const tables = [];
      for (const block of blocks.results) {
        if (block.type === 'table') {
          const tableRows = await notion.blocks.children.list({
            block_id: block.id,
            page_size: 100
          });
          
          tables.push({
            id: block.id,
            rows: tableRows.results.map(row => ({
              cells: row.table_row.cells
            }))
          });
        }
      }

      return {
        id: page.id,
        title: page.properties?.title?.title?.[0]?.plain_text || 'Untitled',
        tables,
        lastEdited: page.last_edited_time
      };
    }));

    res.json({ 
      success: true, 
      documents,
      database: {
        id: database.id,
        title: database.title?.[0]?.plain_text || 'Untitled Database'
      }
    });
  } catch (error) {
    console.error('Database sync error:', {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details
    });
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to sync database',
      details: error.code || 'Unknown error code'
    });
  }
});

// Download specific page endpoint
app.post('/sync/page/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    const page = await notion.pages.retrieve({ page_id: pageId });
    const blocks = await notion.blocks.children.list({ 
      block_id: pageId,
      page_size: 100
    });
    
    // Get all tables, descriptions, and subheadings from the page
    const tables = [];
    const descriptions = [];
    const subheadings = [];
    
    for (const block of blocks.results) {
      if (block.type === 'table') {
        // Get table rows
        const tableRows = await notion.blocks.children.list({
          block_id: block.id,
          page_size: 100
        });
        
        tables.push({
          id: block.id,
          rows: tableRows.results.map(row => ({
            cells: row.table_row.cells
          }))
        });
      } else if (block.type === 'paragraph') {
        // Collect descriptions (paragraphs)
        const text = block.paragraph.rich_text
          .map(t => t.plain_text)
          .join('');
        if (text.trim()) {
          descriptions.push({
            id: block.id,
            content: text
          });
        }
      } else if (block.type === 'heading_1' || block.type === 'heading_2' || block.type === 'heading_3') {
        const text = block[block.type].rich_text
          .map(t => t.plain_text)
          .join('');
        if (text.trim()) {
          subheadings.push({
            id: block.id,
            content: text,
            level: parseInt(block.type.slice(-1))
          });
        }
      }
    }
    
    res.json({ 
      success: true, 
      document: {
        page,
        tables,
        descriptions,
        subheadings,
        blocks: blocks.results
      }
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