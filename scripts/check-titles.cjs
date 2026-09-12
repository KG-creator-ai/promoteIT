const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--no-proxy-server']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  const ROUTE_MAP = {
    dashboard: 'AV-ArtVark',
    projects: 'Projects',
    wizard: 'Wizard',
    studio: 'Resource Stitcher',
    script: 'Script Studio',
    prompts: 'Prompt Hub',
    audio: 'Audio Studio',
    settings: 'Settings'
  };

  const tests = [
    { id: 'dashboard', expected: 'AV-ArtVark Workspace' },
    { id: 'projects', expected: 'Campaign Projects' },
    { id: 'wizard', expected: '4-Step Campaign Wizard' },
    { id: 'studio', expected: 'Resource Stitcher' },
    { id: 'script', expected: 'Master Script Studio' },
    { id: 'prompts', expected: 'AI Video Prompt Hub' },
    { id: 'audio', expected: 'Audio & TTS Studio' },
    { id: 'settings', expected: 'WebLLM & Model Studio' }
  ];

  let allPass = true;
  for (const t of tests) {
    await page.evaluate((targetId) => {
      const name = { dashboard: 'AV-ArtVark', projects: 'Projects', wizard: 'Wizard', studio: 'Resource Stitcher', script: 'Script Studio', prompts: 'Prompt Hub', audio: 'Audio Studio', settings: 'Settings' }[targetId];
      const btn = Array.from(document.querySelectorAll('nav button, button')).find(b => b.textContent && b.textContent.includes(name));
      if (btn) btn.click();
    }, t.id);
    await new Promise(r => setTimeout(r, 800));
    const title = await page.title();
    const pass = title.includes(t.expected);
    if (!pass) allPass = false;
    console.log((pass ? 'PASS' : 'FAIL') + ' | ' + t.id + ': ' + title);
  }

  await browser.close();
  console.log(allPass ? '\nALL 8 ROUTE TITLES PASS' : '\nSOME TITLES FAILED');
  process.exit(allPass ? 0 : 1);
})();
