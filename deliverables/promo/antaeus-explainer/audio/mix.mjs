/* mix.mjs — final audio mix: VO lines at cue times + music bed (ducked under VO) + procedural SFX at cue times.
   usage: node mix.mjs <cues.json> <vo-dir> <music.wav> <out.wav>
   cues.json: { duration, vo: [{file, at}], sfx: [{kind, at, gain?, seed?}], music: { gain, duck, fadeOut } } */
import fs from 'node:fs'; import path from 'node:path';
import * as S from './synth.mjs'; import * as X from './sfx.mjs';
const [cuesPath, voDir, musicPath, outPath] = process.argv.slice(2);
const cues = JSON.parse(fs.readFileSync(cuesPath, 'utf8'));
const out = new S.Buf(cues.duration + 0.5);
// ── music with ducking envelope ──
const music = S.readWav(musicPath); const mg = cues.music?.gain ?? 0.55, duck = cues.music?.duck ?? 0.42;
const envl = new Float32Array(out.n).fill(1);
// duck windows around each line; windows closer than 1.5 s are merged so a short breath between lines stays ducked
const wins = cues.vo.map(v => [v.at - 0.25, v.at + v.duration + 0.35]).sort((a, b) => a[0] - b[0]).reduce((acc, w) => { const last = acc[acc.length - 1]; if (last && w[0] - last[1] < 1.5) last[1] = Math.max(last[1], w[1]); else acc.push([...w]); return acc; }, []);
for (const [a, b] of wins) { const s = Math.floor(a * S.SR), e = Math.floor(b * S.SR); for (let i = Math.max(0, s); i < Math.min(out.n, e); i++) envl[i] = duck; }
// smooth the envelope: ~0.4 s release so the bed comes back gently, attack 2.2x faster so it gets out of the voice's way
let sm = 1; const k = 1 / (0.4 * S.SR); const env2 = new Float32Array(out.n); for (let i = 0; i < out.n; i++) { sm += (envl[i] - sm) * k * (envl[i] < sm ? 2.2 : 1); env2[i] = sm; }
const fadeOutAt = cues.music?.fadeOut ?? (cues.duration - 1.5); const fadeLen = cues.music?.fadeLen ?? 1.5;
for (let i = 0; i < out.n && i < music.L.length; i++) { const t = i / S.SR; const fo = t > fadeOutAt ? Math.max(0, 1 - (t - fadeOutAt) / fadeLen) : 1; const g = mg * env2[i] * fo; out.L[i] += music.L[i] * g; out.R[i] += music.R[i] * g; }
// ── VO ──
for (const v of cues.vo) { const w = S.readWav(path.join(voDir, v.file)); out.addStereo(w.L, w.R, v.at, v.gain ?? 1.0); }
// ── SFX ──
const make = (s) => { const g = s.gain ?? 1, sd = s.seed ?? 1; switch (s.kind) {
  case 'slide': return X.paperSlide(s.dur ?? 0.42, sd, g); case 'thunk': return X.thunk(0.16, sd, g, s.f ?? 95); case 'tape': return X.tapeRip(0.35, sd, g); case 'scribble': return X.scribble(s.dur ?? 0.6, sd, g, s.speed ?? 11);
  case 'whoosh': return X.whoosh(s.dur ?? 0.5, sd, g, s.rising ?? true); case 'flip': return X.pageFlip(0.3, sd, g); case 'pop': return X.pop(0.09, sd, g, s.f ?? 520); case 'ding': return X.ding(0.9, g, s.f ?? 1568); case 'rustle': return X.rustle(s.dur ?? 0.7, sd, g); case 'tick': return X.tick(g, sd);
  default: return null; } };
// effects sit a little under the voice overall (cues.sfxGain, default -1.4 dB): the critique measured them within 1-3 dB of it
const sfxGain = cues.sfxGain ?? 0.85;
for (const s of cues.sfx || []) { const m = make(s); if (m) out.add(m, s.at, (s.level ?? 0.5) * sfxGain, s.pan ?? 0); }
// ── master: gentle soft clip + normalise to -1 dBTP-ish ──
S.softclip(out, 1.2); S.normalize(out, 0.9);
S.writeWav(outPath, out);
console.log('mix written', outPath, 'duration', (cues.duration + 0.5).toFixed(2));
