const puppeteer = require('puppeteer');
const path = require('path');
const express = require('express');

async function runTests() {
  const app = express();
  
  // Mock API states
  let mockRepos = [];
  let userLoggedIn = true;

  // Serve static built frontend
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('/api/repo', (req, res) => {
    if (!userLoggedIn) return res.status(401).json({ error: 'unauthorized' });
    res.json(mockRepos);
  });

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`Test server running at ${baseUrl}`);

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Inject mock Firebase Auth
    await page.evaluateOnNewDocument(() => {
      window.__MOCK_FIREBASE_AUTH__ = true;
      // We overwrite the imported subscribeToAuthChanges in App.jsx via window object?
      // No, we can't easily mock ES modules. 
      // But we can intercept the fetch calls if we just bypass auth!
    });
    // Wait! Since we can't easily mock Firebase Auth without code changes, let's use the REAL dev server or intercept?
    // Actually, we can intercept network requests and mock Firebase APIs!
    await page.setRequestInterception(true);
    page.on('request', req => {
      const url = req.url();
      if (url.includes('identitytoolkit.googleapis.com')) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            users: [{ localId: 'test_user_id', email: 'test@example.com' }]
          })
        });
      } else if (url.includes('securetoken.googleapis.com')) {
         req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock_token',
            expires_in: '3600'
          })
        });
      } else if (url.includes('/api/repo')) {
         req.respond({
           status: userLoggedIn ? 200 : 401,
           contentType: 'application/json',
           body: JSON.stringify(userLoggedIn ? mockRepos : {error: 'unauthorized'})
         });
      } else {
        req.continue();
      }
    });

    console.log('Testing 67% refresh...');
    mockRepos = [{
      id: 'repo-1',
      status: 'syncing',
      indexingProgress: 67,
      totalChunks: 100,
      processedChunks: 67
    }];
    
    // Set localStorage
    await page.goto(baseUrl);
    await page.evaluate(() => {
      localStorage.setItem('codescope_last_repo_id', 'repo-1');
    });
    
    // Go to workspace hash
    await page.goto(`${baseUrl}/#workspace`);
    await page.waitForTimeout(1000);
    
    // Read DOM
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('DOM at 67%:', bodyText.includes('SYNCING 67%') ? 'PASS' : 'FAIL');
    
    await browser.close();
    server.close();
  });
}

runTests().catch(console.error);
