import { chromium } from '@playwright/test';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export async function POST({ request }) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    screen: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();
  
  // Initialize SQLite database connection
  const db = await open({
    filename: '/Users/alessandrorumampuk/Documents/GitHub/redux_todo_in_astro/public/data/cards.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS card (
      hash TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      g_time TEXT NOT NULL
    )
  `);

  // Helper function to save screenshot to database
  async function saveScreenshot(name, screenshot) {
    try {
      const timestamp = new Date().toISOString();
      const hash = await generateHash(screenshot);
      const g_time = `sha256|${timestamp}|ASIA`;
      
      await db.run(
        'INSERT OR REPLACE INTO card (hash, content, g_time) VALUES (?, ?, ?)',
        [hash, screenshot, g_time]
      );
    } catch (error) {
      // Log the error but don't throw it
      console.warn(`Warning: Screenshot save issue for ${name}:`, error.message);
    }
  }

  try {
    // Set viewport + fullscreen
    await page.setViewportSize({ width: 1500, height: 900 });
    await page.evaluate(() => {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    });

    await page.goto('http://localhost:4321');
    await page.waitForTimeout(1000);
    const screenshot1 = await page.screenshot();
    await saveScreenshot('initial_page', screenshot1);

    // Masuk halaman
    await page.click('a.enter-button');
    await page.waitForTimeout(1000);
    const screenshot2 = await page.screenshot();
    await saveScreenshot('enter_page', screenshot2);

    await page.click('button#catalogLayoutBtn');
    await page.waitForTimeout(1000);
    const screenshot3 = await page.screenshot();
    await saveScreenshot('catalog_view', screenshot3);

    await page.fill('input#title', 'Playwright Testing');
    await page.waitForTimeout(1000);

    await page.fill('textarea[placeholder="Describe the context of this Cubical Logic Model..."]', 'Playwright Testing');
    await page.waitForTimeout(1000);

    await page.fill('textarea[placeholder="Define the primary goal of this model..."]', 'Playwright Testing');
    await page.waitForTimeout(1000);

    await page.fill('textarea[placeholder="List the success criteria for this model..."]', 'Playwright Testing');
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Concrete Implementation")');

    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles('playwright_logs/playwrightclmconversationalprogramming/Playwright_Testing.py');
    await page.waitForTimeout(1000);

    await page.fill('input#title', 'Playwright Testing');
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForTimeout(1000);

    await page.locator('button.btn-refresh[title="Refresh catalog"]').click();
    await page.waitForTimeout(1000);

    const clmElement = await page.locator('pre', { hasText: '"type":"clm_document"' }).first();
    await clmElement.scrollIntoViewIfNeeded();
    await clmElement.click();
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Execute CLM")');
    await page.waitForTimeout(1000);
    const screenshot4 = await page.screenshot();
    await saveScreenshot('execute_clm', screenshot4);

    const runningText2 = await page.locator('h3', { hasText: 'Python Interactive Console' }).first();
    await runningText2.scrollIntoViewIfNeeded();
    await runningText2.focus();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(10000);
    await page.locator("text=Running Python script...").waitFor({ timeout: 10000 });

    await page.click('button:has-text("Clear")');
    await page.waitForTimeout(1000);

    // === SECTION A: YouTube Layout Automation ===
    await page.click('#youtubeLayoutBtn');
    await page.waitForTimeout(2500);

    const message = 'Explain to me about addition with carry over.';
    const textarea = await page.locator('textarea[placeholder="Type your message here..."]');
    for (const char of message) {
      await textarea.type(char, { delay: 100 });
    }
    await page.waitForTimeout(1000);

    await page.click('button.bg-blue-600.text-white');
    await page.waitForTimeout(6000);

    const youtubeUrl = 'https://www.youtube.com/watch?v=yOGFZyiQZUU';
    const urlInput = await page.locator('input[placeholder*="Enter YouTube URL"]');
    await urlInput.fill('');
    await page.waitForTimeout(500);
    for (const char of youtubeUrl) {
      await urlInput.type(char, { delay: 100 });
    }
    await page.waitForTimeout(1000);

    await page.click('button:text("Load")');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    const youtubeFrame = await page.frameLocator('iframe[src*="youtube"]');
    await youtubeFrame.locator('.ytp-large-play-button-red-bg').click();
    await page.waitForTimeout(6000);

    await page.click('button:text("2")');
    await page.waitForTimeout(750);
    await page.click('button:text("9")');
    await page.waitForTimeout(750);
    await page.click('button:text("+")');
    await page.waitForTimeout(750);
    await page.click('button:text("3")');
    await page.waitForTimeout(750);
    await page.click('button:text("8")');
    await page.waitForTimeout(750);
    await page.click('button:text("=")');
    await page.waitForTimeout(750);

    await youtubeFrame.locator('.html5-main-video').click();
    await page.waitForTimeout(4000);

    // === SECTION B: Camera Layout Automation ===
    await page.click('#cameraLayoutBtn');
    await page.waitForTimeout(2500);

    const searchInput = await page.locator('input[placeholder*="Try: New York, London, Tokyo"]');
    await searchInput.type('London', { delay: 100 });
    await page.waitForTimeout(1000);

    await page.click('button:text("Search")');
    await page.waitForTimeout(2000);
    await page.click('button:text("Take Photo")');
    await page.waitForTimeout(2000);
    await page.click('button:text("Stop Camera")');
    await page.waitForTimeout(1500);
    await page.click('button:text("Enter Manually")');
    await page.waitForTimeout(3000);
    await page.click('button:text("Use San Francisco")');
    await page.waitForTimeout(3000);
    await page.click('button:text("Use These Coordinates")');
    await page.waitForTimeout(3000);
    await page.click('button:text("Settings")');
    await page.waitForTimeout(2000);
    await page.click('button:text("Low")');
    await page.waitForTimeout(2000);
    await page.click('button:text("Stop Tracking")');
    await page.waitForTimeout(1500);

    await browser.close();
    await db.close();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Automation error:', error);
    await browser.close();
    await db.close();
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

// Helper function to generate hash for screenshots
async function generateHash(buffer) {
  const msgUint8 = new TextEncoder().encode(buffer.toString('base64'));
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
