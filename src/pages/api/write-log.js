import fs from 'fs';
import path from 'path';

export async function POST({ request }) {
    try {
        const logEntry = await request.json();
        const logsDir = path.join(process.cwd(), 'logs');
        const logFile = path.join(logsDir, 'action-logs.jsonl');

        // Ensure logs directory exists
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        // Append log entry to file
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error writing log:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}