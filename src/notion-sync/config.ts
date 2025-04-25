import dotenv from 'dotenv';
dotenv.config();

export interface SyncConfig {
  notionToken: string;
  githubToken: string;
  notionPages: string[];
  githubRepo: {
    owner: string;
    repo: string;
    branch: string;
    path: string;
  };
}

export const config: SyncConfig = {
  notionToken: process.env.NOTION_TOKEN || '',
  githubToken: process.env.GITHUB_TOKEN || '',
  notionPages: [], // Add your Notion page IDs here
  githubRepo: {
    owner: 'alessandrorumampuk',
    repo: 'redux_todo_in_astro',
    branch: 'main',
    path: 'docs/'
  }
};