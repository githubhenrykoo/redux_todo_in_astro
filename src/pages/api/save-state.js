import fs from 'fs/promises';
import path from 'path';

export async function POST({ request }) {
    try {
        const state = await request.json();
        const filePath = path.join(process.cwd(), 'playwright-state.json');
        
        // Ensure directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        
        // Write the merged state
        await fs.writeFile(filePath, JSON.stringify(state, null, 2));
        
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}