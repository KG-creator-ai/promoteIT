// e2e-av.mjs — SPEC-011 functional certification: full AV workflow headless.
// Proves: auth → campaign → AI generate (provider) → script → TTS speak fired →
// player renders frames → REAL .webm export artifact (+audio track) → screenshots.
// Env: E2E_DIR (default audit-artifacts/), E2E_OPENROUTER_KEY (required for the
// generation leg), BASE_URL, CHROME_PATH. The key is never logged or committed.
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACTS_DIR = process.env.E2E_DIR || path.join(__dirname, '..', 'audit-artifacts');
const CHROME_PATH = process.env.CHROME_PATH || '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PROVIDER_KEY = process.env.E2E_OPENROUTER_KEY || '';
// Windows Chrome cannot write to WSL /mnt or /tmp paths — translate for CDP.
function toWinPath(p) {
  const m = p.match(/^\/mnt\/([a-z])(\/.*)?$/i);
  if (m) return `${m[1].toUpperCase()}:\\${(m[2] || '\\').replace(/\//g, '\\').replace(/^\\/, '')}`;
  return p;
}
const DOWNLOAD_DIR = path.join(ARTIFACTS_DIR, 'downloads');

for (const d of [ARTIFACTS_DIR, DOWNLOAD_DIR]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

const legs = [];
function leg(name, ok, detail = '') {
  legs.push({ leg: name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) process.exitCode = 1;
}

function defineReactHelpers() {
  window.__reactFill = function (input, value) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };
  window.__reactFillArea = function (ta, value) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, value);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.dispatchEvent(new Event('change', { bubbles: true }));
  };
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function navTo(page, label) {
  const clicked = await page.evaluate((targetName) => {
    const btn = Array.from(document.querySelectorAll('nav button, header button, button')).find(b =>
      b.getAttribute('title') === targetName ||
      (b.textContent && b.textContent.trim() === targetName));
    if (btn) { btn.click(); return true; }
    return false;
  }, label);
  await sleep(900);
  return clicked;
}

