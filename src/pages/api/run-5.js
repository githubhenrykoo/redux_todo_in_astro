import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    screen: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.evaluate(() => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  });

  await page.goto('http://localhost:4321');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'step1.png' });
  await page.waitForTimeout(1000);

  await page.click('a.enter-button');
  await page.waitForTimeout(1000);

  await page.click('#catalogLayoutBtn');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'step2.png' });
  await page.waitForTimeout(1000);

  await page.fill('input#title', 'Playwright Testing');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'step3.png' });
  await page.waitForTimeout(1000);

  await page.fill('textarea[placeholder="Describe the context of this Cubical Logic Model..."]', 'Playwright Testing');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'step4.png' });
  await page.waitForTimeout(1000);

  await page.fill('textarea[placeholder="Define the primary goal of this model..."]', 'Playwright Testing');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'step5.png' });
  await page.waitForTimeout(1000);

  await page.fill('textarea[placeholder="List the success criteria for this model..."]', 'Playwright Testing');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'step6.png' });
  await page.waitForTimeout(1000);

  await page.click('button:has-text("Concrete Implementation")');
  await page.waitForTimeout(1000);

  const fileInput = await page.locator('input[type="file"]').first();
  await fileInput.setInputFiles('playwright_logs/playwrightclmconversationalprogramming/Playwright_Testing.py');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'step7.png' });
  await page.waitForTimeout(1000);

  await page.fill('input#title', 'Playwright Testing');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'step8.png' });
  await page.waitForTimeout(1000);

  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'step9.png' });
  await page.waitForTimeout(1000);

  await page.locator('button.btn-refresh[title="Refresh catalog"]').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'step10.png' });
  await page.waitForTimeout(1000);

  const clmElement = await page.locator('pre', { hasText: '"type":"clm_document"' }).first();
  await clmElement.scrollIntoViewIfNeeded();
  await clmElement.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'step11.png' });
  await page.waitForTimeout(1000);

  const runningText1 = await page.locator('h3', { hasText: 'Python Interactive Console' }).first();
  await runningText1.scrollIntoViewIfNeeded();
  await runningText1.focus();
  await page.waitForTimeout(1000);

  await page.click('button:has-text("Execute CLM")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'step12.png' });
  await page.waitForTimeout(1000);

  const runningText2 = await page.locator('h3', { hasText: 'Python Interactive Console' }).first();
  await runningText2.scrollIntoViewIfNeeded();
  await runningText2.focus();
  await page.waitForTimeout(1000);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await page.locator("text=Running Python script...").waitFor({ timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'step13.png' });
  await page.waitForTimeout(1000);

  await page.click('button:has-text("Clear")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'step14.png' });
  await page.waitForTimeout(1000);

  await browser.close();
})();
