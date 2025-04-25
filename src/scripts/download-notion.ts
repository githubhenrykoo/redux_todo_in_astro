import { NotionMCP } from '../mcp/notion-mcp.js';  // Note the .js extension
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  try {
    const outputDir = process.env.NOTION_OUTPUT_DIR || 'docs/notion';
    const notionMcp = new NotionMCP(outputDir);
    
    // Check if a specific page ID was provided
    const pageId = process.env.NOTION_PAGE_ID;
    if (pageId) {
      console.log(`Downloading Notion page ${pageId}...`);
      await notionMcp.downloadPage(pageId);
      console.log('Page downloaded successfully!');
      return;
    }
    
    // Otherwise, download the entire database
    console.log('Downloading all pages from Notion database...');
    const documents = await notionMcp.downloadDatabase();
    console.log(`Downloaded ${documents.length} pages successfully!`);
  } catch (error) {
    console.error('Error downloading Notion content:', error);
    process.exit(1);
  }
}

main();