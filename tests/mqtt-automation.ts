import { chromium } from '@playwright/test';
import type { Browser, Page, BrowserContext } from 'playwright';
import path from 'path';
import fs from 'fs';

(async (): Promise<void> => {
  // Launch the browser
  const browser: Browser = await chromium.launch({
    headless: false,
    slowMo: 100 // Slow down operations for better visibility
  });
  
  // Create a browser context with full screen configuration
  const context: BrowserContext = await browser.newContext({
    viewport: null, // This will use the maximum viewport size
    screen: { width: 1920, height: 1080 } // Common full HD resolution
  });
  
  // Create a new page in the full screen context
  const page: Page = await context.newPage();
  
  // Maximize the window (as close to full screen as possible)
  await page.evaluate(() => {
    window.moveTo(0, 0);
    window.resizeTo(screen.width, screen.height);
  });
  
  // Navigate to your app's main page
  await page.goto('http://localhost:4321');
  
  console.log('Main page loaded, waiting for Enter Page button...');
  
  // Wait for the page to load
  await page.waitForTimeout(2000);
  
  // Step 1: Click on the "Enter Page" button
  console.log('Clicking on Enter Page button...');
  await page.click('a.enter-button:has-text("Enter Page")');
  
  // Wait for the page navigation to complete
  await page.waitForTimeout(2000);
  
  // Step 2: Click on the MQTT Dashboard button in the sidebar using its ID
  console.log('Clicking on MQTT Dashboard button...');
  await page.click('#mqttDashboardLayoutBtn');
  
  // Wait for the MQTT Dashboard to be fully loaded
  await page.waitForSelector('text=MQTT Dashboard - Dark Mode', { timeout: 10000 });
  console.log('MQTT Dashboard loaded successfully');
  
  // Create screenshots directory if it doesn't exist
  const screenshotsDir: string = path.join(process.cwd(), 'tests', 'data');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  // Take a screenshot of the dashboard
  const dashboardScreenshot: string = path.join(screenshotsDir, `mqtt-dashboard-${new Date().toISOString().replace(/:/g, '-')}.png`);
  await page.screenshot({ path: dashboardScreenshot, fullPage: true });
  console.log(`Dashboard screenshot saved to: ${dashboardScreenshot}`);
  
  await page.waitForTimeout(2000);
  
  // Step 2: Click on the "Turn on LED" button with a more specific selector
  console.log('Turning on the LED...');
  await page.click('button:has-text("On LED")');
  
  // Wait for the action to take effect
  await page.waitForTimeout(2000);
  
  // Take a screenshot after turning on the LED
  const ledOnScreenshot: string = path.join(screenshotsDir, `led-on-${new Date().toISOString().replace(/:/g, '-')}.png`);
  await page.screenshot({ path: ledOnScreenshot, fullPage: true });
  console.log(`LED on screenshot saved to: ${ledOnScreenshot}`);
  
  // Step 3: Type "Testing" in the input field with current time character by character
  console.log('Typing message with current time...');
  const currentTime = new Date().toLocaleTimeString();
  const messageToType = `time: ${currentTime}`;
  
  // Focus on the input field first
  await page.click('input[placeholder="Enter your message here..."]');
  
  // Clear any existing text
  await page.fill('input[placeholder="Enter your message here..."]', '');
  
  // Type each character with a small delay to make it visible
  for (const char of messageToType) {
    await page.keyboard.type(char);
    await page.waitForTimeout(100); // Add a small delay between each character
  }
  
  // Take a screenshot after typing the message
  const messageTypedScreenshot: string = path.join(screenshotsDir, `message-typed-${new Date().toISOString().replace(/:/g, '-')}.png`);
  await page.screenshot({ path: messageTypedScreenshot, fullPage: true });
  console.log(`Message typed screenshot saved to: ${messageTypedScreenshot}`);
  
  // Step 4: Click the send button
  console.log('Sending message...');
  await page.click('button:has-text("Send")');
  
  // Wait for the action to take effect
  await page.waitForTimeout(2000);
  
  // Take a screenshot after sending the message
  const messageSentScreenshot: string = path.join(screenshotsDir, `message-sent-${new Date().toISOString().replace(/:/g, '-')}.png`);
  await page.screenshot({ path: messageSentScreenshot, fullPage: true });
  console.log(`Message sent screenshot saved to: ${messageSentScreenshot}`);
  
  // Step 5: Turn off the LED (assuming there's a "Matikan LED" button)
  console.log('Turning off the LED...');
  await page.click('button:has-text("Off LED")');
  
  // Wait for the action to take effect
  await page.waitForTimeout(2000);
  
  // Take a screenshot after turning off the LED
  const ledOffScreenshot: string = path.join(screenshotsDir, `led-off-${new Date().toISOString().replace(/:/g, '-')}.png`);
  await page.screenshot({ path: ledOffScreenshot, fullPage: true });
  console.log(`LED off screenshot saved to: ${ledOffScreenshot}`);
  
  console.log('All actions completed successfully');
  
  // Keep the browser open for a moment to see the results
  await page.waitForTimeout(3000);
  
  // Close the browser
  await browser.close();
})().catch((err: Error) => {
  console.error('Error running Playwright script:', err);
  process.exit(1);
});