// Dependencies: `npm install @notionhq/client fs`
import { Client } from '@notionhq/client';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function fetchPage(pageId) {
  const response = await notion.pages.retrieve({ page_id: pageId });
  return response;
}

async function saveToLocal(data, filename = 'notion-data.json') {
  fs.writeFileSync(`./data/notion/${filename}`, JSON.stringify(data, null, 2));
}

const main = async () => {
  const pageId = process.env.NOTION_PAGE_ID;
  const page = await fetchPage(pageId);
  await saveToLocal(page);
  console.log('✅ Notion data downloaded.');
};

main().catch(console.error);
