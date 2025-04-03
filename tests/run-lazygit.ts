import { chromium } from '@playwright/test';
import type { Browser, Page } from 'playwright';
import path from 'path';
import fs from 'fs';

(async (): Promise<void> => {
  // Launch the browser
  const browser: Browser = await chromium.launch({
    headless: false,
    slowMo: 100 // Slow down operations for better visibility
  });
  
  // Create a new page
  const page: Page = await browser.newPage();
  
  // Navigate to your app
  await page.goto('http://localhost:4321');
  
  console.log('Page loaded, navigating to code editor...');
  
  // Step 1: Click on the "Enter Page" button
  console.log('Clicking on Enter Page button...');
  await page.click('a.enter-button:has-text("Enter Page")');
  
  // Wait for the page navigation to complete
  await page.waitForTimeout(2000);

  // Wait for the page to load
  await page.waitForTimeout(3000);
  
  // Step 1: Click on the code editor button in the sidebar
  console.log('Clicking on code editor button...');
  await page.click('#todoLayoutBtn');
  
  // Wait for the terminal to be fully loaded
  await page.waitForSelector('.xterm-screen', { timeout: 10000 });
  console.log('Terminal loaded successfully');
  
  // Wait a moment for the terminal to be fully initialized
  await page.waitForTimeout(2000);
  
  // Create screenshots directory if it doesn't exist
  const screenshotsDir: string = path.join(process.cwd(), 'tests', 'data');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  // Take a screenshot before typing command
  const beforeScreenshot: string = path.join(screenshotsDir, `terminal-before-${new Date().toISOString().replace(/:/g, '-')}.png`);
  await page.screenshot({ path: beforeScreenshot });
  console.log(`Screenshot before command saved to: ${beforeScreenshot}`);
  
  await page.waitForTimeout(1000);

  // Focus the terminal by clicking on it
  await page.click('.xterm-screen');
  
  // Step 2: Type the lazygit command character by character with delay
  console.log('Typing lazygit command slowly...');
  const command = 'lazygit';
  
  for (const char of command) {
    await page.keyboard.type(char);
    await page.waitForTimeout(200); // 200ms delay between each character
  }

  await page.waitForTimeout(1000);
  
  // Take a screenshot after typing the command
  const typedScreenshot: string = path.join(screenshotsDir, `terminal-typed-${new Date().toISOString().replace(/:/g, '-')}.png`);
  await page.screenshot({ path: typedScreenshot });
  console.log(`Screenshot after typing command saved to: ${typedScreenshot}`);
  
  await page.waitForTimeout(1000);

  // Step 3: Press Enter to execute the command
  console.log('Executing lazygit command...');
  await page.waitForTimeout(500); // Pause before pressing Enter
  await page.keyboard.press('Enter');
  
  // Wait for lazygit to load
  await page.waitForTimeout(5000);
  
  // Take a screenshot of lazygit running
  const lazygitScreenshot: string = path.join(screenshotsDir, `lazygit-running-${new Date().toISOString().replace(/:/g, '-')}.png`);
  await page.screenshot({ path: lazygitScreenshot });
  console.log(`Screenshot of lazygit running saved to: ${lazygitScreenshot}`);
  
  console.log('Lazygit should now be running in the terminal');
  
  // Keep the browser open for a moment to see the results
  await page.waitForTimeout(3000);
  
  // Press 'q' to exit lazygit
  await page.keyboard.press('q');
  
  // Wait a moment for lazygit to close
  await page.waitForTimeout(2000);
  
  // Take a final screenshot after exiting lazygit
  const afterScreenshot: string = path.join(screenshotsDir, `terminal-after-${new Date().toISOString().replace(/:/g, '-')}.png`);
  await page.screenshot({ path: afterScreenshot });
  console.log(`Screenshot after exiting lazygit saved to: ${afterScreenshot}`);
  
  console.log('All actions completed successfully');
  
  // Close the browser
  await browser.close();
})().catch((err: Error) => {
  console.error('Error running Playwright script:', err);
  process.exit(1);
});