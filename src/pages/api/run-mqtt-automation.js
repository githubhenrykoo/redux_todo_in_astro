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
        let browser; // Declare browser variable in the outer scope
        try {
            browser = await chromium.launch({
                headless: false,
                slowMo: 1000
            });

            // Create screenshots directory first
            const screenshotsDir = path.join(process.cwd(), 'tests', 'data');
            if (!fs.existsSync(screenshotsDir)) {
                fs.mkdirSync(screenshotsDir, { recursive: true });
            }

            const context = await browser.newContext({
                viewport: null,
                screen: { width: 1920, height: 1080 }
            });
            
            const page = await context.newPage();
            await sendMessage('log', { message: 'Starting automation sequence...' });

            // 1. Navigate to the application
            await page.goto('http://localhost:4321');
            await sendMessage('log', { message: 'Navigated to application' });
            await page.waitForTimeout(1000);

            // 2. Click Enter Page button
            await page.click('a.enter-button[href="/Page"]');
            await sendMessage('log', { message: 'Clicked Enter Page button' });
            await page.waitForTimeout(1000);

            // 3. Click MQTT Dashboard button
            await page.click('#mqttDashboardLayoutBtn');
            await sendMessage('log', { message: 'Opened MQTT Dashboard' });
            await page.waitForTimeout(2000);

            // 4. Turn on LED
            await page.click('button:has-text("Turn on LED")');
            await sendMessage('log', { message: 'Turned ON LED' });
            await page.waitForTimeout(1000);
            await page.screenshot({ 
                path: path.join(screenshotsDir, `led-on-${Date.now()}.png`),
                fullPage: true 
            });

            // 5. Test Energy Meter
            await page.click('button:has-text("Test Energy Meter")');
            await sendMessage('log', { message: 'Testing Energy Meter' });
            await page.waitForTimeout(1000);
            await page.screenshot({ 
                path: path.join(screenshotsDir, `energy-meter-${Date.now()}.png`),
                fullPage: true 
            });

            // 6. Enter current time message
            const currentTime = new Date().toLocaleTimeString();
            const message = `Current Time: ${currentTime}`;
            await page.click('input[placeholder="Enter your message here..."]');
            await page.keyboard.type(message, { delay: 100 });
            await sendMessage('log', { message: `Current Time: ${message}` });
            await page.waitForTimeout(1000);
            await page.screenshot({ 
                path: path.join(screenshotsDir, `typing-message-${Date.now()}.png`),
                fullPage: true 
            });

            // 7. Send message
            await page.click('button:has-text("Send")');
            await sendMessage('log', { message: 'Sent message' });
            await page.waitForTimeout(1000);
            await page.screenshot({ 
                path: path.join(screenshotsDir, `message-sent-${Date.now()}.png`),
                fullPage: true 
            });

            // 8. Turn off LED
            await page.click('button:has-text("Turn off LED")');
            await sendMessage('log', { message: 'Turned OFF LED' });
            await page.waitForTimeout(1000);
            await page.screenshot({ 
                path: path.join(screenshotsDir, `led-off-${Date.now()}.png`),
                fullPage: true 
            });

            // Remove the final screenshot as we now have individual ones
            await sendMessage('log', { message: 'Automation sequence completed' });
            await page.waitForTimeout(1000);

            // Proper cleanup
            await sendMessage('log', { message: 'Closing browser...' });
            await context.close();
            await browser.close();
            await sendMessage('log', { message: 'Browser closed successfully' });

        } catch (error) {
            await sendMessage('log', { message: `Error: ${error.message}` });
            // Ensure browser closes even if there's an error
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