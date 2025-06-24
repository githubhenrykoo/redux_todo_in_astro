import { Client } from '@notionhq/client';

const notion = new Client({
  auth: import.meta.env.NOTION_API_KEY
});

export async function GET({ params, request }) {
  const { action } = params;
  const url = new URL(request.url);
  const pageId = url.searchParams.get('pageId');

  try {
    if (action === 'verify') {
      await notion.users.me();
      return new Response(JSON.stringify({ status: 'ok' }));
    }
    
    if (action === 'page' && pageId) {
      const page = await notion.pages.retrieve({ page_id: pageId });
      const blocks = await notion.blocks.children.list({ 
        block_id: pageId,
        page_size: 100
      });
      
      const tables = [];
      const descriptions = [];
      const subheadings = [];
      
      for (const block of blocks.results) {
        if (block.type === 'table') {
          const tableRows = await notion.blocks.children.list({
            block_id: block.id,
            page_size: 100
          });
          
          tables.push({
            id: block.id,
            rows: tableRows.results.map(row => ({
              cells: row.table_row.cells
            }))
          });
        } else if (block.type === 'paragraph') {
          const text = block.paragraph.rich_text
            .map(t => t.plain_text)
            .join('');
          if (text.trim()) {
            descriptions.push({
              id: block.id,
              content: text
            });
          }
        } else if (block.type === 'heading_1' || block.type === 'heading_2' || block.type === 'heading_3') {
          const text = block[block.type].rich_text
            .map(t => t.plain_text)
            .join('');
          if (text.trim()) {
            subheadings.push({
              id: block.id,
              content: text,
              level: parseInt(block.type.slice(-1))
            });
          }
        }
      }
      
      return new Response(JSON.stringify({
        success: true,
        document: {
          page,
          tables,
          descriptions,
          subheadings,
          blocks: blocks.results
        }
      }));
    }

    if (action === 'database') {
      const databaseId = import.meta.env.NOTION_DATABASE_ID;
      const database = await notion.databases.retrieve({
        database_id: databaseId
      });

      const response = await notion.databases.query({
        database_id: databaseId,
        page_size: 100
      });

      const documents = await Promise.all(response.results.map(async (page) => {
        const blocks = await notion.blocks.children.list({
          block_id: page.id,
          page_size: 100
        });

        const tables = [];
        for (const block of blocks.results) {
          if (block.type === 'table') {
            const tableRows = await notion.blocks.children.list({
              block_id: block.id,
              page_size: 100
            });
            
            tables.push({
              id: block.id,
              rows: tableRows.results.map(row => ({
                cells: row.table_row.cells
              }))
            });
          }
        }

        return {
          id: page.id,
          title: page.properties?.title?.title?.[0]?.plain_text || 'Untitled',
          tables,
          lastEdited: page.last_edited_time
        };
      }));

      return new Response(JSON.stringify({
        success: true,
        documents,
        database: {
          id: database.id,
          title: database.title?.[0]?.plain_text || 'Untitled Database'
        }
      }));
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (error) {
    console.error('Notion API error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to process request'
      }), 
      { status: 500 }
    );
  }
}
