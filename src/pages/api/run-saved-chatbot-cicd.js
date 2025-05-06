import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';

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
        
        // Create screenshots directory if it doesn't exist
        const screenshotsDir = path.join(process.cwd(), 'tests', 'data');
        await fs.mkdir(screenshotsDir, { recursive: true });
        
        // Navigate to the page
        await page.goto('http://localhost:4321');

        // 1. Click Enter Page
        await page.click('a.enter-button');
        await page.waitForTimeout(1000);

        // 2. Click YouTube Layout Button
        await page.click('#youtubeLayoutBtn');
        await page.waitForTimeout(2500);

        // 3. Read and execute all messages from redux-state.json
        const stateFile = await fs.readFile(path.join(process.cwd(), 'redux-state.json'), 'utf-8');
        const state = JSON.parse(stateFile);
        const inputActions = state.testActions.filter(action => action.type === 'input');
        
        for (const action of inputActions) {
            const message = action.value;
            
            // Tunggu sampai textarea siap untuk menerima input
            await page.waitForSelector('textarea[placeholder="Type your message here..."]', { state: 'visible' });
            const textarea = await page.locator('textarea[placeholder="Type your message here..."]');
            
            // Cek apakah textarea bisa digunakan
            async function waitForTextareaReady() {
                let isReady = false;
                while (!isReady) {
                    isReady = await textarea.evaluate(el => !el.disabled && !el.readOnly);
                    if (!isReady) {
                        await page.waitForTimeout(1000); // Cek setiap 1 detik
                    }
                }
            }
            
            await waitForTextareaReady();
            
            await page.screenshot({ 
                path: path.join(screenshotsDir, `after-response-${Date.now()}.png`),
                fullPage: true 
            });
            // Ketik pesan karakter per karakter
            for (const char of message) {
                await textarea.type(char, { delay: 100 });
            }
            await page.waitForTimeout(1000);

            // Tunggu tombol kirim bisa diklik
            const sendButton = await page.locator('button.bg-blue-600.text-white');
            await sendButton.waitFor({ state: 'visible' });
            await sendButton.click();
            
            // Tunggu sampai pesan terkirim dan textarea siap untuk pesan berikutnya
            await waitForTextareaReady();
        }

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
