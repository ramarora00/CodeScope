import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 950 });
  await page.goto('http://localhost:5174/');
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'phase9_1_manual_capture.png' });
  await browser.close();
  console.log('Screenshot saved to phase9_1_manual_capture.png');
})();
