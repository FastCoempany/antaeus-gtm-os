import { chromium } from 'playwright'; import path from 'node:path';
const browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--allow-file-access-from-files'] });
const pg = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
pg.on('pageerror', e => console.error('PAGEERROR', e.message)); pg.on('console', m => console.log('CONSOLE', m.type(), m.text()));
await pg.goto('file://' + path.resolve(process.argv[2]) + '?render=1'); await pg.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
const expr = process.argv[3] || 'JSON.stringify(window.__film.T)';
console.log(await pg.evaluate(expr));
await browser.close();
