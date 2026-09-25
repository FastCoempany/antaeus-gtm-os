/* film.js — player + render driver for the Antaeus explainer.
   The film itself lives in scenes.js (pure functions of time). This file owns: fonts, the canvas, audio sync,
   the play cover, keyboard controls, and the deterministic render hooks used by tools/render.mjs. */
import { buildFilm } from './scenes.js';

const W = 1920, H = 1080;
const canvas = document.getElementById('c'); const ctx = canvas.getContext('2d', { alpha: false });
const qs = new URLSearchParams(location.search); const RENDER = qs.get('render') === '1';

function fit() { const s = Math.min(innerWidth / W, innerHeight / H) * 0.98; canvas.style.width = `${W * s}px`; canvas.style.height = `${H * s}px`; }
addEventListener('resize', fit); fit();

const FONT_PROBE = ['400 40px "DM Serif Display"', 'italic 400 40px "DM Serif Display"', '400 20px "Public Sans"', '600 20px "Public Sans"', '700 20px "Public Sans"', '400 20px "JetBrains Mono"', '700 20px "JetBrains Mono"', '600 30px "Caveat"', '700 30px "Caveat"', '400 30px "Kalam"', '700 30px "Kalam"', '400 30px "Patrick Hand"'];

async function main() {
  const cues = await (await fetch('cues.json')).json();
  await Promise.all(FONT_PROBE.map(f => document.fonts.load(f).catch(() => null))); await document.fonts.ready;
  const film = buildFilm(cues); window.__film = film;
  const duration = film.duration;
  window.__duration = duration;
  window.__render = (t) => { film.render(ctx, Math.max(0, Math.min(duration, t))); };
  document.getElementById('cover').querySelector('.hint').textContent = `Antaeus · ${Math.round(duration)} seconds · space to pause · R to restart`;
  if (RENDER) { window.__render(0); window.__ready = true; return; }

  const audio = new Audio(cues.audio || 'audio/mix.mp3'); audio.preload = 'auto';
  const cover = document.getElementById('cover'), bar = document.getElementById('bar'), ctl = document.getElementById('ctl');
  let playing = false, ended = false; let lastDrawn = -1;
  const draw = () => { const t = ended ? duration : audio.currentTime; if (t !== lastDrawn) { window.__render(t); lastDrawn = t; bar.style.width = `${100 * t / duration}%`; ctl.textContent = `${t.toFixed(1)}s / ${duration.toFixed(0)}s`; } requestAnimationFrame(draw); };
  window.__render(0); requestAnimationFrame(draw);
  const start = async () => { ended = false; try { await audio.play(); playing = true; cover.classList.add('hide'); } catch (e) { console.error(e); } };
  cover.addEventListener('click', () => { if (audio.currentTime >= duration - 0.05 || ended) audio.currentTime = 0; start(); });
  audio.addEventListener('ended', () => { ended = true; playing = false; cover.classList.remove('hide'); cover.querySelector('.btn').lastChild.textContent = ' Play again'; });
  addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); if (playing) { audio.pause(); playing = false; } else start(); } if (e.key === 'r' || e.key === 'R') { audio.currentTime = 0; ended = false; start(); } });
  window.__ready = true;
}
main().catch(e => { console.error(e); document.getElementById('ctl').textContent = 'error: ' + e.message; });
