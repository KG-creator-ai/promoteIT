import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/kunal.gawade/.gemini/antigravity-ide/brain/64650eec-6439-44ce-b63d-031c58a0959b/audit-screenshots';
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE_URL = 'http://localhost:3000';

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
  console.log('🚀 Starting Autonomous Visual Audit across 7 Routes & 4 Viewports...');
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Navigate to app and wait for DB seed to finish
  console.log(`Navigating to ${BASE_URL}...`);
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // Wait 3 seconds for Dexie seedDatabase() to complete
  await new Promise(r => setTimeout(r, 3000));

  const results = {
    totalScreenshots: 0,
    routesAudited: [],
    viewportsAudited: VIEWPORTS.map(v => v.name),
    consoleErrors: []
  };

  // 1. Audit Desktop Viewport across all 7 routes + Light/Dark mode
  for (const vp of VIEWPORTS) {
    console.log(`\n📐 Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
    await page.setViewport({ width: vp.width, height: vp.height });

    for (const route of ROUTES) {
      console.log(`  🔍 Testing Route: ${route.label}...`);
      
      // Click navigation item in sidebar or mobile nav
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
          
          // Try exact match on title or trimmed text
          const btn = allButtons.find(b => 
            b.getAttribute('title') === targetName ||
            b.textContent?.trim() === targetName ||
            b.textContent?.trim().includes(targetName)
          );
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        }, route.id);

        if (!clicked) {
          console.warn(`    ⚠️ Could not find nav button for ${route.id}`);
        }
      } catch (err) {
        console.warn(`    Nav click error on ${route.id}: ${err.message}`);
      }

      await new Promise(r => setTimeout(r, 800));

      const screenshotFilename = `${route.label}_${vp.name}.png`;
      const screenshotPath = path.join(ARTIFACTS_DIR, screenshotFilename);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`    📸 Saved: ${screenshotFilename}`);
      results.totalScreenshots++;

      // Specific multi-view audit for AVArtVark on Desktop
      if (route.id === 'dashboard' && vp.name === 'desktop') {
        try {
          // Switch to Kanban
          await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            // 3 view mode buttons exist in top right
            const viewButtons = btns.filter(b => b.querySelector('svg.lucide-columns, svg.lucide-layout-grid, svg.lucide-list'));
            if (viewButtons[0]) viewButtons[0].click(); // Kanban
          });
          await new Promise(r => setTimeout(r, 500));
          await page.screenshot({ path: path.join(ARTIFACTS_DIR, '01_AVArtVark_Kanban_desktop.png') });
          console.log('    📸 Saved: 01_AVArtVark_Kanban_desktop.png');
          results.totalScreenshots++;

          // Switch to List
          await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const viewButtons = btns.filter(b => b.querySelector('svg.lucide-columns, svg.lucide-layout-grid, svg.lucide-list'));
            if (viewButtons[2]) viewButtons[2].click(); // List
          });
          await new Promise(r => setTimeout(r, 500));
          await page.screenshot({ path: path.join(ARTIFACTS_DIR, '01_AVArtVark_List_desktop.png') });
          console.log('    📸 Saved: 01_AVArtVark_List_desktop.png');
          results.totalScreenshots++;

          // Switch back to Grid
          await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const viewButtons = btns.filter(b => b.querySelector('svg.lucide-columns, svg.lucide-layout-grid, svg.lucide-list'));
            if (viewButtons[1]) viewButtons[1].click(); // Grid
          });
          await new Promise(r => setTimeout(r, 400));
        } catch (e) {
          console.warn('    Could not switch dashboard views:', e.message);
        }
      }
    }

    // Special test on Desktop: S.U.T.R.A. popover trigger
    if (vp.name === 'desktop') {
      console.log('  🤖 Testing S.U.T.R.A. popover trigger...');
      try {
        await page.evaluate(() => {
          const sutraTrigger = document.querySelector('button[title*="S.U.T.R.A"]') || 
                               Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('S.U.T.R.A') || b.title?.includes('S.U.T.R.A'));
          if (sutraTrigger) sutraTrigger.click();
        });
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, '08_SUTRA_Popover_desktop.png') });
        console.log('    📸 Saved: 08_SUTRA_Popover_desktop.png');
        results.totalScreenshots++;

        // Close SUTRA popover cleanly
        await page.evaluate(() => {
          const closeBtn = document.querySelector('div[role="dialog"] button:has(svg.lucide-x), button[aria-label="Close Assistant"]') ||
                           Array.from(document.querySelectorAll('div[role="dialog"] button')).find(b => b.innerHTML?.includes('lucide-x') || b.getAttribute('aria-label')?.includes('Close'));
          if (closeBtn) closeBtn.click();
        });
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        console.warn('    Could not trigger SUTRA:', e.message);
      }
    }
  }

  // Test Theme Toggle (Dark vs Light) on Desktop
  console.log('\n🎨 Testing Theme Toggle (Dark vs Light Mode)...');
  await page.setViewport({ width: 1920, height: 1080 });
  try {
    await page.evaluate(() => {
      const themeBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.getAttribute('aria-label')?.toLowerCase().includes('theme') ||
        b.title?.toLowerCase().includes('theme') ||
        b.innerHTML?.includes('Moon') || b.innerHTML?.includes('Sun')
      );
      if (themeBtn) themeBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '09_Theme_Toggle_Mode.png') });
    console.log('    📸 Saved: 09_Theme_Toggle_Mode.png');
    results.totalScreenshots++;
  } catch (e) {
    console.warn('    Theme toggle error:', e.message);
  }

  results.consoleErrors = consoleErrors;
  console.log('\n✅ Visual Audit Finished!');
  console.log(`Total Screenshots Captured: ${results.totalScreenshots}`);
  console.log(`Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors);
  }

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
