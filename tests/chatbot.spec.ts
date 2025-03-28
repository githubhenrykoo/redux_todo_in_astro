import { test, expect } from '@playwright/test';

test('Chatbot UI elements are visible', async ({ page }) => {
  // Navigate to the main page
  await page.goto('http://localhost:4322');

  // Wait for chatbot panel to load
  await page.waitForSelector('div[class*="bg-gray-900"]');

  // Find the chatbot input, should be a textarea not an input
  const chatInput = await page.locator('textarea[placeholder="Type your message here..."]');
  
  // Find the send button - it's a button with an SVG icon
  const sendButton = await page.locator('button[class*="bg-blue-600"], button[class*="bg-gray-700"]').first();

  // Find the model selector
  const modelSelector = await page.locator('select[class*="bg-gray-700"]');

  // Check page title
  const title = await page.locator('div[class*="text-center flex-grow"]');

  // Ensure elements are visible
  await expect(chatInput).toBeVisible({ timeout: 10000 });
  await expect(sendButton).toBeVisible({ timeout: 10000 });
  await expect(modelSelector).toBeVisible({ timeout: 10000 });
  await expect(title).toContainText('ChatBot', { timeout: 10000 });
});

test('Chatbot model selection works', async ({ page }) => {
  // Navigate to the main page
  await page.goto('http://localhost:4322');

  // Wait for chatbot panel to load
  await page.waitForSelector('div[class*="bg-gray-900"]');

  // Find model selector
  const modelSelector = await page.locator('select[class*="bg-gray-700"]');

  // Ensure selector is visible
  await expect(modelSelector).toBeVisible({ timeout: 10000 });

  // Select 'llama3' option
  await modelSelector.selectOption({ label: 'llama3' });

  // Verify selection
  const selectedOption = await modelSelector.inputValue();
  expect(selectedOption).toBe('llama3');
});

test('Chatbot basic UI test', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:4322');
  
  console.log('Page loaded, waiting for elements...');

  // Create timestamp for unique filenames
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Take a screenshot to help debug and save to tests/data
  await page.screenshot({ path: `tests/data/chatbot-test-${timestamp}.png` });

  // Try to find the textarea by its attributes and class
  const textarea = page.locator('textarea[class*="bg-gray-800"]');
  
  // Allow more time for elements to appear
  await expect(textarea).toBeVisible({ timeout: 30000 });
  
  // If the textarea is found, try to type something
  await textarea.fill('Hello world');
  
  // Verify the text was entered
  await expect(textarea).toHaveValue('Hello world');
  
  // Take another screenshot after interaction
  await page.screenshot({ path: `tests/data/chatbot-test-after-typing-${timestamp}.png` });
  
  console.log('Test completed successfully');
});
