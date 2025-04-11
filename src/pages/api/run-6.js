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
        await page.click('#cameraLayoutBtn');
        await page.waitForTimeout(2500);

        // 3. Type "London" in search input
        const searchInput = await page.locator('input[placeholder*="Try: New York, London, Tokyo"]');
        await searchInput.type('London', { delay: 100 });
        await page.waitForTimeout(1000);

        // 4. Click Search button
        await page.click('button:text("Search")');
        await page.waitForTimeout(2000);

        // 5. Click Take Photo button
        await page.click('button:text("Take Photo")');
        await page.waitForTimeout(2000);

        // 6. Click Stop Camera button
        await page.click('button:text("Stop Camera")');
        await page.waitForTimeout(1500);

        // 7. Click Enter Manually button
        await page.click('button:text("Enter Manually")');
        await page.waitForTimeout(1500);

        // 8. Click Use San Francisco button
        await page.click('button:text("Use San Francisco")');
        await page.waitForTimeout(1500);

        // 9. Click Use These Coordinates button
        await page.click('button:text("Use These Coordinates")');
        await page.waitForTimeout(1000);

        // 9. Click Settings button
        await page.click('button:text("Settings")');
        await page.waitForTimeout(1000);

        // 10. Click Low quality button
        await page.click('button:text("Low")');
        await page.waitForTimeout(1000);

        // 11. Click Stop Tracking button
        await page.click('button:text("Stop Tracking")');
        await page.waitForTimeout(1500);

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
