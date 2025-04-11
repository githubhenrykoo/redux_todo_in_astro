import { chromium } from '@playwright/test';

export async function POST({ request }) {
    const browser = await chromium.launch({
        headless: false
    });
    const context = await browser.newContext({
        viewport: null,
        screen: {
            width: 1920,
            height: 1080
        }
    });
    const page = await context.newPage();
    
    try {
        await page.evaluate(() => {
            document.documentElement.requestFullscreen();
        });
        
        // Navigate to the page
        await page.goto('http://localhost:4321');

        // 1. Click Enter Page
        await page.click('a.enter-button');
        await page.waitForTimeout(1000);

        // 2. Click YouTube Layout Button
        await page.click('#youtubeLayoutBtn');
        await page.waitForTimeout(2500);

        // 3. Type message in textarea character by character
        const message = 'Explain to me about addition with carry over.';
        const textarea = await page.locator('textarea[placeholder="Type your message here..."]');
        for (const char of message) {
            await textarea.type(char, { delay: 100 });
        }
        await page.waitForTimeout(1000);

        // 4. Click Send Message Button
        await page.click('button.bg-blue-600.text-white');
        await page.waitForTimeout(6000);

        // 5. Type YouTube URL character by character
        const youtubeUrl = 'https://www.youtube.com/watch?v=yOGFZyiQZUU';
        const urlInput = await page.locator('input[placeholder*="Enter YouTube URL"]');
        
        // First clear the input
        await urlInput.fill('');
        await page.waitForTimeout(500);

        // Then type the new URL
        for (const char of youtubeUrl) {
            await urlInput.type(char, { delay: 100 });
        }
        await page.waitForTimeout(1000);

        // 6. Click Load Button and press Enter
        await page.click('button:text("Load")');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);

        // 6.1 Click YouTube play button
        const frame = await page.frameLocator('iframe[src*="youtube"]');
        await frame.locator('.ytp-large-play-button-red-bg').click();
        await page.waitForTimeout(6000);

        // Calculator operations
        // 7. Click 1
        await page.click('button:text("2")');
        await page.waitForTimeout(750);

        await page.click('button:text("9")');
        await page.waitForTimeout(750);

        // 8. Click +
        await page.click('button:text("+")');
        await page.waitForTimeout(750);

        // 9. Click 2
        await page.click('button:text("3")');
        await page.waitForTimeout(750);

        await page.click('button:text("8")');
        await page.waitForTimeout(750);

        // 10. Click =
        await page.click('button:text("=")');
        await page.waitForTimeout(750);

        // 10.1 Pause YouTube video by clicking on the video player
        const youtubeFrame = await page.frameLocator('iframe[src*="youtube"]');
        await youtubeFrame.locator('.html5-main-video').click();
        await page.waitForTimeout(5000);

        await browser.close();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Automation error:', error);
        await browser.close();
        
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
        });
    }
}