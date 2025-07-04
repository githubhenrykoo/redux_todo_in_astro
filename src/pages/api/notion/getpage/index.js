export const get = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const pageId = url.searchParams.get('pageId');
    const accessToken = url.searchParams.get('accessToken');

    if (!pageId || !accessToken) {
      return new Response(JSON.stringify({
        error: 'Missing pageId or accessToken'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Fetch page data
    const pageResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28'
      }
    });

    if (!pageResponse.ok) {
      const errorText = await pageResponse.text();
      console.error('Notion API error:', errorText);
      throw new Error(`Notion API error: ${pageResponse.statusText}`);
    }

    const pageData = await pageResponse.json();

    // Fetch block children
    const blocksResponse = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28'
      }
    });

    if (!blocksResponse.ok) {
      throw new Error(`Failed to fetch blocks: ${blocksResponse.statusText}`);
    }

    const blocksData = await blocksResponse.json();

    // Process blocks
    const tables = [];
    const descriptions = [];
    const subheadings = [];

    if (blocksData.results) {
      blocksData.results.forEach(block => {
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
            if (block[block.type].rich_text.length > 0) {
              subheadings.push({
                id: block.id,
                level: parseInt(block.type.slice(-1)),
                content: block[block.type].rich_text.map(text => text.plain_text).join('')
              });
            }
            break;
          case 'table':
            tables.push({
              id: block.id,
              rows: block.table.rows || []
            });
            break;
        }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      document: {
        page: pageData,
        tables,
        descriptions,
        subheadings
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error in getpage:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
