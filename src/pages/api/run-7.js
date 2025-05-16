import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('https://example.com'); // Ganti dengan URL target

  const content = await page.content();

  // Regex untuk mendeteksi blok kode dengan triple backtick
  const regex = /```[\s\S]*?```/g;

  const matches = content.match(regex);

  if (matches && matches.length > 0) {
    console.log('Blok kode ditemukan!');
    matches.forEach((match, i) => {
      console.log(`Blok ${i + 1}:`);
      console.log(match);
    });
  } else {
    console.log('Tidak ada blok kode yang ditemukan.');
  }

  await browser.close();
})();
