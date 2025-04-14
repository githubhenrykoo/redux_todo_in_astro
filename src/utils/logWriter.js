import fs from 'fs';
import path from 'path';

export const writeToJsonl = async (logEntry) => {
    try {
        const response = await fetch('/api/write-log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(logEntry)
        });
        
        if (!response.ok) {
            console.error('Failed to write log');
        }
    } catch (error) {
        console.error('Error writing log:', error);
    }
};