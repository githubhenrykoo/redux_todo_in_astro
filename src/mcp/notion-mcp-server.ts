import express from 'express';
import cors from 'cors';
import { NotionMCP } from './notion-mcp.js';

export class NotionMCPServer {
  private app;
  private notionMcp: NotionMCP;
  private port: number;

  constructor(port: number = 3002) {
    this.app = express();
    this.port = port;
    this.notionMcp = new NotionMCP();
    
    this.app.use(express.json());
    this.app.use(cors());
    
    this.setupRoutes();
  }

  private setupRoutes() {
    this.app.get('/health', (_, res) => {
      res.json({ status: 'ok' });
    });

    this.app.post('/sync/database', async (_, res) => {
      try {
        const documents = await this.notionMcp.downloadDatabase();
        res.json({ success: true, documents });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    this.app.post('/sync/page/:pageId', async (req, res) => {
      try {
        const document = await this.notionMcp.downloadPage(req.params.pageId);
        res.json({ success: true, document });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`Notion MCP Server running on port ${this.port}`);
    });
  }
}