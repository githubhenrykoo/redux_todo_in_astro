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

  // Wait for the page to load
  await page.waitForTimeout(2000);
  
  // Step 1: Click on the code editor button in the sidebar
  console.log('Clicking on code editor button...');
  await page.click('#todoLayoutBtn');

  // Wait for the page to load
  await page.waitForTimeout(2000);
  
  // Wait for the chatbot to be fully loaded
  await page.waitForSelector('textarea[placeholder="Type your message here..."]', { timeout: 10000 });
  
  console.log('Chatbot loaded, preparing to run commands...');
  
  // Wait a moment for the chatbot to be fully initialized
  await page.waitForTimeout(1000);
  
  // Focus the input field
  await page.click('textarea[placeholder="Type your message here..."]');
  
  // Type the first command to create testing.txt character by character
  const createCommand = '$echo "testing" >> testing.txt';
  console.log('Typing create file command slowly...');
  
  for (const char of createCommand) {
    await page.keyboard.type(char);
    await page.waitForTimeout(150); // 150ms delay between each character
  }
  
  // Send the command
  await page.waitForTimeout(500); // Pause before pressing Enter
  await page.keyboard.press('Enter');
  
  // Wait for the command to execute
  await page.waitForTimeout(2000);
  
  // Take a screenshot after creating the file
  const screenshotsDir: string = path.join(process.cwd(), 'tests', 'data');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  const screenshot1Path: string = path.join(screenshotsDir, `create-file-${new Date().toISOString().replace(/:/g, '-')}.png`);
  await page.screenshot({ path: screenshot1Path });
  console.log(`Screenshot after creating file saved to: ${screenshot1Path}`);
  
  await page.waitForTimeout(1000);

  // Type the second command to read testing.txt character by character
  await page.click('textarea[placeholder="Type your message here..."]');
  const readCommand = '$cat testing.txt';
  console.log('Typing read file command slowly...');
  
  for (const char of readCommand) {
    await page.keyboard.type(char);
    await page.waitForTimeout(150); // 150ms delay between each character
  }
  
  // Send the command
  await page.waitForTimeout(500); // Pause before pressing Enter
  await page.keyboard.press('Enter');
  
  // Wait for the command to execute
  await page.waitForTimeout(2000);
  
  // Take a screenshot after reading the file
  const screenshot2Path: string = path.join(screenshotsDir, `read-file-${new Date().toISOString().replace(/:/g, '-')}.png`);
  await page.screenshot({ path: screenshot2Path });
  console.log(`Screenshot after reading file saved to: ${screenshot2Path}`);
  
  await page.waitForTimeout(1000);

  // Type the third command to delete testing.txt character by character
  await page.click('textarea[placeholder="Type your message here..."]');
  const deleteCommand = '$rm testing.txt';
  console.log('Typing delete file command slowly...');
  
  for (const char of deleteCommand) {
    await page.keyboard.type(char);
    await page.waitForTimeout(150); // 150ms delay between each character
  }
  
  // Send the command
  await page.waitForTimeout(500); // Pause before pressing Enter
  await page.keyboard.press('Enter');
  
  // Wait for the command to execute
  await page.waitForTimeout(2000);
  
  // Take a screenshot after deleting the file
  const screenshot3Path: string = path.join(screenshotsDir, `delete-file-${new Date().toISOString().replace(/:/g, '-')}.png`);
  await page.screenshot({ path: screenshot3Path });
  console.log(`Screenshot after deleting file saved to: ${screenshot3Path}`);
  
  await page.waitForTimeout(1000);

  console.log('Commands executed successfully');
  
  // Keep the browser open for a moment to see the results
  await page.waitForTimeout(1000);
  
  // Close the browser
  await browser.close();
})().catch((err: Error) => {
  console.error('Error running Playwright script:', err);
  process.exit(1);
});