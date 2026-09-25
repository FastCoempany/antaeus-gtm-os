/* sfx.mjs — procedural paper / pen / tape sound effects. Each returns a mono Float32Array at SR. */
import { SR, mulberry32, noise } from './synth.mjs';
const bp = (x, f, q = 0.9) => { // simple resonant bandpass (state-variable)
  const out = new Float32Array(x.length); let lp = 0, bpv = 0; const F = 2 * Math.sin(Math.PI * Math.min(f, SR / 4) / SR); const Q = 1 - q;
  for (let i = 0; i < x.length; i++) { const hp = x[i] - lp - Q * bpv; bpv += F * hp; lp += F * bpv; out[i] = bpv; } return out; };
const envMul = (x, fn) => { for (let i = 0; i < x.length; i++) x[i] *= fn(i / SR); return x; };
const fadeEnds = (x, ms = 4) => { const k = Math.round(ms / 1000 * SR); for (let i = 0; i < k && i < x.length; i++) { x[i] *= i / k; x[x.length - 1 - i] *= i / k; } return x; };
/** Paper sliding onto a desk. */
export function paperSlide(dur = 0.42, seed = 21, level = 1) { const x = bp(noise(dur, { seed }), 2600, 0.6); return fadeEnds(envMul(x, t => Math.sin(Math.PI * Math.min(1, t / dur)) ** 1.6 * level * 1.4)); }
/** Sticky note / card landing with a light thump. */
export function thunk(dur = 0.16, seed = 22, level = 1, f = 95) { const x = noise(dur, { seed }); const out = new Float32Array(x.length); for (let i = 0; i < x.length; i++) { const t = i / SR; out[i] = (Math.sin(2 * Math.PI * (f + 60 * Math.exp(-t * 60)) * t) * 0.8 + x[i] * 0.25 * Math.exp(-t * 120)) * Math.exp(-t * 34) * level; } return fadeEnds(out); }
/** Tape being pulled off the roll and pressed down. */
export function tapeRip(dur = 0.35, seed = 23, level = 1) { const x = noise(dur, { seed }); const r = mulberry32(seed + 1); let crack = 1; const out = bp(x, 3400, 0.5); for (let i = 0; i < out.length; i++) { if (r() < 0.02) crack = 0.3 + r() * 1.4; crack += (1 - crack) * 0.01; out[i] *= crack; } return fadeEnds(envMul(out, t => (t < dur * 0.75 ? 0.7 + 0.3 * Math.sin(t * 90) : (dur - t) / (dur * 0.25)) * level * 1.2)); }
/** Marker scribbling on paper. speed = strokes per second */
export function scribble(dur = 0.6, seed = 24, level = 1, speed = 11) { const x = bp(noise(dur, { seed }), 1900, 0.55); return fadeEnds(envMul(x, t => (0.35 + 0.65 * Math.abs(Math.sin(Math.PI * t * speed))) * Math.min(1, t / 0.03) * Math.min(1, (dur - t) / 0.06) * level * 1.5)); }
/** A soft whoosh (something lifting off / flying past). */
export function whoosh(dur = 0.5, seed = 25, level = 1, rising = true) { const x = noise(dur, { seed }); const out = new Float32Array(x.length); let lp = 0, bpv = 0; for (let i = 0; i < x.length; i++) { const t = i / dur / SR; const f = rising ? 400 + 2600 * t * t : 3000 - 2600 * t; const F = 2 * Math.sin(Math.PI * f / SR); const hp = x[i] - lp - 0.25 * bpv; bpv += F * hp; lp += F * bpv; out[i] = bpv * Math.sin(Math.PI * t) ** 1.3 * level * 1.3; } return fadeEnds(out); }
/** Page flip: short flutter. */
export function pageFlip(dur = 0.3, seed = 26, level = 1) { const x = bp(noise(dur, { seed }), 1500, 0.4); return fadeEnds(envMul(x, t => (Math.exp(-t * 14) * (0.6 + 0.4 * Math.sin(t * 160))) * Math.min(1, t / 0.01) * level * 1.6)); }
/** Tiny pop (an item appearing). */
export function pop(dur = 0.09, seed = 27, level = 1, f = 520) { const out = new Float32Array(Math.ceil(dur * SR)); for (let i = 0; i < out.length; i++) { const t = i / SR; out[i] = Math.sin(2 * Math.PI * (f * (1 + 0.6 * Math.exp(-t * 80))) * t) * Math.exp(-t * 45) * level * 0.8; } return fadeEnds(out); }
/** Gentle "ding" for a confirmation moment. */
export function ding(dur = 0.9, level = 1, f = 1568) { const out = new Float32Array(Math.ceil(dur * SR)); for (let i = 0; i < out.length; i++) { const t = i / SR; out[i] = (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-t * 8)) * Math.exp(-t * 4.5) * Math.min(1, t / 0.002) * level * 0.4; } return fadeEnds(out); }
/** Paper crumple / rustle (chaos moments). */
export function rustle(dur = 0.7, seed = 28, level = 1) { const x = bp(noise(dur, { seed }), 2200, 0.35); const r = mulberry32(seed + 3); let g = 0.5; for (let i = 0; i < x.length; i++) { if (r() < 0.004) g = 0.2 + r() * 1.2; g += (0.5 - g) * 0.002; x[i] *= g; } return fadeEnds(envMul(x, t => Math.sin(Math.PI * Math.min(1, t / dur)) ** 0.8 * level * 1.3)); }
/** Wood-block "tick" for counting beats. */
export function tick(level = 1, seed = 29) { const out = new Float32Array(Math.ceil(0.05 * SR)); const r = mulberry32(seed); for (let i = 0; i < out.length; i++) { const t = i / SR; out[i] = (Math.sin(2 * Math.PI * 2100 * t) * 0.7 + (r() * 2 - 1) * 0.3) * Math.exp(-t * 110) * level * 0.7; } return out; }
