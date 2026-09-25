/* synth.mjs — a small offline software synthesizer in plain JavaScript.
   Renders instruments into Float32 stereo buffers and writes 16-bit WAV. No dependencies. */
import fs from 'node:fs';
export const SR = 48000;

// ── utilities ──
export function mulberry32(seed) { let a = seed >>> 0; return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
export function freq(n) { if (typeof n === 'number') return n; const m = n.match(/^([A-G][#b]?)(-?\d)$/); const midi = 12 * (parseInt(m[2]) + 1) + NOTE[m[1]]; return 440 * Math.pow(2, (midi - 69) / 12); }
export function env(i, sr, a, d, s, r, dur) { // ADSR in seconds; i = sample index; returns amplitude
  const t = i / sr; if (t < a) return t / a; if (t < a + d) return 1 - (1 - s) * (t - a) / d; if (t < dur - r) return s; const rt = (t - (dur - r)) / r; return rt >= 1 ? 0 : s * (1 - rt); }
export class Buf { constructor(seconds) { this.n = Math.ceil(seconds * SR); this.L = new Float32Array(this.n); this.R = new Float32Array(this.n); }
  add(mono, at, gain = 1, pan = 0) { const s = Math.floor(at * SR); const gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4); for (let i = 0; i < mono.length; i++) { const j = s + i; if (j < 0 || j >= this.n) continue; this.L[j] += mono[i] * gl; this.R[j] += mono[i] * gr; } }
  addStereo(L, R, at, gain = 1) { const s = Math.floor(at * SR); for (let i = 0; i < L.length; i++) { const j = s + i; if (j < 0 || j >= this.n) continue; this.L[j] += L[i] * gain; this.R[j] += R[i] * gain; } }
}

// ── instruments (return mono Float32Array) ──
/** Karplus–Strong plucked string. bright 0..1 (nylon→steel), damp = loop loss */
export function pluck(f, dur, { bright = 0.35, damp = 0.996, seed = 1, attack = 0.002, level = 1 } = {}) {
  const n = Math.ceil(dur * SR), N = Math.max(2, Math.round(SR / f)); const buf = new Float32Array(N); const r = mulberry32(seed);
  // excitation: noise, lowpassed for warmth
  let lp = 0; for (let i = 0; i < N; i++) { const w = r() * 2 - 1; lp += (w - lp) * (0.25 + bright * 0.7); buf[i] = lp; }
  const out = new Float32Array(n); let idx = 0; let prev = buf[N - 1];
  for (let i = 0; i < n; i++) { const cur = buf[idx]; const nxt = buf[(idx + 1) % N]; const v = damp * (0.5 * (cur + nxt) * (1 - bright * 0.3) + bright * 0.3 * cur); buf[idx] = v; out[i] = cur * Math.min(1, i / (attack * SR)); idx = (idx + 1) % N; prev = v; }
  // gentle fade at end + body resonance (tiny lowpass)
  let l2 = 0; for (let i = 0; i < n; i++) { l2 += (out[i] - l2) * 0.6; out[i] = l2 * level * Math.min(1, (n - i) / (0.02 * SR)); }
  return out;
}
/** Glockenspiel / music box bell. */
export function bell(f, dur, { level = 1, hard = 0.3 } = {}) {
  const n = Math.ceil(dur * SR); const out = new Float32Array(n);
  const parts = [[1, 1, 3.5], [2.76, 0.35 + hard * 0.3, 6], [5.4, 0.12 + hard * 0.2, 9], [8.9, 0.05, 12]];
  for (let i = 0; i < n; i++) { const t = i / SR; let v = 0; for (const [m, a, d] of parts) v += a * Math.sin(2 * Math.PI * f * m * t) * Math.exp(-d * t); const att = Math.min(1, t / 0.002); out[i] = v * att * level * 0.5 * Math.min(1, (n - i) / (0.01 * SR)); }
  return out;
}
/** Upright-ish bass: damped low pluck + sine body. */
export function bass(f, dur, { level = 1, seed = 5 } = {}) {
  const p = pluck(f, dur, { bright: 0.1, damp: 0.994, seed, level: 0.8 }); const n = p.length; const out = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; const body = Math.sin(2 * Math.PI * f * t) * Math.exp(-2.2 * t) * 0.55 + Math.sin(2 * Math.PI * f * 2 * t) * Math.exp(-4 * t) * 0.12; out[i] = (p[i] * 0.9 + body) * level * Math.min(1, i / (0.004 * SR)); }
  return out;
}
/** Soft felt piano-ish / marimba tone (sine + harmonics, quick decay). */
export function marimba(f, dur, { level = 1 } = {}) {
  const n = Math.ceil(dur * SR); const out = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; const v = Math.sin(2 * Math.PI * f * t) * Math.exp(-5 * t) + 0.3 * Math.sin(2 * Math.PI * f * 4 * t) * Math.exp(-14 * t) + 0.15 * Math.sin(2 * Math.PI * f * 10 * t) * Math.exp(-30 * t); out[i] = v * Math.min(1, t / 0.003) * level * 0.6; }
  return out;
}
/** Warm pad (detuned saws through lowpass) for sustained beds. */
export function pad(f, dur, { level = 1, a = 0.6, r = 0.8, cutoff = 0.08, seed = 9 } = {}) {
  const n = Math.ceil(dur * SR); const out = new Float32Array(n); const det = [0.996, 1, 1.004, 0.5]; let lp = 0, lp2 = 0; const rr = mulberry32(seed);
  const ph = det.map(() => rr() * 6.28);
  for (let i = 0; i < n; i++) { const t = i / SR; let v = 0; for (let k = 0; k < det.length; k++) { const x = ((f * det[k] * t + ph[k]) % 1); v += (2 * x - 1) * (k === 3 ? 0.5 : 0.35); } lp += (v - lp) * cutoff; lp2 += (lp - lp2) * cutoff; out[i] = lp2 * env(i, SR, a, 0.2, 0.85, r, dur) * level * 0.5; }
  return out;
}
export function noise(dur, { seed = 3 } = {}) { const n = Math.ceil(dur * SR); const out = new Float32Array(n); const r = mulberry32(seed); for (let i = 0; i < n; i++) out[i] = r() * 2 - 1; return out; }
/** Shaker: bandpassed noise with quick envelope. */
export function shaker(dur = 0.12, { level = 1, seed = 11, tone = 0.6 } = {}) {
  const n = Math.ceil(dur * SR); const out = new Float32Array(n); const r = mulberry32(seed); let hp = 0, prev = 0, lp = 0;
  for (let i = 0; i < n; i++) { const w = r() * 2 - 1; hp = 0.97 * (hp + w - prev); prev = w; lp += (hp - lp) * (0.35 + tone * 0.4); const t = i / SR; out[i] = lp * Math.exp(-t * 38) * Math.min(1, t / 0.003) * level * 0.9; }
  return out;
}
/** Soft kick / thump. */
export function kick(dur = 0.25, { level = 1, f0 = 110, f1 = 48 } = {}) { const n = Math.ceil(dur * SR); const out = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR; const f = f1 + (f0 - f1) * Math.exp(-t * 28); ph += 2 * Math.PI * f / SR; out[i] = Math.sin(ph) * Math.exp(-t * 11) * level * 0.9; } return out; }
/** Rim click / woodblock. */
export function click(dur = 0.06, { level = 1, seed = 13, f = 1800 } = {}) { const n = Math.ceil(dur * SR); const out = new Float32Array(n); const r = mulberry32(seed); for (let i = 0; i < n; i++) { const t = i / SR; out[i] = (Math.sin(2 * Math.PI * f * t) * 0.6 + (r() * 2 - 1) * 0.5) * Math.exp(-t * 90) * level * 0.7; } return out; }

// ── effects ──
export function lowpass(x, cutoff) { const out = new Float32Array(x.length); let lp = 0; for (let i = 0; i < x.length; i++) { lp += (x[i] - lp) * cutoff; out[i] = lp; } return out; }
export function highpass(x, k = 0.995) { const out = new Float32Array(x.length); let hp = 0, prev = 0; for (let i = 0; i < x.length; i++) { hp = k * (hp + x[i] - prev); prev = x[i]; out[i] = hp; } return out; }
/** Schroeder reverb (4 combs + 2 allpass) on a stereo buffer; returns wet L/R. */
export function reverb(L, R, { size = 0.82, damp = 0.35, spread = 23 } = {}) {
  const combs = [1557, 1617, 1491, 1422].map(v => Math.round(v * SR / 44100 * (0.9 + size * 0.3))); const aps = [225, 556].map(v => Math.round(v * SR / 44100));
  const run = (x, offs) => { const n = x.length; let acc = new Float32Array(n);
    for (const cl of combs) { const len = cl + offs; const buf = new Float32Array(len); let idx = 0, filt = 0; const fb = 0.72 + size * 0.2; for (let i = 0; i < n; i++) { const y = buf[idx]; filt = y * (1 - damp) + filt * damp; buf[idx] = x[i] + filt * fb; idx = (idx + 1) % len; acc[i] += y * 0.25; } }
    for (const al of aps) { const buf = new Float32Array(al); let idx = 0; const g = 0.5; for (let i = 0; i < n; i++) { const bo = buf[idx]; const y = -acc[i] + bo; buf[idx] = acc[i] + bo * g; acc[i] = y; idx = (idx + 1) % al; } }
    return acc; };
  return [run(L, 0), run(R, spread)];
}
export function normalize(buf, peak = 0.89) { let m = 0; for (let i = 0; i < buf.n; i++) m = Math.max(m, Math.abs(buf.L[i]), Math.abs(buf.R[i])); const g = m > 0 ? peak / m : 1; for (let i = 0; i < buf.n; i++) { buf.L[i] *= g; buf.R[i] *= g; } return g; }
export function softclip(buf, k = 1.6) { for (let i = 0; i < buf.n; i++) { buf.L[i] = Math.tanh(buf.L[i] * k) / Math.tanh(k); buf.R[i] = Math.tanh(buf.R[i] * k) / Math.tanh(k); } }
export function writeWav(path, buf) {
  const n = buf.n; const data = Buffer.alloc(44 + n * 4); const w = (o, s) => data.write(s, o, 'ascii');
  w(0, 'RIFF'); data.writeUInt32LE(36 + n * 4, 4); w(8, 'WAVE'); w(12, 'fmt '); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(2, 22); data.writeUInt32LE(SR, 24); data.writeUInt32LE(SR * 4, 28); data.writeUInt16LE(4, 32); data.writeUInt16LE(16, 34); w(36, 'data'); data.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(buf.L[i] * 32767))), 44 + i * 4); data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(buf.R[i] * 32767))), 46 + i * 4); }
  fs.writeFileSync(path, data);
}
export function readWav(path) { // 16-bit PCM only (mono or stereo), any sample rate (no resampling; caller ensures SR)
  const d = fs.readFileSync(path); let o = 12; let fmt = null, dataOff = 0, dataLen = 0;
  while (o < d.length) { const id = d.toString('ascii', o, o + 4); const len = d.readUInt32LE(o + 4); if (id === 'fmt ') fmt = { ch: d.readUInt16LE(o + 10), sr: d.readUInt32LE(o + 12), bits: d.readUInt16LE(o + 22) }; if (id === 'data') { dataOff = o + 8; dataLen = len; break; } o += 8 + len + (len % 2); }
  const frames = dataLen / (fmt.ch * fmt.bits / 8); const L = new Float32Array(frames), R = new Float32Array(frames);
  for (let i = 0; i < frames; i++) { const base = dataOff + i * fmt.ch * 2; const l = d.readInt16LE(base) / 32768; const r = fmt.ch > 1 ? d.readInt16LE(base + 2) / 32768 : l; L[i] = l; R[i] = r; }
  return { L, R, sr: fmt.sr, ch: fmt.ch };
}
