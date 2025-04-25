import express, { Express } from 'express';
import cron from 'node-cron';
import { NotionMCP } from './notion-mcp';
import cors from 'cors';

export class NotionMCPServer {
  private app: Express;
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

  // ... rest of the code remains the same ...
}