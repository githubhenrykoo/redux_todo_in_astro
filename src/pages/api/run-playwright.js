import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export async function POST({ request, response }) {
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendMessage = async (type, data) => {
        await writer.write(
            encoder.encode(JSON.stringify({ type, ...data }) + '\n')
        );
    };

    (async () => {
        try {
            const browser = await chromium.launch({
                headless: true
            });

            const page = await browser.newPage();
            await sendMessage('log', { message: 'Browser launched' });

            // Execute the same steps as in run-lazygit.ts
            await page.goto('http://localhost:4321');
            await sendMessage('log', { message: 'Page loaded' });

            // ... Rest of your Playwright test steps ...
            // Remember to use sendMessage for logs and screenshots

            await browser.close();
            await sendMessage('log', { message: 'Test completed successfully' });
        } catch (error) {
            await sendMessage('log', { message: `Error: ${error.message}` });
        } finally {
            await writer.close();
        }
    })();

    return new Response(stream.readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}