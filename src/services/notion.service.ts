import { Client } from '@notionhq/client';
import { notionConfig, validateNotionConfig } from '../config/notion.config';
import fs from 'fs';
import path from 'path';

export class NotionService {
  private client: Client;
  
  constructor() {
    if (!validateNotionConfig()) {
      throw new Error('Invalid Notion configuration');
    }
    
    this.client = new Client({
      auth: notionConfig.apiKey,
    });
  }
  
  /**
   * Fetch a page from Notion by ID
   */
  async getPage(pageId: string) {
    try {
      return await this.client.pages.retrieve({ page_id: pageId });
    } catch (error) {
      console.error('Failed to fetch Notion page:', error);
      throw error;
    }
  }
  
  /**
   * Fetch blocks (content) of a page
   */
  async getPageContent(pageId: string) {
    try {
      const response = await this.client.blocks.children.list({
        block_id: pageId,
        page_size: 100,
      });
      return response.results;
    } catch (error) {
      console.error('Failed to fetch Notion page content:', error);
      throw error;
    }
  }
  
  /**
   * Fetch all pages from a database
   */
  async getPagesFromDatabase(databaseId: string = notionConfig.databaseId) {
    if (!databaseId) {
      throw new Error('Database ID is required');
    }
    
    try {
      const response = await this.client.databases.query({
        database_id: databaseId,
      });
      return response.results;
    } catch (error) {
      console.error('Failed to fetch pages from database:', error);
      throw error;
    }
  }
  
  /**
   * Convert Notion blocks to Markdown
   */
  convertToMarkdown(blocks: any[]): string {
    let markdown = '';
    
    for (const block of blocks) {
      switch (block.type) {
        case 'paragraph':
          markdown += this.extractTextContent(block.paragraph) + '\n\n';
          break;
        case 'heading_1':
          markdown += '# ' + this.extractTextContent(block.heading_1) + '\n\n';
          break;
        case 'heading_2':
          markdown += '## ' + this.extractTextContent(block.heading_2) + '\n\n';
          break;
        case 'heading_3':
          markdown += '### ' + this.extractTextContent(block.heading_3) + '\n\n';
          break;
        case 'bulleted_list_item':
          markdown += '- ' + this.extractTextContent(block.bulleted_list_item) + '\n';
          break;
        case 'numbered_list_item':
          markdown += '1. ' + this.extractTextContent(block.numbered_list_item) + '\n';
          break;
        case 'code':
          const language = block.code.language || '';
          markdown += '```' + language + '\n' + block.code.rich_text.map(text => text.plain_text).join('') + '\n```\n\n';
          break;
        // Add more block types as needed
      }
    }
    
    return markdown;
  }
  
  private extractTextContent(textBlock: any): string {
    if (!textBlock || !textBlock.rich_text) {
      return '';
    }
    return textBlock.rich_text.map(text => text.plain_text).join('');
  }
  
  /**
   * Save content to a file in the repository
   */
  saveToFile(content: string, filePath: string): void {
    try {
      // Ensure directory exists
      const directory = path.dirname(filePath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      
      // Write content to file
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Successfully saved content to ${filePath}`);
    } catch (error) {
      console.error(`Failed to save content to ${filePath}:`, error);
      throw error;
    }
  }
}