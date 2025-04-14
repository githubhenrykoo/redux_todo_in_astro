import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const statePath = path.join(process.cwd(), 'redux-state.json');
    
    let state = {
      logs: [],
      screenshots: [],
      status: 'initial'
    };

    try {
      const fileContent = await fs.readFile(statePath, 'utf-8');
      state = JSON.parse(fileContent.trim()); // Add trim() to remove any whitespace
    } catch (err) {
      // If file doesn't exist or is invalid, return default state
      console.error('Error reading state file:', err);
    }

    return new Response(JSON.stringify(state), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to get state',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}