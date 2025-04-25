#!/usr/bin/env node
import NotionGitHubSyncServer from './server.js';  // Add .js extension
import { config } from './config.js';  // Add .js extension

async function main() {
  const server = new NotionGitHubSyncServer(
    config.notionToken,
    config.githubToken
  );

  for (const pageId of config.notionPages) {
    try {
      await server.syncPage(
        pageId,
        `${config.githubRepo.path}/${pageId}.md`
      );
      console.log(`Successfully synced page ${pageId}`);
    } catch (error) {
      console.error(`Failed to sync page ${pageId}:`, error);
    }
  }
}

main().catch(console.error);