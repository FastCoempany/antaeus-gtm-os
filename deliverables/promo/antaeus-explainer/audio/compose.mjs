/* compose.mjs — the music bed for the Antaeus explainer, composed in code.
   A whimsical, unhurried piece: nylon-string plucks (Karplus–Strong), music-box bells, an upright-ish bass,
   shaker + soft woodblock. Sections follow the film's beats (times in seconds, passed in via a JSON file or defaults). */
import * as S from './synth.mjs';
import fs from 'node:fs';

const cfg = process.argv[2] && fs.existsSync(process.argv[2]) ? JSON.parse(fs.readFileSync(process.argv[2], 'utf8')) : {};
const OUT = process.argv[3] || new URL('./music.wav', import.meta.url).pathname;
const BPM = cfg.bpm ?? 104; const BEAT = 60 / BPM; const BAR = BEAT * 4;
// section boundaries (seconds). Defaults approximate the script; the film's cue sheet overrides.
const T = Object.assign({ intro: 0, problem: 6, idea: 13, does: 19, drift: 33, recover: 37.5, handoff: 40, cta: 47, end: 54 }, cfg.sections || {});
const DUR = T.end + 4;
const buf = new S.Buf(DUR);
const f = S.freq; const r = S.mulberry32(cfg.seed ?? 7);

// chord vocabulary (roots in C major); voicings for uke (4 strings) and bass
const CH = {
  I: { bass: 'C2', uke: ['C4', 'E4', 'G4', 'C5'], bell: ['E5', 'G5', 'C6'] },
  IV: { bass: 'F2', uke: ['F3', 'A3', 'C4', 'F4'], bell: ['A5', 'C6', 'F6'] },
  V: { bass: 'G2', uke: ['G3', 'B3', 'D4', 'G4'], bell: ['B5', 'D6', 'G6'] },
  vi: { bass: 'A2', uke: ['A3', 'C4', 'E4', 'A4'], bell: ['C6', 'E6', 'A6'] },
  ii: { bass: 'D2', uke: ['D4', 'F4', 'A4', 'D5'], bell: ['F5', 'A5', 'D6'] },
  iii: { bass: 'E2', uke: ['E4', 'G4', 'B4', 'E5'], bell: ['G5', 'B5', 'E6'] },
  Isus: { bass: 'C2', uke: ['C4', 'F4', 'G4', 'C5'], bell: ['F5', 'G5', 'C6'] },
  IVm: { bass: 'F2', uke: ['F3', 'Ab3', 'C4', 'F4'], bell: ['Ab5', 'C6', 'F6'] },
};
let pluckSeed = 100;
const uke = (note, at, gain = 0.5, pan = 0, dur = 1.6, bright = 0.18) => buf.add(S.pluck(f(note), dur, { bright, damp: 0.9965, seed: pluckSeed++ }), at, gain, pan);
const bell = (note, at, gain = 0.35, pan = 0.3, dur = 1.6) => buf.add(S.bell(f(note), dur, { hard: 0.25 }), at, gain * 1.25, pan);
const bass = (note, at, gain = 0.55, dur = 0.9) => buf.add(S.bass(f(note), dur, { seed: pluckSeed++ }), at, gain * 0.62, 0);
const shaker = (at, gain = 0.22, tone = 0.6) => buf.add(S.shaker(0.13, { seed: pluckSeed++, tone }), at, gain, -0.25);
const block = (at, gain = 0.25) => buf.add(S.click(0.06, { seed: pluckSeed++, f: 1500 }), at, gain, 0.2);
const kick = (at, gain = 0.35) => buf.add(S.kick(0.25, { f0: 100, f1: 46 }), at, gain * 0.7, 0);
const marimba = (note, at, gain = 0.4, pan = -0.2, dur = 1.2) => buf.add(S.marimba(f(note), dur), at, gain, pan);

// strum: 4 strings staggered by ~12ms, downstroke
const strum = (chord, at, gain = 0.42, dur = 1.5, pan = -0.1, up = false) => { const notes = up ? [...CH[chord].uke].reverse() : CH[chord].uke; notes.forEach((n, i) => uke(n, at + i * 0.012, gain * (0.9 + 0.1 * (i / 3)), pan + (i - 1.5) * 0.06, dur)); };
// arpeggio pattern within a bar (8ths): indices into uke voicing
const arp = (chord, at, pattern, gain = 0.4, pan = -0.1) => pattern.forEach((idx, i) => { if (idx == null) return; uke(CH[chord].uke[idx], at + i * BEAT / 2, gain * (i % 2 ? 0.85 : 1), pan + (idx - 1.5) * 0.05, 1.3); });

