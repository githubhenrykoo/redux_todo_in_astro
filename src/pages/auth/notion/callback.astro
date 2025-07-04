export async function post({ request }) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return new Response(JSON.stringify({
        error: 'No authorization code provided'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const clientId = import.meta.env.NOTION_CLIENT_ID;
    const clientSecret = import.meta.env.NOTION_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({
        error: 'Missing Notion credentials in environment variables'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'http://localhost:4321/auth/notion/callback'
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Notion API error: ${error}`);
    }

    const tokenData = await tokenResponse.json();

    return new Response(JSON.stringify({
      success: true,
      ...tokenData
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Notion callback error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
