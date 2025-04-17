import express from 'express';
import cron from 'node-cron';
import { NotionMCP } from './notion-mcp'; // Remove .js extension
import cors from 'cors';

export class NotionMCPServer {
  private app;
  private notionMcp: NotionMCP;
  private port: number;

  constructor(port: number = 3001) {
    this.app = express();
    this.port = port;
    this.notionMcp = new NotionMCP();
    
    // Middleware
    this.app.use(express.json());
    this.app.use(cors());
    
    this.setupRoutes();
    this.setupCronJobs();
  }

  private setupRoutes() {
    this.app.get('/health', (_, res) => {
      res.json({ status: 'ok' });
    });

    this.app.post('/sync/page/:pageId', async (req, res) => {
      try {
        const document = await this.notionMcp.downloadPage(req.params.pageId);
        res.json({ success: true, document });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/sync/database', async (req, res) => {
      try {
        const documents = await this.notionMcp.downloadDatabase();
        res.json({ success: true, documents });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  private setupCronJobs() {
    // Sync database every hour
    cron.schedule('0 * * * *', async () => {
      try {
        await this.notionMcp.downloadDatabase();
        console.log('Automated database sync completed');
      } catch (error) {
        console.error('Automated sync failed:', error);
      }
    });
  }

  public start() {
    this.app.listen(this.port, () => {
      console.log(`Notion MCP Server running on port ${this.port}`);
    });
  }
}