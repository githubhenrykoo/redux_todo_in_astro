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
      
      // Create a File object from the screenshot buffer
      const file = new Blob([screenshot], { type: 'image/png' });
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file, `${name}.png`);
      
      const metadata = {
        fileName: `${name}.png`,
        mimeType: 'image/png',
        size: screenshot.length,
        description: `Playwright automated test screenshot: ${name}`,
        timestamp: timestamp,
        source: 'playwright_automation'
      };
      
      formData.append('metadata', JSON.stringify(metadata));
      formData.append('action', 'add');
      
      // Upload using the catalog API
      const response = await fetch('http://localhost:4321/api/card-collection?action=add', {
        method: 'POST',
        body: formData
      });
  
      if (!response.ok) {
        throw new Error(`Failed to upload screenshot: ${response.statusText}`);
      }
  
      const result = await response.json();
      return result.hash;
    } catch (error) {
      console.error(`Error saving screenshot ${name}:`, error);
      throw error;
    }
  }

  try {
    // Set viewport + fullscreen
    await page.setViewportSize({ width: 1500, height: 900 });
    await page.setViewportSize({ width: 1500, height: 900 });
    await page.evaluate(() => {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    });

    // Initial page load
    await page.goto('http://localhost:4321');
    await page.waitForTimeout(1000);
    const screenshot1 = await page.screenshot();
    await saveScreenshot('initial_page_load', screenshot1);

    // Enter page
    await page.click('a.enter-button');
    await page.waitForTimeout(1000);
    const screenshot2 = await page.screenshot();
    await saveScreenshot('enter_page_view', screenshot2);

    // Catalog layout
    await page.click('button#catalogLayoutBtn');
    await page.waitForTimeout(1000);
    const screenshot3 = await page.screenshot();
    await saveScreenshot('catalog_layout_view', screenshot3);

    // Title input
    await page.fill('input#title', 'Playwright Testing');
    await page.waitForTimeout(1000);

    // Context description
    await page.fill('textarea[placeholder="Describe the context of this Cubical Logic Model..."]', 'Playwright Testing');
    await page.waitForTimeout(1000);

    // Goal definition
    await page.fill('textarea[placeholder="Define the primary goal of this model..."]', 'Playwright Testing');
    await page.waitForTimeout(1000);

    // Success criteria
    await page.fill('textarea[placeholder="List the success criteria for this model..."]', 'Playwright Testing');
    await page.waitForTimeout(1000);

    // Concrete Implementation view
    await page.click('button:has-text("Concrete Implementation")');
    const screenshot8 = await page.screenshot();

    // File upload
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles('playwright_logs/playwrightclmconversationalprogramming/Playwright_Testing.py');
    await page.waitForTimeout(1000);
    const screenshot9 = await page.screenshot();
    await saveScreenshot('file_upload_complete', screenshot9);

    // Save CLM
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForTimeout(1000);
    const screenshot10 = await page.screenshot();
    await saveScreenshot('clm_saved', screenshot10);

    // Refresh catalog
    await page.locator('button.btn-refresh[title="Refresh catalog"]').click();
    await page.waitForTimeout(1000);
    const screenshot11 = await page.screenshot();
    await saveScreenshot('catalog_refreshed', screenshot11);

    // CLM document selection
    const clmElement = await page.locator('pre', { hasText: '"type":"clm_document"' }).first();
    await clmElement.scrollIntoViewIfNeeded();
    await clmElement.click();
    await page.waitForTimeout(1000);
    const screenshot12 = await page.screenshot();
    await saveScreenshot('clm_document_selected', screenshot12);

    // Execute CLM
    await page.click('button:has-text("Execute CLM")');
    await page.waitForTimeout(1000);
    const screenshot13 = await page.screenshot();
    await saveScreenshot('execute_clm_clicked', screenshot13);

    // Python console
    const runningText2 = await page.locator('h3', { hasText: 'Python Interactive Console' }).first();
    await runningText2.scrollIntoViewIfNeeded();
    await runningText2.focus();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(10000);
    await page.waitForTimeout(10000);
    await page.locator("text=Running Python script...").waitFor({ timeout: 10000 });
    const screenshot14 = await page.screenshot();
    await saveScreenshot('python_console_running', screenshot14);

    // Clear console
    await page.click('button:has-text("Clear")');
    await page.waitForTimeout(1000);
    const screenshot15 = await page.screenshot();
    await saveScreenshot('console_cleared', screenshot15);

    // YouTube Layout section
    await page.click('#youtubeLayoutBtn');
    await page.waitForTimeout(2500);
    const screenshot16 = await page.screenshot();
    await saveScreenshot('youtube_layout_view', screenshot16);

    // Message input
    const message = 'Explain to me about addition with carry over.';
    const textarea = await page.locator('textarea[placeholder="Type your message here..."]');
    for (const char of message) {
      await textarea.type(char, { delay: 100 });
    }
    await page.waitForTimeout(1000);
    const screenshot17 = await page.screenshot();
    await saveScreenshot('message_input_complete', screenshot17);

    // Send message
    await page.click('button.bg-blue-600.text-white');
    await page.waitForTimeout(6000);
    const screenshot18 = await page.screenshot();
    await saveScreenshot('message_sent', screenshot18);

    // YouTube URL input
    const youtubeUrl = 'https://www.youtube.com/watch?v=yOGFZyiQZUU';
    const urlInput = await page.locator('input[placeholder*="Enter YouTube URL"]');
    await urlInput.fill('');
    await page.waitForTimeout(500);
    for (const char of youtubeUrl) {
      await urlInput.type(char, { delay: 100 });
    }
    await page.waitForTimeout(1000);
    const screenshot19 = await page.screenshot();
    await saveScreenshot('youtube_url_entered', screenshot19);

    // Load video
    await page.click('button:text("Load")');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    const screenshot20 = await page.screenshot();
    await saveScreenshot('video_loaded', screenshot20);

    // Play video
    const youtubeFrame = await page.frameLocator('iframe[src*="youtube"]');
    await youtubeFrame.locator('.ytp-large-play-button-red-bg').click();
    await page.waitForTimeout(6000);
    const screenshot21 = await page.screenshot();
    await saveScreenshot('video_playing', screenshot21);

    // Calculator operations
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
    const screenshot22 = await page.screenshot();
    await saveScreenshot('calculator_operation', screenshot22);

    // Camera Layout section
    await page.click('#cameraLayoutBtn');
    await page.waitForTimeout(2500);
    const screenshot23 = await page.screenshot();
    await saveScreenshot('camera_layout_view', screenshot23);

    // Search location
    const searchInput = await page.locator('input[placeholder*="Try: New York, London, Tokyo"]');
    await searchInput.type('London', { delay: 100 });
    await page.waitForTimeout(1000);
    const screenshot24 = await page.screenshot();
    await saveScreenshot('location_search', screenshot24);

    // Camera operations
    await page.click('button:text("Search")');
    await page.waitForTimeout(2000);
    const screenshot25 = await page.screenshot();
    await saveScreenshot('location_searched', screenshot25);

    await page.click('button:text("Take Photo")');
    await page.waitForTimeout(2000);
    const screenshot26 = await page.screenshot();
    await saveScreenshot('photo_taken', screenshot26);

    // Camera settings
    await page.click('button:text("Settings")');
    await page.waitForTimeout(2000);
    const screenshot27 = await page.screenshot();
    await saveScreenshot('camera_settings', screenshot27);

    await page.click('button:text("Stop Tracking")');
    await page.waitForTimeout(1500);
    const screenshot28 = await page.screenshot();
    await saveScreenshot('tracking_stopped', screenshot28);

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