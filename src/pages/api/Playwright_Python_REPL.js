import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false }); // Launch in visible mode
  const context = await browser.newContext({
    viewport: null
  });
  const page = await context.newPage();

  await page.goto('http://localhost:4321');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'step1.png' });
  await page.waitForTimeout(2000);

  await page.click('a.enter-button');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'step2.png' });
  await page.waitForTimeout(2000);

  const clmElement = await page.locator('pre', { hasText: '"type":"clm_document"' });
  await clmElement.scrollIntoViewIfNeeded();
  await clmElement.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'step3.png' });
  await page.waitForTimeout(3000);

  const runningText1 = await page.locator('h3', { hasText: 'Python Interactive Console' });
  await runningText1.scrollIntoViewIfNeeded();
  await runningText1.focus();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'step4.png' });
  await page.waitForTimeout(3000);

  await page.click('button:has-text("Execute CLM")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'step5.png' });
  await page.waitForTimeout(3000);

  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(1000);

  const runningText2 = await page.locator('span', { hasText: 'Running Python script...' });
  await runningText2.scrollIntoViewIfNeeded();
  await runningText2.focus();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'step6.png' });
  await page.waitForTimeout(3000);

  await page.click('button:has-text("Clear")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'step7.png' });
  await page.waitForTimeout(3000);

  await browser.close();
})();
