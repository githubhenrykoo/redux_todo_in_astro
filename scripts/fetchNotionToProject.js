// Dependencies: `npm install @notionhq/client fs`
const { Client } = require('@notionhq/client');
const fs = require('fs');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function fetchPage(pageId) {
  const response = await notion.pages.retrieve({ page_id: pageId });
  return response;
}

async function saveToLocal(data, filename = 'notion-data.json') {
  fs.writeFileSync(`./data/notion/${filename}`, JSON.stringify(data, null, 2));
}

(async () => {
  const pageId = process.env.NOTION_PAGE_ID;
  const page = await fetchPage(pageId);
  await saveToLocal(page);
  console.log('✅ Notion data downloaded.');
})();
