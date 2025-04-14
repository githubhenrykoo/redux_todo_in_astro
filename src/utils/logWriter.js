import fs from 'fs';
import path from 'path';

export const writeToJsonl = async (logEntry) => {
    const logDir = '/Users/alessandrorumampuk/Documents/GitHub/redux_todo_in_astro/logs';
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(logDir, `playwright-logs-${today}.jsonl`);

    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    // Append log entry to JSONL file
    const logLine = JSON.stringify(logEntry) + '\n';
    await fs.promises.appendFile(logFile, logLine);
};