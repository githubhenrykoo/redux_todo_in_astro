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

            // Part 1: Catalog Manager Tests
            await sendMessage('log', { message: '=== Starting Catalog Manager Tests ===' });
            
            await page.goto('http://localhost:4321');
            await sendMessage('log', { message: 'Navigating to homepage' });
            
            await page.click('a.enter-button[href="/Page"]');
            await sendMessage('log', { message: 'Clicked Enter Page button' });
            await page.waitForTimeout(1000);

            await page.click('#catalogLayoutBtn');
            await sendMessage('log', { message: 'Opened Catalog Manager' });
            await page.waitForTimeout(1000);

            await page.click('.grid-item-type');
            await sendMessage('log', { message: 'Selected Image type' });
            await page.waitForTimeout(1000);

            await page.click('.btn-back');
            await sendMessage('log', { message: 'Clicked Back button' });
            await page.waitForTimeout(1000);

            // Fill in the form
            await page.fill('#title', 'Testing');
            await sendMessage('log', { message: 'Entered title: Testing' });

            await page.fill('textarea[placeholder="Describe the context of this Cubical Logic Model..."]', 'Testing');
            await sendMessage('log', { message: 'Entered context description' });

            await page.fill('textarea[placeholder="Define the primary goal of this model..."]', 'Testing');
            await sendMessage('log', { message: 'Entered primary goal' });

            await page.fill('textarea[placeholder="List the success criteria for this model..."]', 'Testing');
            await sendMessage('log', { message: 'Entered success criteria' });

            await page.click('button:has-text("Save")');
            await sendMessage('log', { message: 'Clicked Save button' });
            await page.waitForTimeout(2000);

            await page.screenshot({ 
                path: path.join(screenshotsDir, `catalog-form-${Date.now()}.png`),
                fullPage: true 
            });
            await sendMessage('log', { message: 'Captured form screenshot' });
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