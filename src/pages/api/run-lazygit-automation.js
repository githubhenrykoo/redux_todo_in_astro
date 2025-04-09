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
        let browser;
        try {
            // Ensure proper JSON formatting for messages
            await sendMessage('log', { message: 'Initializing automation...' });
            
            browser = await chromium.launch({
                headless: false,
                slowMo: 100
            });

            const page = await browser.newPage();
            await sendMessage('log', { message: 'Starting automation sequence...' });

            // Navigate to the application
            await page.goto('http://localhost:4321');
            await sendMessage('log', { message: 'Page loaded, navigating to code editor...' });

            // Click Enter Page button
            await page.click('a.enter-button:has-text("Enter Page")');
            await sendMessage('log', { message: 'Clicked Enter Page button' });
            await page.waitForTimeout(2000);

            await page.waitForTimeout(2000);

            // Click Testing Dashboard button
            await page.click('#testingLayoutBtn');
            await sendMessage('log', { message: 'Clicked Testing Dashboard button' });

            // Wait for terminal
            await page.waitForSelector('.xterm-screen', { timeout: 10000 });
            await sendMessage('log', { message: 'Terminal loaded successfully' });
            await page.waitForTimeout(2000);

            // Setup screenshots directory
            const screenshotsDir = path.join(process.cwd(), 'tests', 'data');
            if (!fs.existsSync(screenshotsDir)) {
                fs.mkdirSync(screenshotsDir, { recursive: true });
            }

            // Take initial screenshot
            const beforeScreenshot = `terminal-before-${Date.now()}.png`;
            await page.screenshot({ path: path.join(screenshotsDir, beforeScreenshot) });
            await sendMessage('screenshot', { path: beforeScreenshot });

            // Focus terminal and type cd command
            await page.click('.xterm-screen');
            const cdCommand = 'cd documents/github/redux_todo_in_astro';
            for (const char of cdCommand) {
                await page.keyboard.type(char);
                await page.waitForTimeout(100);
            }

            // Screenshot after cd command
            const cdTypedScreenshot = `cd-typed-${Date.now()}.png`;
            await page.screenshot({ path: path.join(screenshotsDir, cdTypedScreenshot) });
            await sendMessage('screenshot', { path: cdTypedScreenshot });

            await page.waitForTimeout(500);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);

            // Type lazygit command
            const lazygitCommand = 'lazygit';
            for (const char of lazygitCommand) {
                await page.keyboard.type(char);
                await page.waitForTimeout(200);
            }

            // Screenshot before executing lazygit
            const typedScreenshot = `terminal-typed-${Date.now()}.png`;
            await page.screenshot({ path: path.join(screenshotsDir, typedScreenshot) });
            await sendMessage('screenshot', { path: typedScreenshot });

            await page.waitForTimeout(500);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(5000);

            // Screenshot of lazygit running
            const lazygitScreenshot = `lazygit-running-${Date.now()}.png`;
            await page.screenshot({ path: path.join(screenshotsDir, lazygitScreenshot) });
            await sendMessage('screenshot', { path: lazygitScreenshot });

            // Exit lazygit
            await page.keyboard.press('q');
            await page.waitForTimeout(2000);

            // Final screenshot
            const afterScreenshot = `terminal-after-${Date.now()}.png`;
            await page.screenshot({ path: path.join(screenshotsDir, afterScreenshot) });
            await sendMessage('screenshot', { path: afterScreenshot });

            await sendMessage('log', { message: 'Automation sequence completed' });

            // Cleanup
            await browser.close();
            await sendMessage('log', { message: 'Browser closed successfully' });

        } catch (error) {
            await sendMessage('log', { message: `Error: ${error.message}` });
            if (browser) {
                await browser.close();
                await sendMessage('log', { message: 'Browser closed after error' });
            }
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