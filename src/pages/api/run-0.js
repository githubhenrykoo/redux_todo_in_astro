import { chromium } from '@playwright/test';

export async function POST({ request }) {
  const browser = await chromium.launch({ headless: false });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    screen: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  try {
    // Set viewport + fullscreen
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.evaluate(() => {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    });

    await page.goto('http://localhost:4321');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'step1.png' });

    // Masuk halaman
    await page.click('a.enter-button');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'step2.png' });

    // Isi data CLM
    await page.fill('input#title', 'Playwright Testing');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'step3.png' });

    await page.fill('textarea[placeholder="Describe the context of this Cubical Logic Model..."]', 'Playwright Testing');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'step4.png' });

    await page.fill('textarea[placeholder="Define the primary goal of this model..."]', 'Playwright Testing');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'step5.png' });

    await page.fill('textarea[placeholder="List the success criteria for this model..."]', 'Playwright Testing');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'step6.png' });

    await page.click('button:has-text("Concrete Implementation")');
    await page.waitForTimeout(1000);

    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles('playwright_logs/playwrightclmconversationalprogramming/Playwright_Testing.py');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'step7.png' });

    await page.fill('input#title', 'Playwright Testing');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'step8.png' });

    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'step9.png' });

    await page.locator('button.btn-refresh[title="Refresh catalog"]').click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'step10.png' });

    const clmElement = await page.locator('pre', { hasText: '"type":"clm_document"' }).first();
    await clmElement.scrollIntoViewIfNeeded();
    await clmElement.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'step11.png' });

    await page.click('button:has-text("Execute CLM")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'step12.png' });

    const runningText2 = await page.locator('h3', { hasText: 'Python Interactive Console' }).first();
    await runningText2.scrollIntoViewIfNeeded();
    await runningText2.focus();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.locator("text=Running Python script...").waitFor({ timeout: 10000 });
    await page.screenshot({ path: 'step13.png' });

    await page.click('button:has-text("Clear")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'step14.png' });

    // === SECTION A: YouTube Layout Automation ===
    await page.click('#youtubeLayoutBtn');
    await page.waitForTimeout(2500);

    const message = 'Explain to me about addition with carry over.';
    const textarea = await page.locator('textarea[placeholder="Type your message here..."]');
    for (const char of message) {
      await textarea.type(char, { delay: 100 });
    }
    await page.waitForTimeout(1000);

    await page.click('button.bg-blue-600.text-white');
    await page.waitForTimeout(6000);

    const youtubeUrl = 'https://www.youtube.com/watch?v=yOGFZyiQZUU';
    const urlInput = await page.locator('input[placeholder*="Enter YouTube URL"]');
    await urlInput.fill('');
    await page.waitForTimeout(500);
    for (const char of youtubeUrl) {
      await urlInput.type(char, { delay: 100 });
    }
    await page.waitForTimeout(1000);

    await page.click('button:text("Load")');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    const youtubeFrame = await page.frameLocator('iframe[src*="youtube"]');
    await youtubeFrame.locator('.ytp-large-play-button-red-bg').click();
    await page.waitForTimeout(6000);

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

    await youtubeFrame.locator('.html5-main-video').click();
    await page.waitForTimeout(5000);

    // === SECTION B: Camera Layout Automation ===
    await page.click('#cameraLayoutBtn');
    await page.waitForTimeout(2500);

    const searchInput = await page.locator('input[placeholder*="Try: New York, London, Tokyo"]');
    await searchInput.type('London', { delay: 100 });
    await page.waitForTimeout(1000);

    await page.click('button:text("Search")');
    await page.waitForTimeout(2000);
    await page.click('button:text("Take Photo")');
    await page.waitForTimeout(2000);
    await page.click('button:text("Stop Camera")');
    await page.waitForTimeout(1500);
    await page.click('button:text("Enter Manually")');
    await page.waitForTimeout(3000);
    await page.click('button:text("Use San Francisco")');
    await page.waitForTimeout(3000);
    await page.click('button:text("Use These Coordinates")');
    await page.waitForTimeout(3000);
    await page.click('button:text("Settings")');
    await page.waitForTimeout(2000);
    await page.click('button:text("Low")');
    await page.waitForTimeout(2000);
    await page.click('button:text("Stop Tracking")');
    await page.waitForTimeout(1500);

    await browser.close();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Automation error:', error);
    await browser.close();
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
