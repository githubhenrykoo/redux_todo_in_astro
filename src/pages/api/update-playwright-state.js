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
      currentState = { 
        logs: [], 
        status: 'initial', 
        screenshots: [],
        testActions: [],
        chatHistory: []
      };
    }

    // Create test action from chat data
    if (newData.type === 'chat') {
      const testAction = {
        timestamp: new Date().toISOString(),
        action: 'chat',
        selector: '#chatInput', // Add the actual selector for your chat input
        value: newData.userMessage || newData.llmResponse,
        type: newData.userMessage ? 'input' : 'response',
        model: newData.model || 'llama3',
        testStep: {
          description: newData.userMessage ? 
            `Type message: "${newData.userMessage}"` : 
            `Verify response contains: "${newData.llmResponse?.substring(0, 50)}..."`,
          code: newData.userMessage ?
            `await page.fill('#chatInput', '${newData.userMessage}');\nawait page.click('#sendButton');` :
            `await expect(page.locator('.message-content')).toContainText('${newData.llmResponse?.substring(0, 50)}');`
        }
      };

      currentState.testActions = [...(currentState.testActions || []), testAction];
    }

    // Merge new data with existing state
    const updatedState = {
      ...currentState,
      logs: [...currentState.logs, ...newData.logs],
      status: newData.status || currentState.status,
      lastUpdated: newData.lastUpdated || new Date().toISOString(),
      chatHistory: [...(currentState.chatHistory || []), {
        timestamp: new Date().toISOString(),
        type: newData.type,
        userMessage: newData.userMessage,
        llmResponse: newData.llmResponse,
        model: newData.model
      }].filter(item => item.userMessage || item.llmResponse)
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