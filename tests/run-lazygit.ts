import { chromium } from '@playwright/test';
import type { Browser, Page } from 'playwright';
import path from 'path';
import fs from 'fs';

(async (): Promise<void> => {
  // Launch the browser
  const browser: Browser = await chromium.launch({
    headless: false,
    slowMo: 50 // Slow down operations for better visibility
  });
  
  // Create a new page
  const page: Page = await browser.newPage();
  
  // Navigate to your app
  await page.goto('http://localhost:4321');
  
  // Wait for the terminal to be fully loaded
  await page.waitForSelector('.xterm-screen', { timeout: 10000 });
  
  console.log('Terminal loaded, preparing to run lazygit...');
  
  // Wait a moment for the terminal to be fully initialized
  await page.waitForTimeout(1000);
  
  // Focus the terminal by clicking on it
  await page.click('.xterm-screen');
  
  // Type the lazygit command
  await page.keyboard.type('lazygit');
  await page.keyboard.press('Enter');
  
  console.log('Lazygit command sent to terminal');
  
  // Wait for Lazygit to load
  await page.waitForTimeout(5000);
  
  console.log('Lazygit should now be running in the terminal');
  
  // Create screenshots directory if it doesn't exist
  const screenshotsDir: string = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }
  
  // Take a screenshot of Lazygit
  const screenshotPath: string = path.join(screenshotsDir, `lazygit-${new Date().toISOString().replace(/:/g, '-')}.png`);
  await page.screenshot({ path: screenshotPath });
  console.log(`Screenshot saved to: ${screenshotPath}`);
  
  console.log('Keeping browser open for interaction...');
  
  // Keep the browser open for interaction
  await page.waitForTimeout(2000);
  
  // Press 'q' to exit Lazygit
  await page.keyboard.press('q');
  
  // Wait a moment for Lazygit to close
  await page.waitForTimeout(1000);
  
  console.log('Exiting Lazygit and closing browser');
  
  // Close the browser
  await browser.close();
})().catch((err: Error) => {
  console.error('Error running Playwright script:', err);
  process.exit(1);
});