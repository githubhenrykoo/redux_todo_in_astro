import { Client } from '@notionhq/client';

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const pageId = url.searchParams.get('pageId');

    if (!pageId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Page ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const notion = new Client({
      auth: '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'
    });

    try {
      // Get the page
      const page = await notion.pages.retrieve({ page_id: pageId });
      
      // Get the page content (blocks)
      const blocks = await notion.blocks.children.list({ block_id: pageId });

      // Process blocks into structured data
      const tables = [];
      const descriptions = [];
      const subheadings = [];
      const codeBlocks = [];

      for (const block of blocks.results) {
        switch (block.type) {
          case 'paragraph':
            if (block.paragraph.rich_text.length > 0) {
              descriptions.push({
                id: block.id,
                content: block.paragraph.rich_text.map(text => text.plain_text).join('')
              });
            }
            break;
          
          case 'heading_1':
          case 'heading_2':
          case 'heading_3':
            subheadings.push({
              id: block.id,
              level: parseInt(block.type.slice(-1)),
              content: block[block.type].rich_text.map(text => text.plain_text).join('')
            });
            break;
          
          case 'table':
            const tableRows = await notion.blocks.children.list({ block_id: block.id });
            const rows = tableRows.results.map(row => ({
              cells: row.table_row.cells.map(cell => 
                cell.map(text => text.plain_text).join('')
              )
            }));
            tables.push({ id: block.id, rows });
            break;

          case 'code':
            codeBlocks.push({
              id: block.id,
              language: block.code.language,
              content: block.code.rich_text.map(text => text.plain_text).join('')
            });
            break;
        }
      }

      return new Response(JSON.stringify({
        success: true,
        document: {
          page,
          tables,
          descriptions,
          subheadings,
          codeBlocks
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (notionError) {
      console.error('Notion API error:', notionError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid page ID or page not accessible'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Server error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
