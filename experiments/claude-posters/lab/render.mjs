// Render posters: node render.mjs posters/<name>.js [...]  →  out/<name>.png (2160 × 3056)
// Serves the repo root, so posters can load /site/media and /site/fonts; fonts for the text faces come from
// node_modules (run `npm install` in this folder first). Playwright is the global install.
import { createRequire } from 'module';
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const LAB = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(LAB, '../../..');
const { chromium } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright');
const PORT = 8765 + Math.floor(Math.random() * 200);
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
fs.mkdirSync(path.join(LAB, 'out'), { recursive: true });
const rel = path.relative(ROOT, LAB).split(path.sep).join('/');
const browser = await chromium.launch();
try {
  for (const file of process.argv.slice(2)) {
    const name = path.basename(file, '.js');
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.log(`[${name}] ERROR`, e.message));
    page.on('console', (m) => { if (!/willReadFrequently/.test(m.text())) console.log(`[${name}]`, m.text()); });
    await page.goto(`http://127.0.0.1:${PORT}/${rel}/index.html?p=${encodeURIComponent(file)}&k=${process.env.K || 2}${process.env.CAP ? '&cap=1' : ''}`);
    await page.waitForFunction('window.__done || window.__err', null, { timeout: 900000 });
    const err = await page.evaluate('window.__err');
    if (err) { console.log(`[${name}] FAILED`, err); continue; }
    const data = await page.evaluate('window.__done');
    fs.writeFileSync(path.join(LAB, 'out', `${name}.png`), Buffer.from(data.split(',')[1], 'base64'));
    if (process.env.CAP) {
      const snaps = await page.evaluate('window.SNAPS'), dir = path.join(LAB, 'out', `${name}-snaps`);
      fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
      snaps.forEach(([n, d], i) => fs.writeFileSync(path.join(dir, `${String(i).padStart(2, '0')}-${n}.png`), Buffer.from(d.split(',')[1], 'base64')));
      console.log(`[${name}] ${snaps.length} snaps`);
    }
    console.log(`[${name}] ok`);
    await page.close();
  }
} finally { await browser.close(); srv.kill(); }