async function run() {
  console.log('E2E-AV functional certification starting...');
  if (!PROVIDER_KEY) {
    console.error('E2E_OPENROUTER_KEY is required for the generation leg (key never logged).');
    process.exit(2);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    protocolTimeout: 600000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-proxy-server', '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 300)); });
  page.on('pageerror', err => pageErrors.push(String(err).slice(0, 300)));

  const cdp = await page.createCDPSession();
  await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: toWinPath(DOWNLOAD_DIR) });

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);
  await page.evaluate(defineReactHelpers);

  // ── LEG 0: auth ──
  const user = { username: 'e2e_av', email: 'e2e@promoteit.local', password: 'TestPass123!', pin: '123456' };
  await page.evaluate(async (u) => {
    const modal = document.querySelector('[role="dialog"][aria-label="Authentication"]');
    if (!modal) return;
    const tabs = Array.from(modal.querySelectorAll('button'));
    const tab = tabs.find(b => b.textContent && b.textContent.trim() === 'Create Account');
    if (tab) tab.click();
    await new Promise(r => setTimeout(r, 300));
    const fill = window.__reactFill;
    const set = (sel, v) => { const el = modal.querySelector(sel); if (el) { el.focus(); fill(el, v); } };
    set('input[placeholder="Choose a username"]', u.username);
    set('input[type="email"]', u.email);
    set('input[placeholder="Create a strong password"]', u.password);
    for (const p of Array.from(modal.querySelectorAll('input[placeholder="000000"]'))) { p.focus(); fill(p, u.pin); }
    await new Promise(r => setTimeout(r, 200));
    const btn = Array.from(modal.querySelectorAll('button[type="submit"]')).find(b => b.textContent && b.textContent.includes('Create Encrypted Vault'));
    if (btn) btn.click();
  }, user);
  await sleep(3000);
  let unlocked = await page.evaluate(() => !document.querySelector('[role="dialog"][aria-label="Authentication"]'));
  if (!unlocked) {
    await page.evaluate(async (u) => {
      const modal = document.querySelector('[role="dialog"][aria-label="Authentication"]');
      if (!modal) return;
      const tabs = Array.from(modal.querySelectorAll('button'));
      const tab = tabs.find(b => b.textContent && b.textContent.trim() === 'Sign In');
      if (tab) tab.click();
      await new Promise(r => setTimeout(r, 300));
      const fill = window.__reactFill;
      const set = (sel, v) => { const el = modal.querySelector(sel); if (el) { el.focus(); fill(el, v); } };
      set('input[placeholder="Enter username"]', u.username);
      set('input[placeholder="Enter password"]', u.password);
      const pin = modal.querySelector('input[placeholder="000000"]');
      if (pin) { pin.focus(); fill(pin, u.pin); }
      await new Promise(r => setTimeout(r, 200));
      const btn = Array.from(modal.querySelectorAll('button[type="submit"]')).find(b => b.textContent && b.textContent.includes('Unlock Vault'));
      if (btn) btn.click();
    }, user);
    await sleep(2500);
    unlocked = await page.evaluate(() => !document.querySelector('[role="dialog"][aria-label="Authentication"]'));
  }
  leg('auth-unlock', unlocked);
  if (!unlocked) {
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '00_auth_locked.png') });
    await browser.close();
    return;
  }

  console.log('STEP provider-inject');
  // Provider config for the generation leg (key from env, never logged).
  await page.evaluate((key) => {
    localStorage.setItem('promote_it_remote_provider', 'openrouter');
    localStorage.setItem('promote_it_openrouter_key', key);
    localStorage.setItem('promote_it_remote_model', 'qwen/qwen-2.5-7b-instruct');
  }, PROVIDER_KEY);

  console.log('STEP engine-init');
  // Engine init → headless has no WebGPU → must fall back to remote-api.
  // The widget button only opens the dropdown; the "Auto (WebGPU)" item inits.
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('header button')).find(b =>
      b.title === 'Engine Selector' || (b.textContent && /Auto \(WebGPU\)/.test(b.textContent)));
    if (btn) btn.click();
  });
  await sleep(1200);
  await page.evaluate(() => {
    const item = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent && b.textContent.includes('Auto (WebGPU)') && b.textContent.includes('Best available engine'));
    if (item) item.click();
  });
  let providerMode = 'unknown';
  for (let i = 0; i < 12; i++) {
    await sleep(2500);
    try {
      providerMode = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('header button')).find(b =>
          (b.title || '').length > 0 && /Engine|Downloading|Loading|Remote|WebLLM/.test((b.title || '') + (b.textContent || '')));
        return ((btn?.textContent || '') + '|' + (btn?.title || '')).trim().slice(0, 80);
      });
    } catch { providerMode = 'probe-failed'; }
    if (/Remote API|WebLLM Local/.test(providerMode)) break;
  }
  console.log('  engine provider mode: ' + providerMode);
  leg('engine-remote-fallback', /Remote API/.test(providerMode), `mode=${providerMode}`);

  console.log('STEP wizard-start');
  // ── LEG 1: wizard generate (real provider) ──
  await navTo(page, 'Wizard');
  await page.evaluate(() => {
    const fillI = window.__reactFill, fillA = window.__reactFillArea;
    const t = document.querySelector('#wizard-title'); if (t) fillI(t, 'E2E Certification Campaign');
    const a = document.querySelector('#wizard-audience'); if (a) fillI(a, 'Tamil Nadu MSME owners');
    const o = document.querySelector('#wizard-objectives'); if (o) fillA(o, 'Promote Arka Fincap business loans. Mention Vanakkam Tamil Nadu, Kanchipuram silk, Nadaswaram music. End with a branch-visit call to action.');
  });
  const cont1 = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent && x.textContent.trim() === 'Continue');
    if (b) { b.click(); return true; } return false;
  });
  await sleep(800);
  const cont2 = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent && x.textContent.trim() === 'Continue');
    if (b) { b.click(); return true; } return false;
  });
  await sleep(800);
  const genStarted = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent && /Generate Script/.test(x.textContent));
    if (b) { b.click(); return true; } return false;
  });
  console.log('STEP generate-clicked, polling IDB...');
  let sceneCount = 0;
  if (genStarted) {
    for (let i = 0; i < 60; i++) {
      await sleep(5000);
      try {
        sceneCount = await Promise.race([
          page.evaluate(async () => {
            return await new Promise((resolve) => {
              try {
                const req = indexedDB.open('PromoteITDatabase');
                req.onsuccess = () => {
                  const db = req.result;
                  if (!db.objectStoreNames.contains('campaigns')) { resolve(-1); return; }
                  const tx = db.transaction('campaigns', 'readonly');
                  const all = tx.objectStore('campaigns').getAll();
                  all.onsuccess = () => {
                    const rows = all.result || [];
                    const latest = rows.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
                    resolve(latest?.sceneGraph?.length || 0);
                  };
                  all.onerror = () => resolve(-1);
                };
                req.onerror = () => resolve(-1);
              } catch { resolve(-1); }
            });
          }),
          new Promise((_, rej) => setTimeout(() => rej(new Error('idb-probe-timeout')), 25000)),
        ]);
      } catch (e) {
        console.log(`  poll ${i}: probe failed (${e.message}) — page may be busy generating`);
        sceneCount = -2;
      }
      let done = true;
      try {
        done = await page.evaluate(() => !document.body.textContent?.includes('Generating...'));
      } catch { done = false; }
      if (i % 4 === 0 || sceneCount > 0) console.log(`  poll ${i}: scenes=${sceneCount} done=${done}`);
      if (sceneCount > 0 && done) break;
    }
  }
  leg('wizard-generate', cont1 && cont2 && genStarted && sceneCount >= 2, `scenes=${sceneCount}`);
  const genError = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('[role="alert"], p')).find(e =>
      e.textContent && /unavailable|standby|AI structuring|Could not create/i.test(e.textContent));
    return (el?.textContent || '').slice(0, 220);
  }).catch(() => 'generror-probe-failed');
  if (genError) console.log('  wizard notice: ' + genError);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '10_wizard_result.png') });

  console.log('STEP script-table');
  // ── LEG 2: script table (grid rows, not <tr>) ──
  await navTo(page, 'Script Studio');
  const scriptRows = await page.evaluate(() => {
    const hits = document.body.innerText.match(/ACT \d+/g) || [];
    return new Set(hits).size;
  });
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '11_script_table.png') });
  leg('script-table', scriptRows >= 2, `acts=${scriptRows}`);

  console.log('STEP audio');
  // ── LEG 3: audio — TTS speak actually fires ──
  await navTo(page, 'Audio Studio');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '12_audio_studio.png') });
  await page.evaluate(() => {
    window.__speakCalls = [];
    try {
      const synth = window.speechSynthesis;
      if (synth && !synth.__wrapped) {
        const orig = synth.speak.bind(synth);
        synth.__wrapped = true;
        synth.speak = (u) => { window.__speakCalls.push((u.text || '').slice(0, 80)); try { orig(u); } catch { /* headless may lack audio */ } };
      }
    } catch { /* no speechSynthesis — honest negative */ }
  });
  const audioClicked = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(x => x.getAttribute('aria-label') === 'Play scene 1');
    if (b) { b.click(); return true; } return false;
  });
  await sleep(4000);
  const speakInfo = await page.evaluate(() => ({ n: (window.__speakCalls || []).length, head: ((window.__speakCalls || [])[0] || '') }));
  leg('audio-speak', audioClicked && speakInfo.n >= 1, `speakCalls=${speakInfo.n} head="${speakInfo.head}"`);
  await page.evaluate(() => { try { window.speechSynthesis?.cancel(); } catch { /* noop */ } });

  console.log('STEP player');
  // ── LEG 4: player renders + time advances (imageless scenes are static
  // pixels, so playback is proven by the advancing transport clock) ──
  await navTo(page, 'Script Studio');
  const toPlayer = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent && x.textContent.includes('Preview Player'));
    if (b) { b.click(); return true; } return false;
  });
  await sleep(1500);
  const readClock = () => page.evaluate(() => {
    const m = (document.body.innerText.match(/(\d{2}:\d{2})\s*\/\s*(\d{2}:\d{2})/) || []);
    return { t: m[1] || '?', total: m[2] || '?' };
  });
  const frameA = await page.evaluate(() => { const c = document.querySelector('canvas'); return c ? c.toDataURL().length : 0; });
  const clockA = await readClock();
  await page.evaluate(() => {
    const c = document.querySelector('canvas');
    if (c) c.click();
  });
  await sleep(6000);
  const clockB = await readClock();
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '13_player_playing.png') });
  const advanced = clockA.t !== '?' && clockB.t !== '?' && clockB.t !== clockA.t;
  leg('player-renders', toPlayer && frameA > 1000 && advanced, `canvasBytes=${frameA} clock=${clockA.t}->${clockB.t}`);

  console.log('STEP export');
  // ── LEG 5: export real .webm (+audio track assertion) ──
  await page.evaluate(() => {
    window.__captureTracks = [];
    window.__mrEvents = [];
    try {
      const proto = window.HTMLCanvasElement.prototype;
      const orig = proto.captureStream;
      proto.captureStream = function (...args) {
        const s = orig.apply(this, args);
        window.__captureTracks.push({ v: s.getVideoTracks().length, a: s.getAudioTracks().length });
        return s;
      };
      const OrigMR = window.MediaRecorder;
      window.MediaRecorder = function (stream, opts) {
        window.__mrEvents.push('constructed');
        const r = new OrigMR(stream, opts);
        const os = r.start.bind(r);
        r.start = (...a) => { window.__mrEvents.push('started'); return os(...a); };
        const op = r.stop.bind(r);
        r.stop = (...a) => { window.__mrEvents.push('stopped'); return op(...a); };
        return r;
      };
      window.MediaRecorder.isTypeSupported = OrigMR.isTypeSupported.bind(OrigMR);
    } catch (e) { window.__patchError = String(e).slice(0, 120); }
  });
  const before = fs.readdirSync(DOWNLOAD_DIR);
  const exportClicked = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent && x.textContent.includes('Export .webm'));
    if (b) { b.click(); return true; } return false;
  });
  let webmFile = '';
  const exportT0 = Date.now();
  if (exportClicked) {
    // Full-length realtime recording: allow totalDuration + 3 min overhead.
    for (let i = 0; i < 130; i++) {
      await sleep(5000);
      const now = fs.readdirSync(DOWNLOAD_DIR).filter(f => !before.includes(f) && !f.endsWith('.crdownload'));
      if (now.length > 0) { webmFile = now[0]; break; }
    }
  }
  const exportSecs = Math.round((Date.now() - exportT0) / 1000);
  const webmSize = webmFile ? fs.statSync(path.join(DOWNLOAD_DIR, webmFile)).size : 0;
  // Track proof from the ARTIFACT bytes (capture-time snapshot misses the later
  // addTrack): a real export contains VP9/VP8 video + Opus/Vorbis audio EBML tracks.
  let hasVideo = false, hasAudio = false;
  if (webmFile) {
    const buf = fs.readFileSync(path.join(DOWNLOAD_DIR, webmFile));
    hasVideo = buf.includes(Buffer.from('V_VP9')) || buf.includes(Buffer.from('V_VP8')) || buf.includes(Buffer.from('V_AV1'));
    hasAudio = buf.includes(Buffer.from('A_OPUS')) || buf.includes(Buffer.from('A_VORBIS'));
  }
  const tracks = await page.evaluate(() => window.__captureTracks || []).catch(() => []);
  const mrEvents = await page.evaluate(() => window.__mrEvents || []).catch(() => []);
  const patchError = await page.evaluate(() => window.__patchError || '').catch(() => '');
  leg('export-webm', exportClicked && webmSize > 20000 && hasVideo && hasAudio, `clicked=${exportClicked} file=${webmFile} bytes=${webmSize} video=${hasVideo} audio=${hasAudio} mr=${mrEvents.join(',') || 'none'} patchErr=${patchError || 'none'} secs=${exportSecs}`);
  if (webmFile) fs.copyFileSync(path.join(DOWNLOAD_DIR, webmFile), path.join(ARTIFACTS_DIR, '14_export_preview.webm'));

  // ── voiceover EDL via audio view export button ──
  await navTo(page, 'Audio Studio');
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent && x.textContent.includes('Export Voiceover Package'));
    if (b) b.click();
  });
  await sleep(4000);
  const edl = fs.readdirSync(DOWNLOAD_DIR).filter(f => !before.includes(f) && f.includes('Voiceover') && !f.endsWith('.crdownload'));
  if (edl[0]) fs.copyFileSync(path.join(DOWNLOAD_DIR, edl[0]), path.join(ARTIFACTS_DIR, '15_voiceover_EDL.json'));
  leg('export-edl', edl.length > 0, `file=${edl[0] || 'none'}`);

  // ── manifest ──
  const artifacts = fs.readdirSync(ARTIFACTS_DIR)
    .filter(f => f !== 'manifest.json')
    .map(f => ({ file: f, bytes: fs.statSync(path.join(ARTIFACTS_DIR, f)).size }));
  const manifest = {
    date: new Date().toISOString(),
    legs,
    artifacts,
    consoleErrors: consoleErrors.slice(0, 20),
    pageErrors: pageErrors.slice(0, 20),
  };
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nE2E legs: ${legs.filter(l => l.ok).length}/${legs.length} green. pageErrors=${pageErrors.length} consoleErrors=${consoleErrors.length}`);
  if (pageErrors.length > 0) {
    console.log('PAGE ERRORS:', pageErrors.slice(0, 5));
    process.exitCode = 1;
  }
  await browser.close();
}

run().catch(err => {
  console.error('E2E execution error:', err && err.stack ? err.stack.split('\n').slice(0, 6).join('\n') : err);
  process.exit(1);
});
