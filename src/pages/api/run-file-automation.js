import { chromium } from '@playwright/test';

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
            await sendMessage('log', { message: 'Starting file automation test...' });
            browser = await chromium.launch({
                headless: false,
                slowMo: 50
            });

            const page = await browser.newPage();
            await page.goto('http://localhost:4321');

            await sendMessage('log', { message: 'Clicking Enter Page button...' });
            await page.click('a.enter-button:has-text("Enter Page")');
            await page.waitForTimeout(2000);

            await sendMessage('log', { message: 'Clicking code editor button...' });
            await page.click('#todoLayoutBtn');
            await page.waitForTimeout(2000);

            await sendMessage('log', { message: 'Waiting for chatbot...' });
            await page.waitForSelector('textarea[placeholder="Type your message here..."]', { timeout: 10000 });
            await page.waitForTimeout(1000);

            // Create file
            await sendMessage('log', { message: 'Creating test file...' });
            await page.click('textarea[placeholder="Type your message here..."]');
            const createCommand = '$echo "testing" >> testing.txt';
            for (const char of createCommand) {
                await page.keyboard.type(char);
                await page.waitForTimeout(150);
            }
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);

            // Read file
            await sendMessage('log', { message: 'Reading test file...' });
            await page.click('textarea[placeholder="Type your message here..."]');
            const readCommand = '$cat testing.txt';
            for (const char of readCommand) {
                await page.keyboard.type(char);
                await page.waitForTimeout(150);
            }
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);

            // Delete file
            await sendMessage('log', { message: 'Deleting test file...' });
            await page.click('textarea[placeholder="Type your message here..."]');
            const deleteCommand = '$rm testing.txt';
            for (const char of deleteCommand) {
                await page.keyboard.type(char);
                await page.waitForTimeout(150);
            }
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);

            await sendMessage('log', { message: 'File automation completed successfully' });
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