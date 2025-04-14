import fs from 'fs/promises';
import path from 'path';

export async function POST({ request }) {
  try {
    const statePath = path.join(process.cwd(), 'redux-state.json');
    const newData = await request.json();
    
    // Read existing state
    let currentState = {};
    try {
      const fileContent = await fs.readFile(statePath, 'utf-8');
      currentState = JSON.parse(fileContent);
    } catch (err) {
      // File doesn't exist or is invalid, use empty state
      currentState = { logs: [], status: 'initial', screenshots: [] };
    }

    // Merge new data with existing state
    const updatedState = {
      ...currentState,
      logs: [...currentState.logs, ...newData.logs],
      status: newData.status || currentState.status,
      lastUpdated: newData.lastUpdated || new Date().toISOString()
    };

    // Write updated state back to file
    await fs.writeFile(statePath, JSON.stringify(updatedState, null, 2));

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error updating playwright state:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}