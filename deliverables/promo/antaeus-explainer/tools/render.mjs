/* render.mjs — render the film to frames with Playwright and mux with audio via ffmpeg.
   usage: node render.mjs <index.html> <out.mp4> [fps=30] [duration] [audio.wav] [W] [H]                */
import { chromium } from 'playwright'; import path from 'node:path'; import fs from 'node:fs'; import { execFileSync } from 'node:child_process';
const [page, outMp4, fpsArg = '30', durArg, audio, W = '1920', H = '1080'] = process.argv.slice(2);
const fps = +fpsArg; const framesDir = path.join(path.dirname(path.resolve(outMp4)), '.frames'); fs.rmSync(framesDir, { recursive: true, force: true }); fs.mkdirSync(framesDir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--allow-file-access-from-files', '--disable-gpu-vsync', '--disable-frame-rate-limit', '--font-render-hinting=none'] });
const pg = await browser.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1 });
pg.on('pageerror', e => console.error('PAGEERROR', e.message)); pg.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
await pg.goto('file://' + path.resolve(page) + '?render=1');
await pg.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
const duration = durArg ? +durArg : await pg.evaluate(() => window.__duration);
const total = Math.ceil(duration * fps); const t0 = Date.now();
for (let i = 0; i < total; i++) {
  const dataUrl = await pg.evaluate((tt) => { window.__render(tt); return document.querySelector('canvas').toDataURL('image/png'); }, i / fps);
  fs.writeFileSync(path.join(framesDir, `f${String(i).padStart(5, '0')}.png`), Buffer.from(dataUrl.slice(22), 'base64'));
  if (i % 60 === 0) console.log(`frame ${i}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close();
const args = ['-v', 'error', '-y', '-framerate', String(fps), '-i', path.join(framesDir, 'f%05d.png')];
if (audio) args.push('-i', audio);
args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', String(fps));
if (audio) args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
args.push(outMp4);
execFileSync('ffmpeg', args, { stdio: 'inherit' });
console.log('wrote', outMp4, 'frames', total, 'in', ((Date.now() - t0) / 1000).toFixed(0) + 's');
