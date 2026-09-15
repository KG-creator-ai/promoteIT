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
  { id: 'projects',  label: '02_Campaign_Workspace' },
  { id: 'wizard',    label: '03_Campaign_Wizard' },
  { id: 'studio',    label: '04_Resource_Stitcher' },
  { id: 'script',    label: '05_Master_Script_Studio' },
  { id: 'prompts',   label: '06_AI_Prompt_Hub' },
  { id: 'audio',     label: '07_Audio_Studio' },
  { id: 'settings',  label: '08_Settings_Studio' }
];

const TEST_USER = {
  username: 'audit_tester',
  email: 'audit@promoteit.local',
  password: 'TestPass123!',
  pin: '999999',
};

// Helper to fill a React-controlled input properly
function defineReactHelpers() {
  window.__reactFill = function (input, value) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };
}

async function runAudit() {
  console.log('Starting WSL Visual Audit across 8 Routes & 4 Viewports...');

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

  // Inject React helpers into the page
  await page.evaluate(defineReactHelpers);

  // ═══════════════════════════════════════════════
  // AUTH FLOW: Create a test user to unlock the vault
  // ═══════════════════════════════════════════════
  console.log('Setting up test user (audit_tester)...');
  const authOK = await page.evaluate(async (user) => {
    const authModal = document.querySelector('[role="dialog"][aria-label="Authentication"]');
    if (!authModal) return 'no_modal';

    // Click "Create Account" tab
    const tabs = Array.from(authModal.querySelectorAll('button'));
    const signupTab = tabs.find(b => b.textContent && b.textContent.trim() === 'Create Account');
    if (signupTab) signupTab.click();
    await new Promise(r => setTimeout(r, 300));

    const fill = window.__reactFill;

    // Fill username
    const u = authModal.querySelector('input[placeholder="Choose a username"]');
    if (u) { u.focus(); fill(u, user.username); }
    await new Promise(r => setTimeout(r, 50));

    // Fill email
    const e = authModal.querySelector('input[type="email"]');
    if (e) { e.focus(); fill(e, user.email); }
    await new Promise(r => setTimeout(r, 50));

    // Fill password
    const p = authModal.querySelector('input[placeholder="Create a strong password"]');
    if (p) { p.focus(); fill(p, user.password); }
    await new Promise(r => setTimeout(r, 50));

    // Fill PIN fields
    const pins = Array.from(authModal.querySelectorAll('input[placeholder="000000"]'));
    if (pins[0]) { pins[0].focus(); fill(pins[0], user.pin); }
    await new Promise(r => setTimeout(r, 50));
    if (pins[1]) { pins[1].focus(); fill(pins[1], user.pin); }
    await new Promise(r => setTimeout(r, 50));

    // Submit
    const submitBtn = Array.from(authModal.querySelectorAll('button[type="submit"]')).find(
      b => b.textContent && b.textContent.includes('Create Encrypted Vault')
    );
    if (submitBtn) { submitBtn.click(); return 'submitted'; }
    return 'no_submit';
  }, TEST_USER);

  console.log('Auth signup status: ' + authOK);
  await new Promise(r => setTimeout(r, 3000));

  // Check vault status
  let vaultStatus = await page.evaluate(() => {
    const authModal = document.querySelector('[role="dialog"][aria-label="Authentication"]');
    return authModal ? 'locked' : 'unlocked';
  });
  console.log('Vault status: ' + vaultStatus);

  // Fallback: if vault still locked, try login (user may already exist)
  if (vaultStatus === 'locked') {
    console.log('Signup did not unlock vault, trying login...');
    await page.evaluate(async (user) => {
      const authModal = document.querySelector('[role="dialog"][aria-label="Authentication"]');
      if (!authModal) return 'no_modal';

      // Click "Sign In" tab
      const tabs = Array.from(authModal.querySelectorAll('button'));
      const loginTab = tabs.find(b => b.textContent && b.textContent.trim() === 'Sign In');
      if (loginTab) loginTab.click();
      await new Promise(r => setTimeout(r, 300));

      const fill = window.__reactFill;

      const u = authModal.querySelector('input[placeholder="Enter username"]');
      if (u) { u.focus(); fill(u, user.username); }
      await new Promise(r => setTimeout(r, 50));

      const p = authModal.querySelector('input[placeholder="Enter password"]');
      if (p) { p.focus(); fill(p, user.password); }
      await new Promise(r => setTimeout(r, 50));

      const pin = authModal.querySelector('input[placeholder="000000"]');
      if (pin) { pin.focus(); fill(pin, user.pin); }
      await new Promise(r => setTimeout(r, 50));

      const submitBtn = Array.from(authModal.querySelectorAll('button[type="submit"]')).find(
        b => b.textContent && b.textContent.includes('Unlock Vault')
      );
      if (submitBtn) { submitBtn.click(); return 'submitted'; }
      return 'no_submit';
    }, TEST_USER);
    await new Promise(r => setTimeout(r, 2000));

    vaultStatus = await page.evaluate(() => {
      const authModal = document.querySelector('[role="dialog"][aria-label="Authentication"]');
      return authModal ? 'locked' : 'unlocked';
    });
    console.log('Vault status after login attempt: ' + vaultStatus);
  }

  // ═══════════════════════════════════════════════
  // CAPTURE 1: Auth Modal Screenshot (if locked)
  // ═══════════════════════════════════════════════
  if (vaultStatus === 'locked') {
    console.warn('Vault remains locked — capturing auth modal screenshot only.');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '00_AuthModal_Locked.png'), fullPage: false });
    console.log('  Saved: 00_AuthModal_Locked.png');
  }

  const results = {
    totalScreenshots: 0,
    routesAudited: [],
    viewportsAudited: VIEWPORTS.map(v => v.name),
    consoleErrors: [],
    pageErrors: []
  };

  // ═══════════════════════════════════════════════
  // ROUTE SCREENSHOTS
  // ═══════════════════════════════════════════════
  for (const vp of VIEWPORTS) {
    console.log('\nViewport: ' + vp.name + ' (' + vp.width + 'x' + vp.height + ')');
    await page.setViewport({ width: vp.width, height: vp.height });

    for (const route of ROUTES) {
      try {
        const clicked = await page.evaluate((targetId) => {
          const ROUTE_MAP = {
            'dashboard': 'AV-ArtVark',
            'projects': 'Projects',
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

  // ═══════════════════════════════════════════════
  // VAULT LOCK TEST
  // ═══════════════════════════════════════════════
  if (vaultStatus === 'unlocked') {
    console.log('\nTesting Vault Lock...');
    try {
      await page.evaluate(() => {
        const profileBtn = document.querySelector('button[aria-label="Profile and Security"]');
        if (profileBtn) profileBtn.click();
      });
      await new Promise(r => setTimeout(r, 400));

      await page.evaluate(() => {
        const lockBtn = Array.from(document.querySelectorAll('button')).find(b =>
          b.textContent && b.textContent.includes('Lock Vault')
        );
        if (lockBtn) lockBtn.click();
      });
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, '10_Vault_Locked.png'), fullPage: false });
      console.log('  Saved: 10_Vault_Locked.png');
      results.totalScreenshots++;

      // Re-auth to unlock for final check
      await page.evaluate(async (user) => {
        const authModal = document.querySelector('[role="dialog"][aria-label="Authentication"]');
        if (!authModal) return;
        const fill = window.__reactFill;
        const u = authModal.querySelector('input[placeholder="Enter username"]');
        if (u) { u.focus(); fill(u, user.username); }
        const p = authModal.querySelector('input[placeholder="Enter password"]');
        if (p) { p.focus(); fill(p, user.password); }
        const pin = authModal.querySelector('input[placeholder="000000"]');
        if (pin) { pin.focus(); fill(pin, user.pin); }
        await new Promise(r => setTimeout(r, 100));
        const submitBtn = Array.from(authModal.querySelectorAll('button[type="submit"]')).find(
          b => b.textContent && b.textContent.includes('Unlock Vault')
        );
        if (submitBtn) submitBtn.click();
      }, TEST_USER);
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.warn('  Vault lock test error: ' + e.message);
    }
  }

  // ═══════════════════════════════════════════════
  // THEME TOGGLE
  // ═══════════════════════════════════════════════
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