// Render one frame of a page at time t to PNG.  usage: node still.mjs <page.html> <t> <out.png> [W H]
import { chromium } from 'playwright';
import path from 'node:path';
const [page, t, out, W = '1920', H = '1080'] = process.argv.slice(2);
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--allow-file-access-from-files', '--disable-gpu-vsync', '--disable-frame-rate-limit', '--font-render-hinting=none'] });
const pg = await browser.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1 });
pg.on('pageerror', e => console.error('PAGEERROR', e.message)); pg.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
await pg.goto('file://' + path.resolve(page));
await pg.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
await pg.evaluate((tt) => window.__render(+tt), t);
await pg.locator('canvas').first().screenshot({ path: out });
await browser.close(); console.log('wrote', out);
