import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/ramar/.gemini/antigravity-ide/brain/cc255fef-5dae-4df3-b889-2c2ef2fe7ace';

async function run() {
  console.log('Starting Puppeteer verification script...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1200, height: 800 });

  page.on('console', msg => {
    console.log('[BROWSER CONSOLE]', msg.text());
  });

  page.on('pageerror', err => {
    console.error('[BROWSER EXCEPTION]', err.message);
  });

  try {
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'puppeteer_home.png') });
    console.log('Saved home page screenshot.');

    console.log('Waiting for repository item...');
    
    // Evaluate in browser to find the repository element, get its bounding rect, and click it
    const clicked = await page.evaluate(async () => {
      // Wait for repository items to appear
      await new Promise((resolve) => {
        const check = () => {
          const els = Array.from(document.querySelectorAll('*'));
          const found = els.some(el => el.textContent && el.textContent.includes('express-178548'));
          if (found) resolve();
          else setTimeout(check, 100);
        };
        check();
      });

      const els = Array.from(document.querySelectorAll('*'));
      const repoEl = els.find(el => el.textContent && el.textContent.includes('express-178548') && el.children.length === 0);
      if (repoEl) {
        repoEl.click();
        return `Clicked repository element: ${repoEl.textContent}`;
      }
      return 'Repository element not found';
    });
    
    console.log('Repo Click Action:', clicked);

    // Wait for the workspace to load by checking for the sidebar or dock
    console.log('Waiting for workspace shell to render...');
    await page.waitForFunction(() => {
      return document.querySelector('div[title="Branch"]') || document.querySelector('.dock-icon') || document.body.innerText.includes('INVESTIGATION');
    }, { timeout: 10000 });
    
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'puppeteer_workspace_loaded.png') });
    console.log('Saved workspace loaded screenshot.');

    console.log('Switching to Architecture Map perspective...');
    const switched = await page.evaluate(() => {
      const btn = document.querySelector('div[title="Branch"]') || document.querySelector('div[title="Files"]')?.parentElement?.children[3];
      if (btn) {
        btn.click();
        return 'Clicked Map branch icon';
      }
      return 'Map branch icon not found';
    });
    console.log('Perspective Switch Action:', switched);

    console.log('Waiting for Map to render...');
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'puppeteer_map_loaded.png') });
    console.log('Saved map loaded screenshot.');

    // Expand folder
    console.log('Expanding "test" folder container...');
    const expandedResult = await page.evaluate(async () => {
      const containers = Array.from(document.querySelectorAll('.react-flow__node-folderContainer'));
      const testFolder = containers.find(c => c.innerText && c.innerText.includes('test'));
      if (testFolder) {
        testFolder.click();
        return 'Clicked test folder container';
      }
      return `Test folder container not found. Available nodes: ${containers.map(c => c.innerText.split('\n')[0]).join(', ')}`;
    });
    console.log('Expand Folder Action:', expandedResult);

    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'puppeteer_folder_expanded.png') });
    console.log('Saved folder expanded screenshot.');

    // Verify files inside expanded card
    const checkCardFiles = await page.evaluate(() => {
      const containers = Array.from(document.querySelectorAll('.react-flow__node-folderContainer'));
      const testFolder = containers.find(c => c.innerText && c.innerText.includes('test'));
      if (!testFolder) return 'Folder not found';
      return testFolder.innerText;
    });
    console.log('Test folder inner text after expand:\n', checkCardFiles);

    // Click file inside container
    const clickedFileResult = await page.evaluate(() => {
      const containers = Array.from(document.querySelectorAll('.react-flow__node-folderContainer'));
      const testFolder = containers.find(c => c.innerText && c.innerText.includes('test'));
      if (!testFolder) return 'Folder not found';
      
      const fileSpans = Array.from(testFolder.querySelectorAll('span'));
      const appJs = fileSpans.find(s => s.textContent.trim() === 'app.js');
      if (appJs) {
        appJs.click();
        return 'Clicked app.js inline';
      }
      return `app.js not found in card. Files: ${fileSpans.map(s => s.textContent).join(', ')}`;
    });
    console.log('File Click Action:', clickedFileResult);

    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'puppeteer_file_selected.png') });
    console.log('Saved file selected screenshot.');

  } catch (err) {
    console.error('Puppeteer verification failed:', err);
  } finally {
    await browser.close();
    console.log('Puppeteer browser closed.');
  }
}

run();
