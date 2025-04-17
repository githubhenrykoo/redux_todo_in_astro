export interface NotionConfig {
  apiKey: string;
  databaseId?: string;
}

// Load configuration from environment variables
export const notionConfig: NotionConfig = {
  apiKey: import.meta.env.NOTION_API_KEY || '',
  databaseId: import.meta.env.NOTION_DATABASE_ID || '',
};

// Validate configuration
export function validateNotionConfig(): boolean {
  if (!notionConfig.apiKey) {
    console.error('Notion API key is not configured');
    return false;
  }
  return true;
}