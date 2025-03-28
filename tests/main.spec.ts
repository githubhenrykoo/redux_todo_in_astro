import { test, expect } from '@playwright/test';

test('Application loads and renders main components', async ({ page }) => {
  // Navigate to the main page
  await page.goto('http://localhost:4322');

  // Wait for page to load
  await page.waitForSelector('div[class*="flex flex-col"]');

  // Check for key UI elements using more specific selectors
  const chatbotPanel = await page.locator('div[class*="bg-gray-900"]:has-text("ChatBot")');
  const searchPanel = await page.locator('div[class*="search-panel"]');
  const contentPanel = await page.locator('div[class*="content-panel"]');

  // Verify panels are visible
  await expect(chatbotPanel).toBeVisible({ timeout: 10000 });
  await expect(searchPanel).toBeVisible({ timeout: 10000 });
  await expect(contentPanel).toBeVisible({ timeout: 10000 });

  // Check page title
  const pageTitle = await page.title();
  expect(pageTitle).toContain('Redux Todo');
});
