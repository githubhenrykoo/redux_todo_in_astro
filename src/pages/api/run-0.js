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
            await sendMessage('log', { message: 'Starting combined automation test...' });
            browser = await chromium.launch({
                headless: false,
                slowMo: 100
            });

            // Setup screenshots directory
            const screenshotsDir = path.join(process.cwd(), 'tests', 'data');
            if (!fs.existsSync(screenshotsDir)) {
                fs.mkdirSync(screenshotsDir, { recursive: true });
            }

            const context = await browser.newContext({
                viewport: null,
                screen: { width: 1920, height: 1080 }
            });
            
            const page = await context.newPage();

            // Part 1: Lazygit Automation
            await sendMessage('log', { message: '=== Starting Lazygit Tests ===' });
            
            await page.goto('http://localhost:4321');
            await page.click('a.enter-button[href="/Page"]');
            await page.waitForTimeout(1000);

            await page.click('.xterm-screen');
            const cdCommand = 'cd documents/github/redux_todo_in_astro';
            for (const char of cdCommand) {
                await page.keyboard.type(char);
                await page.waitForTimeout(100);
            }
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);

            const lazygitCommand = 'lazygit';
            for (const char of lazygitCommand) {
                await page.keyboard.type(char);
                await page.waitForTimeout(200);
            }
            await page.screenshot({ 
                path: path.join(screenshotsDir, `lazygit-start-${Date.now()}.png`)
            });
            
            await page.keyboard.press('Enter');
            await page.waitForTimeout(5000);

            await page.screenshot({ 
                path: path.join(screenshotsDir, `lazygit-running-${Date.now()}.png`)
            });

            await page.keyboard.press('q');
            await page.waitForTimeout(2000);

            // Part 2: MQTT Automation
            await sendMessage('log', { message: '=== Starting MQTT Tests ===' });

            // LED Tests
            await page.click('button:has-text("Turn on LED")');
            await sendMessage('log', { message: 'Turned ON LED' });
            await page.screenshot({ 
                path: path.join(screenshotsDir, `led-on-${Date.now()}.png`),
                fullPage: true 
            });
            await page.waitForTimeout(1000);

            await page.click('button:has-text("Test Energy Meter")');
            await sendMessage('log', { message: 'Testing Energy Meter' });
            await page.waitForTimeout(1000);

            // Send message
            const currentTime = new Date().toLocaleTimeString();
            const message = `Current Time: ${currentTime}`;
            await page.click('input[placeholder="Enter your message here..."]');
            await page.keyboard.type(message, { delay: 100 });
            await page.click('button:has-text("Send")');
            await page.waitForTimeout(1000);

            await page.click('button:has-text("Turn off LED")');
            await sendMessage('log', { message: 'Turned OFF LED' });
            await page.waitForTimeout(1000);

            await sendMessage('log', { message: 'Combined automation completed successfully' });
            await browser.close();

        } catch (error) {
            await sendMessage('log', { message: `Error: ${error.message}` });
            if (browser) {
                await browser.close();
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