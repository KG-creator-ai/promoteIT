import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACTS_DIR = process.env.AUDIT_DIR || '/tmp/promote-it-audit';
const CHROME_PATH = process.env.CHROME_PATH || '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'laptop',  width: 1280, height: 800 },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'mobile',  width: 375,  height: 812 }
];

const ROUTES = [
  { id: 'dashboard', label: '01_AVArtVark_Dashboard' },
  { id: 'studio',    label: '02_Resource_Stitcher' },
  { id: 'wizard',    label: '03_Campaign_Wizard' },
  { id: 'script',    label: '04_Master_Script_Studio' },
  { id: 'prompts',   label: '05_AI_Prompt_Hub' },
  { id: 'audio',     label: '06_Audio_Studio' },
  { id: 'settings',  label: '07_Settings_Studio' }
];

async function runAudit() {
  console.log('Starting WSL Visual Audit across 7 Routes & 4 Viewports...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-proxy-server']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => pageErrors.push(String(err)));

  console.log('Navigating to ' + BASE_URL + '...');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  const results = {
    totalScreenshots: 0,
    routesAudited: [],
    viewportsAudited: VIEWPORTS.map(v => v.name),
    consoleErrors: [],
    pageErrors: []
  };

  for (const vp of VIEWPORTS) {
    console.log('\nViewport: ' + vp.name + ' (' + vp.width + 'x' + vp.height + ')');
    await page.setViewport({ width: vp.width, height: vp.height });

    for (const route of ROUTES) {
      try {
        const clicked = await page.evaluate((targetId) => {
          const ROUTE_MAP = {
            'dashboard': 'AV-ArtVark',
            'studio': 'Resource Stitcher',
            'wizard': 'Wizard',
            'script': 'Script Studio',
            'prompts': 'Prompt Hub',
            'audio': 'Audio Studio',
            'settings': 'Settings'
          };
          const targetName = ROUTE_MAP[targetId];
          const allButtons = Array.from(document.querySelectorAll('nav button, header button, button'));
          const btn = allButtons.find(b =>
            b.getAttribute('title') === targetName ||
            (b.textContent && b.textContent.trim() === targetName) ||
            (b.textContent && b.textContent.trim().includes(targetName))
          );
          if (btn) { btn.click(); return true; }
          return false;
        }, route.id);

        if (!clicked) console.warn('  Could not find nav button for ' + route.id);
      } catch (err) {
        console.warn('  Nav click error on ' + route.id + ': ' + err.message);
      }

      await new Promise(r => setTimeout(r, 800));

      const screenshotFilename = route.label + '_' + vp.name + '.png';
      const screenshotPath = path.join(ARTIFACTS_DIR, screenshotFilename);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log('  Saved: ' + screenshotFilename);
      results.totalScreenshots++;
      if (!results.routesAudited.includes(route.id)) results.routesAudited.push(route.id);
    }

    if (vp.name === 'desktop') {
      console.log('  Testing S.U.T.R.A. popover trigger...');
      try {
        await page.evaluate(() => {
          const sutraTrigger = document.querySelector('button[title*="S.U.T.R.A"]') ||
            Array.from(document.querySelectorAll('button')).find(b =>
              (b.textContent && b.textContent.includes('S.U.T.R.A')) ||
              (b.title && b.title.includes('S.U.T.R.A')));
          if (sutraTrigger) sutraTrigger.click();
        });
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, '08_SUTRA_Popover_desktop.png') });
        console.log('  Saved: 08_SUTRA_Popover_desktop.png');
        results.totalScreenshots++;

        await page.evaluate(() => {
          const closeBtn = document.querySelector('div[role="dialog"] button[aria-label="Close Chat"]');
          if (closeBtn) closeBtn.click();
        });
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        console.warn('  Could not trigger SUTRA: ' + e.message);
      }
    }
  }

  console.log('\nTesting Theme Toggle...');
  await page.setViewport({ width: 1920, height: 1080 });
  try {
    await page.evaluate(() => {
      const themeBtn = Array.from(document.querySelectorAll('button')).find(b =>
        (b.getAttribute('aria-label') && b.getAttribute('aria-label').toLowerCase().includes('theme')) ||
        (b.title && b.title.toLowerCase().includes('theme'))
      );
      if (themeBtn) themeBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '09_Theme_Toggle_Mode.png') });
    console.log('  Saved: 09_Theme_Toggle_Mode.png');
    results.totalScreenshots++;
  } catch (e) {
    console.warn('  Theme toggle error: ' + e.message);
  }

  results.consoleErrors = consoleErrors;
  results.pageErrors = pageErrors;
  console.log('\nVisual Audit Finished!');
  console.log('Total Screenshots Captured: ' + results.totalScreenshots);
  console.log('Console Errors: ' + consoleErrors.length);
  if (consoleErrors.length > 0) console.log('Errors:', consoleErrors.slice(0, 20));
  console.log('Page Errors: ' + pageErrors.length);
  if (pageErrors.length > 0) console.log('PageErrors:', pageErrors.slice(0, 20));

  fs.writeFileSync(
    path.join(ARTIFACTS_DIR, 'audit_summary.json'),
    JSON.stringify(results, null, 2)
  );

  await browser.close();
}

runAudit().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
