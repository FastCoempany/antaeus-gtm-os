// Render several frames of a page at given times. usage: node stills.mjs <page.html> <outdir> t1 t2 t3 ...
import { chromium } from 'playwright'; import path from 'node:path'; import fs from 'node:fs';
const [page, outdir, ...times] = process.argv.slice(2); fs.mkdirSync(outdir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--allow-file-access-from-files', '--disable-gpu-vsync', '--disable-frame-rate-limit', '--font-render-hinting=none'] });
const pg = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
pg.on('pageerror', e => console.error('PAGEERROR', e.message)); pg.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
await pg.goto('file://' + path.resolve(page) + '?render=1'); await pg.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
for (const t of times) { const t0 = Date.now(); const dataUrl = await pg.evaluate((tt) => { window.__render(+tt); return document.querySelector('canvas').toDataURL('image/png'); }, t); fs.writeFileSync(path.join(outdir, `t${String(t).padStart(5, '0')}.png`), Buffer.from(dataUrl.slice(22), 'base64')); console.log('t=' + t, (Date.now() - t0) + 'ms'); }
await browser.close();
