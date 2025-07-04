export const get = async ({ request }) => {
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

  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28'
      }
    });

    const data = await response.json();

    return new Response(JSON.stringify({
      success: true,
      document: {
        page: data,
        tables: [],  // You can add logic to extract tables if needed
        descriptions: [],  // You can add logic to extract descriptions if needed
        subheadings: []  // You can add logic to extract subheadings if needed
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