// ── the melody vocabulary (bells) — a small, hummable motif in C ──
const MOTIF_A = [['E5', 0], ['G5', 0.5], ['C6', 1], ['B5', 2], ['G5', 2.5], ['E5', 3]];          // rising, settles
const MOTIF_B = [['D6', 0], ['C6', 0.5], ['B5', 1], ['G5', 1.5], ['A5', 2.5], ['G5', 3]];     // answer
const MOTIF_C = [['E6', 0], ['D6', 0.5], ['C6', 1], ['G5', 2], ['E6', 3], ['D6', 3.5]];      // brighter
const playMotif = (m, at, gain = 0.32, pan = 0.35) => m.forEach(([n, b]) => bell(n, at + b * BEAT, gain * (b % 1 ? 0.8 : 1), pan));

// helper: bars from a start time until an end time
const barsBetween = (a, b) => { const out = []; for (let t = a; t < b - 0.05; t += BAR) out.push(t); return out; };

// ── SECTION 1 · INTRO (curious, sparse) ──
{
  const bars = barsBetween(T.intro, T.problem);
  const prog = ['I', 'IV', 'I', 'V'];
  bars.forEach((t, i) => { const c = prog[i % 4]; arp(c, t, [0, null, 2, null, 1, null, 3, null], 0.34, -0.15); if (i === 0) bell('C6', t + BEAT * 0.5, 0.25, 0.4, 2.5); if (i === 1) playMotif(MOTIF_A, t, 0.24); });
  bass('C2', T.intro + 0.02, 0.4, 1.4);
}
// ── SECTION 2 · THE PROBLEM (busier, a little comic; minor colour) ──
{
  const bars = barsBetween(T.problem, T.idea);
  const prog = ['vi', 'IV', 'ii', 'V'];
  bars.forEach((t, i) => {
    const c = prog[i % 4];
    arp(c, t, [0, 2, 1, 2, 3, 2, 1, 2], 0.36, -0.15);
    bass(CH[c].bass, t, 0.5, 0.8); bass(CH[c].bass, t + BEAT * 2.5, 0.38, 0.6);
    for (let k = 0; k < 8; k++) shaker(t + k * BEAT / 2, k % 2 ? 0.14 : 0.2, k % 2 ? 0.8 : 0.5);
    block(t + BEAT, 0.16); block(t + BEAT * 3, 0.16);
    if (i % 2 === 1) playMotif(MOTIF_B, t, 0.22, 0.3);
  });
}
// ── SECTION 3 · THE IDEA (warm, opening up; the grounding moment) ──
{
  const bars = barsBetween(T.idea, T.does);
  const prog = ['I', 'IV', 'I', 'V'];
  // a soft low thump on the first beat: feet meet ground
  kick(T.idea, 0.45); buf.add(S.pad(f('C3'), 5.5, { level: 0.35, a: 0.9, r: 1.6, cutoff: 0.05 }), T.idea, 0.3, 0);
  bars.forEach((t, i) => { const c = prog[i % 4]; strum(c, t, 0.4, 1.8, -0.1); strum(c, t + BEAT * 2, 0.3, 1.4, -0.1, true); bass(CH[c].bass, t, 0.5, 1.2); if (i === 0) { ['C5', 'E5', 'G5', 'C6', 'E6'].forEach((n, k) => bell(n, t + 0.25 + k * 0.09, 0.22, 0.3, 2.2)); } if (i === 1) playMotif(MOTIF_A, t, 0.3); });
}
// ── SECTION 4 · WHAT IT DOES (steady, bright groove) ──
{
  const bars = barsBetween(T.does, T.drift);
  const prog = ['I', 'V', 'vi', 'IV'];
  bars.forEach((t, i) => {
    const c = prog[i % 4];
    arp(c, t, [0, 2, 1, 3, 0, 2, 1, 3], 0.36, -0.15);
    strum(c, t + BEAT * 1.5, 0.22, 1.0, 0.05, true);
    bass(CH[c].bass, t, 0.52, 0.9); bass(CH[c].bass, t + BEAT * 1.5, 0.3, 0.5); bass(CH[c].bass, t + BEAT * 2.5, 0.4, 0.7);
    for (let k = 0; k < 8; k++) shaker(t + k * BEAT / 2, k % 2 ? 0.15 : 0.22, k % 2 ? 0.8 : 0.5);
    kick(t, 0.28); kick(t + BEAT * 2.5, 0.2); block(t + BEAT, 0.18); block(t + BEAT * 3, 0.18);
    if (i % 4 === 1) playMotif(MOTIF_A, t, 0.28); if (i % 4 === 3) playMotif(MOTIF_C, t, 0.28);
    if (i % 2 === 0) marimba(CH[c].uke[0], t + BEAT * 3.5, 0.3, -0.3);
  });
}
// ── SECTION 5 · THE DRIFT (thin, suspended, minor colour; then the recovery) ──
{
  const bars = barsBetween(T.drift, T.recover);
  buf.add(S.pad(f('F3'), T.recover - T.drift + 1.2, { level: 0.3, a: 0.6, r: 1.2, cutoff: 0.045 }), T.drift, 0.35, 0);
  buf.add(S.pad(f('Ab3'), T.recover - T.drift + 1.0, { level: 0.22, a: 0.9, r: 1.0, cutoff: 0.045 }), T.drift + 0.3, 0.3, 0.2);
  bars.forEach((t, i) => { const c = i % 2 ? 'IVm' : 'IVm'; uke(CH[c].uke[3], t, 0.28, 0.2, 2.2, 0.2); uke(CH[c].uke[1], t + BEAT * 1.5, 0.2, -0.2, 2, 0.2); bell('Ab5', t + BEAT * 2, 0.16, 0.4, 2.4); });
  // rising tension tick, then release
  for (let k = 0; k < 6; k++) block(T.drift + 1.2 + k * BEAT * 0.5, 0.1 + k * 0.02);
  // recovery: a landing thump + resolving strum + bells cascading down
  kick(T.recover, 0.45); strum('I', T.recover + 0.02, 0.5, 2.2, -0.1);
  ['G6', 'E6', 'C6', 'G5', 'E5', 'C5'].forEach((n, k) => bell(n, T.recover + 0.15 + k * 0.1, 0.24, 0.3, 2.4));
  bass('C2', T.recover, 0.55, 1.6);
}
// ── SECTION 6 · THE HANDOFF (warmest, fullest) ──
{
  const bars = barsBetween(T.handoff, T.cta);
  const prog = ['I', 'IV', 'vi', 'V', 'I', 'IV', 'V', 'I'];
  buf.add(S.pad(f('C3'), T.cta - T.handoff + 2, { level: 0.28, a: 1.2, r: 2, cutoff: 0.05 }), T.handoff, 0.3, 0);
  bars.forEach((t, i) => {
    const c = prog[i % prog.length];
    strum(c, t, 0.42, 1.8, -0.1); arp(c, t + BEAT * 2, [0, 2, 1, 3], 0.3, -0.1);
    bass(CH[c].bass, t, 0.5, 1.2); bass(CH[c].bass, t + BEAT * 2, 0.36, 0.9);
    for (let k = 0; k < 8; k++) shaker(t + k * BEAT / 2, k % 2 ? 0.12 : 0.18, k % 2 ? 0.8 : 0.5);
    kick(t, 0.25); block(t + BEAT * 2, 0.15);
    if (i % 2 === 0) playMotif(i % 4 === 0 ? MOTIF_A : MOTIF_C, t, 0.3);
    marimba(CH[c].uke[1], t + BEAT * 1.5, 0.28, -0.3);
  });
}
// ── SECTION 7 · CTA / END (settle, ring out) ──
{
  const t0 = T.cta;
  strum('IV', t0, 0.4, 2.0, -0.1); bass('F2', t0, 0.5, 1.4);
  strum('V', t0 + BAR * 0.5, 0.36, 1.6, -0.1); bass('G2', t0 + BAR * 0.5, 0.45, 1.2);
  const tEnd = t0 + BAR; // final tonic
  kick(tEnd, 0.4); strum('I', tEnd, 0.5, 4.5, -0.1); bass('C2', tEnd, 0.55, 3.5);
  ['C5', 'E5', 'G5', 'C6', 'E6', 'G6'].forEach((n, k) => bell(n, tEnd + 0.2 + k * 0.11, 0.26, 0.3 - k * 0.1, 3.5));
  buf.add(S.pad(f('C3'), 6, { level: 0.3, a: 0.5, r: 3.5, cutoff: 0.045 }), tEnd, 0.3, 0);
  bell('C6', tEnd + BAR, 0.2, 0.3, 3.5); bell('G6', tEnd + BAR + BEAT, 0.14, 0.4, 3.5);
}

// ── master tone: warm it up (two gentle lowpasses ≈ 7 kHz), then reverb, soft clip, normalise ──
{ const k = 1 - Math.exp(-2 * Math.PI * 12000 / S.SR); for (const ch of [buf.L, buf.R]) { let a = 0; for (let i = 0; i < buf.n; i++) { a += (ch[i] - a) * k; ch[i] = a; } } }
const [wl, wr] = S.reverb(buf.L, buf.R, { size: 0.8, damp: 0.4 });
for (let i = 0; i < buf.n; i++) { buf.L[i] += wl[i] * 0.22; buf.R[i] += wr[i] * 0.22; }
S.softclip(buf, 1.3); S.normalize(buf, 0.85);
S.writeWav(OUT, buf);
console.log('music written', OUT, 'duration', DUR.toFixed(1) + 's', 'sections', JSON.stringify(T));
