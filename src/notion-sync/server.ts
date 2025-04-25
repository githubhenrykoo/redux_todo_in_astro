import { Client } from '@notionhq/client';
import { Octokit } from '@octokit/rest';

class NotionGitHubSyncServer {
  private notionClient: Client;
  private githubClient: Octokit;
  
  constructor(notionToken: string, githubToken: string) {
    this.notionClient = new Client({ auth: notionToken });
    this.githubClient = new Octokit({ auth: githubToken });
  }

  async syncPage(pageId: string, repoPath: string): Promise<void> {
    try {
      const pageContent = await this.notionClient.pages.retrieve({
        page_id: pageId
      });

      const markdown = await this.convertToMarkdown(pageContent);
      await this.updateGitHubRepo(repoPath, markdown);
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  private async convertToMarkdown(pageContent: any): Promise<string> {
    return JSON.stringify(pageContent, null, 2);
  }

  private async updateGitHubRepo(path: string, content: string): Promise<void> {
    // GitHub update implementation will go here
  }
}

export default NotionGitHubSyncServer;