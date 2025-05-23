import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    screen: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Set window to fullscreen
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.evaluate(() => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  });

  await page.goto('http://localhost:4321');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'step1.png' });
  await page.waitForTimeout(1000);

  await page.click('a.enter-button');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'step2.png' });
  await page.waitForTimeout(1000);

  const clmElement = await page.locator('pre', { hasText: '"type":"clm_document"' }).first();
  await clmElement.scrollIntoViewIfNeeded();
  await clmElement.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'step3.png' });
  await page.waitForTimeout(1000);

  const runningText1 = await page.locator('h3', { hasText: 'Python Interactive Console' }).first();
  await runningText1.scrollIntoViewIfNeeded();
  await runningText1.focus();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'step4.png' });
  await page.waitForTimeout(1000);

  await page.click('button:has-text("Execute CLM")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'step5.png' });
  await page.waitForTimeout(1000);

  const runningText2 = await page.locator('h3', { hasText: 'Python Interactive Console' }).first();
  await runningText2.scrollIntoViewIfNeeded();
  await runningText2.focus();
  await page.waitForTimeout(1000);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await page.locator("text=Running Python script...").waitFor({ timeout: 10000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'step6.png' });
  await page.waitForTimeout(1000);

  await page.click('button:has-text("Clear")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'step7.png' });
  await page.waitForTimeout(1000);

  await browser.close();
})();
