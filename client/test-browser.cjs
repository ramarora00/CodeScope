const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Capture all console logs
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()} - ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    console.log(`[BROWSER ERROR] ${err.message}`);
  });

  console.log('Navigating to localhost:5173...');
  await page.goto('http://localhost:5173');

  // Wait for the input field to be ready
  await page.waitForSelector('input[type="text"]');
  console.log('Typing repo URL...');
  
  await page.type('input[type="text"]', 'https://github.com/heroku/node-js-getting-started');
  await page.click('button[type="submit"]');

  console.log('Submitted. Waiting for 30s to trace processing and workspace transition...');
  await new Promise(r => setTimeout(r, 30000));

  console.log('Taking screenshot...');
  await page.screenshot({ path: 'debug_screenshot.png' });

  await browser.close();
  console.log('Done.');
})();
