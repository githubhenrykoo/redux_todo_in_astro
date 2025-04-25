import { Client } from '@notionhq/client';
import fs from 'fs/promises';
import path from 'path';

export interface NotionDocument {
  id: string;
  title: string;
  content: string;
}

export class NotionMCP {
  private notion: Client;
  private outputDir: string;

  constructor(outputDir: string = 'docs/notion') {
    if (!process.env.NOTION_API_KEY) {
      throw new Error('NOTION_API_KEY environment variable is required');
    }
    
    this.notion = new Client({
      auth: process.env.NOTION_API_KEY
    });
    this.outputDir = outputDir;
  }

  async downloadPage(pageId: string): Promise<NotionDocument> {
    try {
      const response = await this.notion.pages.retrieve({ page_id: pageId });
      const blocks = await this.notion.blocks.children.list({ block_id: pageId });
      
      const document = {
        id: pageId,
        title: response.properties?.title?.title?.[0]?.plain_text || 'Untitled',
        content: this.parseBlocks(blocks.results)
      };

      await this.saveDocument(document);
      return document;
    } catch (error) {
      throw new Error(`Failed to download page: ${error.message}`);
    }
  }

  async downloadDatabase(databaseId?: string): Promise<NotionDocument[]> {
    try {
      const dbId = databaseId || process.env.NOTION_DATABASE_ID;
      if (!dbId) throw new Error('Database ID is required');

      const response = await this.notion.databases.query({
        database_id: dbId
      });

      const documents: NotionDocument[] = [];
      for (const page of response.results) {
        const doc = await this.downloadPage(page.id);
        documents.push(doc);
      }

      return documents;
    } catch (error) {
      throw new Error(`Failed to download database: ${error.message}`);
    }
  }

  private parseBlocks(blocks: any[]): string {
    return blocks
      .map(block => {
        if (block.type === 'paragraph') {
          return block.paragraph.rich_text.map(t => t.plain_text).join('');
        }
        return '';
      })
      .filter(text => text)
      .join('\n\n');
  }

  private async saveDocument(document: NotionDocument): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
    const filePath = path.join(this.outputDir, `${document.id}.md`);
    const content = `# ${document.title}\n\n${document.content}`;
    await fs.writeFile(filePath, content, 'utf-8');
  }
}