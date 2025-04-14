import fs from 'fs/promises';
import path from 'path';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'playwright-state.json');
        
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return new Response(data, {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (readError) {
            // If file doesn't exist, return empty state
            return new Response(JSON.stringify({
                status: 'idle',
                logs: [],
                screenshots: [],
                lastUpdated: new Date().toISOString()
            }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
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