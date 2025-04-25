import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

export class NotionMCP {
  private notion: Client;
  private databaseId: string;

  constructor() {
    this.notion = new Client({
      auth: process.env.NOTION_API_KEY
    });
    this.databaseId = process.env.NOTION_DATABASE_ID || '';
  }

  async downloadDatabase() {
    try {
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        sorts: [{ property: 'Created', direction: 'descending' }]
      });
      return response.results;
    } catch (error) {
      console.error('Error downloading database:', error);
      throw error;
    }
  }

  async downloadPage(pageId: string) {
    try {
      const page = await this.notion.pages.retrieve({ page_id: pageId });
      const blocks = await this.notion.blocks.children.list({ block_id: pageId });
      return { page, blocks: blocks.results };
    } catch (error) {
      console.error('Error downloading page:', error);
      throw error;
    }
  }
}