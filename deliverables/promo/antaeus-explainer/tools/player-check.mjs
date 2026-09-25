// Smoke-test the HTML player: load, click the cover, confirm audio advances and frames draw, no page errors.
import { chromium } from 'playwright'; import path from 'node:path';
const browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
const pg = await browser.newPage({ viewport: { width: 1600, height: 900 } }); const errors = [];
pg.on('pageerror', e => errors.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await pg.goto('file://' + path.resolve(process.argv[2])); await pg.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
await pg.click('#cover'); await pg.waitForTimeout(2500);
const r = await pg.evaluate(() => ({ t: document.querySelector('#ctl').textContent, coverHidden: document.querySelector('#cover').classList.contains('hide'), bar: document.querySelector('#bar').style.width, dur: window.__duration }));
console.log(JSON.stringify(r), 'errors:', errors); await browser.close();
