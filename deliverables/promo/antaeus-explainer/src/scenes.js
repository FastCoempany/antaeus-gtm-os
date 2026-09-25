/* scenes.js — the film. One continuous paper world (the founder's desk never leaves the page) plus an end card.
   Every frame is a pure function of absolute time t. buildFilm(cues) → { duration, render(ctx, t) }.
   sfxFor(cues) + musicSectionsFor(cues) share plan(), so sound cues and picture come from one source of truth. */
import * as P from './paper.js';
import { seg, E, ease, lerp, clamp, boilAt, walk, blink, pulse } from './engine.js';

const W = 1920, H = 1080, GY = 900;
const COMPANIES = ['Boeing', 'Starbucks', 'OpenAI', 'Chipotle', 'Sweetgreen', 'Notion'];
const BOOK_PARTS = ['who we win with', 'the outreach that landed', 'the questions that won the meeting', 'where deals leak', 'the losses we paid for', 'why we win', "the week's rhythm"];
const FS = 1.32;
const DESK = { x: 90, w: 550, top: GY - 190 };
const FX = 740; // where the founder stands (right of the desk)
const standing = { legL: 0, legR: 0, armL: 0.1, armR: -0.1, bob: 0 };
const HIRE = { seed: 130, flip: -1, jacket: '#b5875a', hair: P.C.hairDark, hairStyle: 1 };
const FOUNDER = { seed: 100, jacket: P.C.ink, hair: P.C.hairDark };
const tileW = 178, tileH = 72; const TILE = (i) => [1330 + (i % 2) * (tileW + 8), GY - tileH - Math.floor(i / 2) * (tileH + 6)];
const HIRE_WAIT = 1830; const AX = 1000; // the small A's home on the line // the hire waits at the right margin from the head beat to the book beat

// ───────────────────────────── the plan ─────────────────────────────
export function plan(cues) {
  const byRole = {}; cues.beats.forEach((b, i) => { byRole[b.role || `b${i + 1}`] = b; });
  const roles = ['hook', 'head', 'myth', 'tell', 'morning', 'slip', 'book', 'hire', 'cta'];
  const B = {}; roles.forEach((r, i) => { B[r] = byRole[r] || cues.beats[i] || cues.beats[cues.beats.length - 1]; });
  const wordAt = (b, w, frac = 0.5) => { const ws = b.words || []; const m = ws.find(x => x.w.toLowerCase().replace(/[^a-z']/g, '') === w); if (m) return b.voStart + m.s; return b.voStart != null ? b.voStart + (b.voEnd - b.voStart) * frac : b.start + (b.end - b.start) * frac; };
  const T = {
    end: cues.duration,
    // hook
    deskIn: B.hook.start + 0.1, founderIn: B.hook.start + 0.2, label: B.hook.start + 0.9, notes: wordAt(B.hook, 'forty', 0.35) - 0.2, notesEnd: Math.max(wordAt(B.hook, 'forty', 0.35) + 1.6, B.hook.end - 0.9), loud: wordAt(B.hook, 'loudest', 0.7),
    // head
    bubble: B.head.start + 0.15, hireIn: Math.max(B.head.start + 0.3, wordAt(B.head, "can't", 0.42) - 0.7), hireStop: Math.max(B.head.start + 0.3, wordAt(B.head, "can't", 0.42) - 0.7) + 1.25, handover: wordAt(B.head, 'hand', 0.62) - 0.15, snap: wordAt(B.head, 'hand', 0.62) + 0.55, qmark: wordAt(B.head, 'hand', 0.62) + 0.95, liftText: wordAt(B.head, 'hand', 0.62), tile: B.head.start + 0.9,
    // myth
    handIn: B.myth.start + 0.05, pinch: B.myth.start + 0.55, pull: B.myth.start + 0.65, taut: B.myth.start + 1.45, giantIn: B.myth.start + 1.7, title: wordAt(B.myth, 'antaeus', 0.05), named: wordAt(B.myth, 'antaeus', 0.05) + 0.7, ticks: B.myth.start + 2.5,
    heave: Math.min(wordAt(B.myth, 'lifted', 0.78) - 0.1, B.myth.end - 3.0), liftedLabel: Math.min(wordAt(B.myth, 'lifted', 0.78) + 0.15, B.myth.end - 2.4), reground: Math.max(Math.min(wordAt(B.myth, 'weak', 0.93) + 0.45, B.myth.end - 1.3), Math.min(wordAt(B.myth, 'lifted', 0.78) - 0.1, B.myth.end - 3.0) + 1.5), giantFade: B.tell.start + 0.1, markIn: B.tell.start + 0.5,
    // tell
    tellWalk: B.tell.start + 0.2, tellText: wordAt(B.tell, 'tell', 0.05), card1: Math.max(wordAt(B.tell, 'who', 0.18) - 0.1, B.tell.start + 1.3), card2: Math.max(wordAt(B.tell, 'chasing', 0.55) - 0.35, B.tell.start + 2.6), fills: wordAt(B.tell, 'fills', 0.86) - 0.1,
    // morning
    sunrise: B.morning.start + 0.05, relabel: B.morning.start + 0.7, square: B.morning.start + 1.1, plane: wordAt(B.morning, 'morning', 0.12) + 0.3, planeLand: wordAt(B.morning, 'morning', 0.12) + 1.2, stackUp: wordAt(B.morning, 'one', 0.5) - 0.4, oneCard: wordAt(B.morning, 'one', 0.5), why: wordAt(B.morning, 'why', 0.9) - 0.1,
    // slip
    slideOut: B.slip.start + 0.1, drift: B.slip.start + 0.6, run: B.slip.start + 0.7, redNote: wordAt(B.slip, 'slip', 0.3) + 0.25, miss: wordAt(B.slip, 'says', 0.5), strip: wordAt(B.slip, 'smallest', 0.7) - 0.2, pickStrip: wordAt(B.slip, 'smallest', 0.7) + 0.4, press: Math.min(B.slip.end - 0.9, wordAt(B.slip, 'saves', 0.9) + 0.25), backLabel: Math.min(B.slip.end - 0.5, wordAt(B.slip, 'saves', 0.9) + 0.7),
    // book
    gather: B.book.start + 0.1, formed: B.book.start + 0.95, tabs: B.book.start + 1.25, coverLine: B.book.start + 1.4, bookLand: B.book.start + 2.1,
    // hire
    hireWalk: B.hire.start + 0.05, pickup: wordAt(B.hire, 'walks', 0.3) + 0.9, fan: wordAt(B.hire, 'runs', 0.55), mugUp: wordAt(B.hire, 'without', 0.75) - 0.6, founderLean: wordAt(B.hire, 'without', 0.75) - 0.3, flip: Math.min(B.hire.end - 0.5, wordAt(B.hire, 'you', 0.95) + 0.2),
    // cta
    wipe: B.cta.start - 0.35, ctaLine: B.cta.start + 0.05, mark: B.cta.start + 0.45, name: B.cta.start + 1.5, tagline: B.cta.start + 2.1, url: wordAt(B.cta, 'app', 0.75) - 0.5, button: wordAt(B.cta, 'app', 0.75) + 0.25, ctaNotes: wordAt(B.cta, 'app', 0.75) + 0.8, zzz: wordAt(B.cta, 'app', 0.75) + 1.3,
  };
  return { B, T, wordAt };
}

export function sfxFor(cues) {
  const { T } = plan(cues); const s = [];
  const add = (kind, at, o = {}) => s.push({ kind, at: +at.toFixed(3), ...o });
  add('slide', T.deskIn, { level: 0.45, seed: 1, dur: 0.6 }); add('thunk', T.deskIn + 0.6, { level: 0.5, seed: 2, f: 80 }); add('tape', T.label, { level: 0.35, seed: 3 });
  for (let i = 0; i < 40; i++) { const at = T.notes + (T.notesEnd - T.notes) * Math.pow(i / 40, 1.6); add(i < 6 ? 'slide' : 'tick', at, { level: i < 6 ? 0.3 : 0.14, seed: 10 + i, dur: 0.25 }); }
  for (let k = 0; k < 6; k++) add('pop', T.loud + 0.2 + k * 0.62, { level: 0.22, seed: 60 + k, f: 900 });
  add('scribble', T.bubble, { level: 0.35, dur: 0.6, seed: 70 }); add('slide', T.hireIn, { level: 0.3, seed: 71, dur: 0.7 }); add('whoosh', T.handover, { level: 0.3, seed: 72, rising: true, dur: 0.6 }); add('pop', T.snap, { level: 0.5, seed: 73, f: 300 }); add('rustle', T.snap, { level: 0.35, seed: 74, dur: 0.5 }); add('pop', T.qmark, { level: 0.3, seed: 75, f: 720 });
  add('tape', T.tile, { level: 0.3, seed: 76 });
  add('whoosh', T.pull, { level: 0.5, seed: 80, rising: true, dur: 0.8 }); add('pop', T.taut, { level: 0.6, seed: 81, f: 240 }); add('thunk', T.giantIn + 0.55, { level: 0.75, seed: 82, f: 65 }); add('scribble', T.title, { level: 0.4, dur: 0.7, seed: 83 }); add('scribble', T.named, { level: 0.3, dur: 0.5, seed: 84 });
  add('whoosh', T.heave, { level: 0.45, seed: 85, rising: true, dur: 0.8 }); add('scribble', T.liftedLabel, { level: 0.3, dur: 0.45, seed: 86 }); add('whoosh', T.reground - 0.3, { level: 0.35, seed: 87, rising: false, dur: 0.45 }); add('thunk', T.reground, { level: 0.8, seed: 88, f: 62 }); add('ding', T.reground + 0.08, { level: 0.25, f: 1318 });
  add('pop', T.markIn, { level: 0.35, seed: 89, f: 520 });
  add('slide', T.card1, { level: 0.4, seed: 90 }); add('thunk', T.card1 + 0.45, { level: 0.35, seed: 91 }); for (let i = 0; i < 6; i++) add('tape', T.card2 + i * 0.16, { level: 0.25, seed: 92 + i }); for (let i = 0; i < 3; i++) add('slide', T.fills + i * 0.45, { level: 0.3, seed: 100 + i, dur: 0.35 }); add('pop', T.tile, { level: 0.25, seed: 104, f: 560 });
  add('whoosh', T.sunrise, { level: 0.2, seed: 110, rising: true, dur: 0.9 }); add('tape', T.relabel, { level: 0.3, seed: 109 }); add('slide', T.square, { level: 0.45, seed: 111, dur: 0.7 }); add('pop', T.square + 0.6, { level: 0.25, seed: 112, f: 1100 }); add('whoosh', T.plane, { level: 0.3, seed: 113, rising: false, dur: 0.8 }); add('flip', T.planeLand, { level: 0.35, seed: 114 });
  for (let i = 0; i < 5; i++) add('slide', T.stackUp + i * 0.08, { level: 0.2, seed: 115 + i, dur: 0.3 }); add('thunk', T.oneCard + 0.6, { level: 0.5, seed: 120, f: 100 }); add('tape', T.oneCard + 0.7, { level: 0.45, seed: 121 }); add('scribble', T.why, { level: 0.3, dur: 0.7, seed: 122 });
  add('slide', T.slideOut, { level: 0.3, seed: 130 }); add('whoosh', T.drift, { level: 0.4, seed: 131, rising: true, dur: 1.0 }); add('scribble', T.redNote, { level: 0.35, dur: 0.5, seed: 132 }); add('slide', T.strip, { level: 0.35, seed: 133 }); add('thunk', T.press, { level: 0.65, seed: 134, f: 80 }); add('ding', T.press + 0.05, { level: 0.22, f: 1568 }); add('rustle', T.press + 0.2, { level: 0.25, seed: 135, dur: 0.4 }); add('scribble', T.backLabel, { level: 0.3, dur: 0.4, seed: 136 });
  add('rustle', T.gather, { level: 0.45, seed: 140, dur: 0.9 }); add('thunk', T.formed, { level: 0.4, seed: 141, f: 110 }); for (let i = 0; i < 7; i++) add('flip', T.tabs + i * 0.09, { level: 0.25, seed: 142 + i }); add('scribble', T.coverLine, { level: 0.3, dur: 0.6, seed: 150 }); add('tape', T.coverLine + 0.5, { level: 0.3, seed: 151 }); add('thunk', T.bookLand, { level: 0.55, seed: 152, f: 95 });
  add('slide', T.hireWalk, { level: 0.3, seed: 160, dur: 0.8 }); add('flip', T.pickup + 0.6, { level: 0.35, seed: 161 }); for (let i = 0; i < 6; i++) add('slide', T.fan + i * 0.1, { level: 0.2, seed: 190 + i, dur: 0.3 }); add('pop', T.mugUp, { level: 0.25, seed: 162, f: 1400 }); add('slide', T.founderLean, { level: 0.25, seed: 163, dur: 0.8 }); add('flip', T.flip, { level: 0.5, seed: 164 }); add('ding', T.flip + 0.15, { level: 0.3, f: 1760 });
  add('flip', T.wipe, { level: 0.6, seed: 170 }); add('scribble', T.ctaLine, { level: 0.45, dur: 0.7, seed: 171, speed: 4 }); add('scribble', T.mark, { level: 0.5, dur: 1.0, seed: 172, speed: 6 }); add('thunk', T.name, { level: 0.35, seed: 173, f: 110 }); add('slide', T.tagline, { level: 0.3, seed: 174 }); add('thunk', T.url, { level: 0.4, seed: 175, f: 95 }); add('slide', T.button, { level: 0.35, seed: 176 }); add('thunk', T.button + 0.45, { level: 0.45, seed: 177, f: 120 }); add('scribble', T.ctaNotes, { level: 0.3, dur: 0.6, seed: 178 }); add('pop', T.zzz, { level: 0.2, seed: 179, f: 400 });
  return s;
}
export function musicSectionsFor(cues) {
  const { B, T } = plan(cues);
  return { intro: B.hook.start, problem: B.head.start, idea: T.reground, does: B.tell.start, drift: T.drift, recover: T.press, handoff: B.book.start, cta: B.cta.start, end: cues.duration };
}

// ───────────────────────────── helpers ──────────────────────────────
const doodle = (ctx, str, x, y, at, t, o = {}) => { const p = seg(t, at, at + (o.dur ?? 0.55)); if (p <= 0) return; P.text(ctx, P.revealWords(str, p), x, y, { font: 'hand', size: o.size ?? 38, weight: 700, color: o.color ?? P.C.ink, rotate: o.rotate ?? -0.03, align: o.align ?? 'left', alpha: o.alpha ?? 1 }); };
const serifLine = (ctx, str, x, y, at, t, o = {}) => { const p = E(t, at, at + 0.5, ease.outCubic); if (p <= 0) return; const dy = (1 - p) * 26; P.text(ctx, str, x, y + dy, { font: 'serif', size: o.size ?? 72, color: o.color ?? P.C.ink, align: o.align ?? 'center', alpha: p * (o.alpha ?? 1), italic: o.italic }); };
const bounceIn = (t, a, d = 0.7) => E(t, a, a + d, ease.outBounce);

export function buildFilm(cues) {
  const { B, T } = plan(cues); const duration = cues.duration;

  // ── the desk with the sticky-note heap (present the whole film) ──
  function desk(ctx, t, b) {
    const dIn = bounceIn(t, T.deskIn, 0.75); const dy = (1 - dIn) * 420;
    ctx.save(); ctx.translate(0, dy);
    P.paperRect(ctx, DESK.x, DESK.top, DESK.w, 30, { fill: P.C.cream2, seed: 11, shadow: 0.2, dy: 6, outline: 4 });
    P.paperRect(ctx, DESK.x + 34, DESK.top + 30, 22, 160, { fill: P.C.kraft, seed: 12, shadow: 0.14 }); P.paperRect(ctx, DESK.x + DESK.w - 56, DESK.top + 30, 22, 160, { fill: P.C.kraft, seed: 13, shadow: 0.14 });
    const mugGone = t > T.mugUp; if (!mugGone) P.coffeeCup(ctx, DESK.x + 80, DESK.top - 40, 62, { seed: 15, boil: b, steam: pulse(t, T.deskIn + 0.8, B.myth.end, 0.8) });
    // the heap: forty notes landing faster and faster; squared into a neat stack in the morning
    const sq = E(t, T.square, T.square + 0.7, ease.inOutCubic); const r = P.rng(41);
    const hx = DESK.x + 330, hy = DESK.top - 4;
    for (let i = 0; i < 40; i++) {
      const at = T.notes + (T.notesEnd - T.notes) * Math.pow(i / 40, 1.6); const p = E(t, at, at + 0.35, ease.outCubic); if (p <= 0) { r(); r(); r(); continue; }
      const ox = P.rnd(r, -120, 120), oy = -i * 3.2 - P.rnd(r, 0, 10), rot = P.rnd(r, -0.35, 0.35);
      const x = lerp(hx + ox, hx - 20 + (i % 2) * 2, sq), y = lerp(hy + oy, hy - 20 - i * 1.6, sq) - (1 - p) * 180;
      P.stickyNote(ctx, x - 40, y - 80 + 24, 80, { rotate: rot * (1 - sq) + sq * 0.02, seed: 300 + i, color: i % 5 === 0 ? P.C.sticky2 : P.C.sticky, text: i < 6 ? COMPANIES[i] : (i < 12 ? 'call\nback?' : ''), fontSize: 16, alpha: p });
    }
    // the loud note: hops on top of the heap, flattened at the squaring, asleep at the end
    if (t > T.loud) { const lp = E(t, T.loud, T.loud + 0.5, ease.outBack); const hop = (t < T.square) ? Math.abs(Math.sin((t - T.loud) * 5.1)) * 26 : 0; const x = lerp(hx + 40, hx - 10, sq), y = hy - 190 * (1 - sq) - 118 * sq - hop - (1 - lp) * 200; const rotate = lerp(0.12, 0.03, sq);
      P.stickyNote(ctx, x - 60, y, 120, { rotate, seed: 399, color: P.C.sticky2, text: '', alpha: lp });
      ctx.save(); ctx.translate(x, y + 60); ctx.rotate(rotate);
      P.text(ctx, '!!!', 0, -12, { font: 'hand', size: 40 * (1 - sq * 0.4), weight: 700, align: 'center', color: P.C.ink });
      if (sq < 0.5) { P.ink(ctx, P.ellipsePts(0, 22, 16, 11, 12), { width: 4, seed: 398, boil: b, jitter: 0.6, curve: true, closed: true }); } else P.ink(ctx, [[-24, 22], [24, 22]], { width: 4, seed: 398, boil: b, jitter: 0.6 });
      ctx.restore(); }
    ctx.restore();
  }
  // ── the founder: one figure, many moments ──
  function founder(ctx, t, b, o) { return P.figure(ctx, o.x, GY, FS, { ...FOUNDER, boil: b, ...o }); }

  // ── the tile that climbs: "You are the system" → "Hire-ready" ──
  function stateTile(ctx, t, b) {
    if (t < T.tile) return; const inP = E(t, T.tile, T.tile + 0.5, ease.outBackSoft); const fl = E(t, T.flip, T.flip + 0.6, ease.inOutCubic);
    const sx = Math.abs(Math.cos(fl * Math.PI)); const after = fl > 0.5; const cx = 1700, cy = 150 - (1 - inP) * 200;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(Math.max(0.02, sx), 1); ctx.globalAlpha = inP;
    P.paperRect(ctx, -170, -32, 340, 64, { fill: after ? P.C.forestPaper : P.C.paper, seed: 1600, shadow: 0.16, dy: 4, outline: 3, rotate: -0.02, cx: 0, cy: 0 });
    P.text(ctx, after ? 'Hire-ready' : 'You are the system', 0, 11, { font: 'hand', size: after ? 36 : 32, weight: 700, align: 'center', color: after ? P.C.forest : P.C.ink70, rotate: -0.02 });
    ctx.restore();
  }

  // ── PAGE 1 · the continuous world ──
  function world(ctx, t) {
    const b = boilAt(t);
    const morning = E(t, T.sunrise, T.sunrise + 1.5); P.field(ctx, W, H, { warm: 0.08 + 0.16 * morning });
    // the ground line: born from the string in the myth beat
    const taut = E(t, T.pull, T.taut, ease.inOutCubic);
    if (taut >= 1) P.ink(ctx, [[-40, GY], [W + 40, GY + 1]], { width: 7, seed: 9, boil: b, jitter: 1.1 });
    else if (taut > 0) { const r = P.rng(88); const n = 12; const pts = []; const hx0 = FX + 40, hy0 = GY - 330; for (let i = 0; i < n; i++) { const k = i / (n - 1); const tangle = [hx0 + 60 + P.rnd(r, -90, 90) + k * 120, hy0 + 80 + k * 260 + P.rnd(r, -60, 60)]; const line = [-40 + (W + 80) * k, GY]; pts.push([lerp(tangle[0], line[0], taut), lerp(tangle[1], line[1], taut)]); } P.ink(ctx, pts, { width: lerp(3, 7, taut), seed: 9, boil: b, jitter: 1.2, curve: taut < 0.9, color: P.C.ink }); }
    // sun
    if (t > T.sunrise) P.sun(ctx, 250, lerp(H + 220, 300, E(t, T.sunrise, T.sunrise + 1.6, ease.outCubic)), 84, { seed: 600, boil: b, spin: t * 0.08, alpha: 1 - E(t, T.gather, T.gather + 0.8) * 0.4 });
    desk(ctx, t, b);
    if (t > T.square - 0.5 && t < T.square + 1.3) { const hin = E(t, T.square - 0.5, T.square, ease.outCubic), sweep = E(t, T.square, T.square + 0.7, ease.inOutCubic), hout = E(t, T.square + 0.8, T.square + 1.3, ease.inCubic); P.hand(ctx, lerp(2100, DESK.x + 520, hin) - sweep * 120 + hout * 900, DESK.top - 150 - (1 - hin) * 300 - hout * 300, 150, Math.PI, { seed: 202, pointing: false }); }
    stateTile(ctx, t, b);
    // ── the small A lives on the line from the myth on ──
    const mIn = E(t, T.markIn, T.markIn + 0.5, ease.outBack); if (mIn > 0) { ctx.save(); ctx.translate(AX, GY); ctx.scale(mIn, mIn); P.mark(ctx, 0, 0, 120, { boil: b, groundLen: 0 }); ctx.restore(); }

    // ── founder position + pose through the film ──
    let fx = lerp(-260, FX, E(t, T.founderIn, T.founderIn + 1.3, ease.outCubic)); let pose = { ...standing }; let face = { mouth: 0.25, brows: 0.1, blink: blink(t, 1) }; let moving = t < T.founderIn + 1.3;
    let headLift = 0; let flip = 1;
    if (t < T.bubble) { const pressing = E(t, T.notes + 0.8, T.notes + 1.4); pose.armL = 1.1 * pressing; face.brows = -0.3 * pressing; face.mouth = 0.25 - 0.5 * pressing; }
    else if (t < B.myth.start) { const ho = E(t, T.handover, T.handover + 0.55, ease.inOutCubic) * (1 - E(t, T.snap, T.snap + 0.25, ease.outCubic)); pose.armR = 1.4 * ho + 0.2; pose.armL = 0.9 * ho; face.brows = -0.4; face.mouth = -0.2; }
    else if (t < B.tell.start) { face.mouth = 0.2 + 0.3 * E(t, T.taut, T.taut + 0.5); face.brows = 0.2; }
    else if (t < B.morning.start) { // tell: she deals the cards
      const w = E(t, T.tellWalk, T.tellWalk + 0.9, ease.inOutCubic); fx = lerp(FX, 800, w); moving = w > 0 && w < 1;
      const deal = Math.max(pulse(t, T.card1 - 0.25, T.card1 + 0.5, 0.25), pulse(t, T.card2 - 0.25, T.card2 + 1.2, 0.25)); pose.armR = 0.2 + 1.5 * deal; face.mouth = 0.45; face.brows = 0.3;
    } else if (t < B.slip.start) { const w = E(t, T.sunrise, T.sunrise + 0.9, ease.inOutCubic); fx = lerp(800, FX, w); moving = w > 0 && w < 1; face.mouth = 0.5; face.brows = 0.35; }
    else if (t < B.book.start) { // slip: runs over, reaches, misses, picks up the strip, presses the card down
      const run = E(t, T.run, T.run + 0.9, ease.inOutCubic); fx = lerp(FX, 1090, run); moving = run > 0 && run < 1;
      const reach = pulse(t, T.miss - 0.3, T.miss + 0.7, 0.3); const pick = pulse(t, T.pickStrip - 0.25, T.pickStrip + 0.5, 0.25); const pressUp = E(t, T.press - 0.5, T.press - 0.1, ease.outCubic); const pressDown = E(t, T.press - 0.1, T.press + 0.35, ease.inOutCubic); const pressRel = E(t, T.press + 0.9, T.press + 1.4);
      pose.armR = 0.2 + 2.5 * reach - 0.5 * pick + (2.2 * pressUp - 1.85 * pressDown) * (1 - pressRel); pose.armL = 1.2 * pick; pose.bob = -reach * 14; pose.lean = 0.28 * pressDown * (1 - pressRel); face.brows = -0.5 + 0.9 * E(t, T.press, T.press + 0.5); face.mouth = -0.3 + 0.9 * E(t, T.press, T.press + 0.5);
    } else if (t < B.hire.start) { const w = E(t, T.gather, T.gather + 1.0, ease.inOutCubic); fx = lerp(1090, 800, w); moving = w > 0 && w < 1; face.mouth = 0.55; face.brows = 0.35; }
    else { // hire: takes the mug, walks to the left margin, leans, watches
      const back = E(t, T.hireWalk, T.hireWalk + 0.9, ease.inOutCubic); const lean = E(t, T.founderLean, T.founderLean + 1.5, ease.inOutCubic);
      fx = lerp(lerp(800, FX, back), 200, lean); moving = (back > 0 && back < 1) || (lean > 0 && lean < 1); flip = lean > 0.15 ? 1 : -1;
      const mug = E(t, T.mugUp, T.mugUp + 0.4, ease.outCubic); pose.armL = 0.9 * mug; face.mouth = 0.6; face.brows = 0.4;
    }
    if (moving) { const wk = walk(t, 2.3); pose = { ...pose, legL: wk.legL, legR: wk.legR, bob: wk.bob + (pose.bob || 0), armL: pose.armL === standing.armL ? wk.armL : pose.armL, armR: pose.armR === standing.armR ? wk.armR : pose.armR }; }
    const fig = founder(ctx, t, b, { x: fx, pose, face, flip });
    if (t > T.mugUp) { const hL = fig.hands[flip === 1 ? 0 : 1]; P.coffeeCup(ctx, hL[0] + (flip === 1 ? -20 : 20), hL[1] - 26, 52, { seed: 15, boil: b }); }

    // ── head: the thought bubble, its string, the hire, the failed handover ──
    if (t > T.bubble && t < T.taut) {
      const bIn = E(t, T.bubble, T.bubble + 0.6, ease.outBackSoft); const deflate = 1 - E(t, T.pull, T.taut, ease.inCubic);
      const ho = E(t, T.handover, T.handover + 0.55, ease.inOutCubic) * (1 - E(t, T.snap, T.snap + 0.45, ease.outElastic));
      const bx = fig.head[0] + 120 + ho * 420, by = fig.head[1] - 300 + Math.sin(t * 2) * 6; const bw = 460 * bIn * deflate, bh = 250 * bIn * deflate;
      // the string: a tangled knot from her temple to the bubble, with a loose end to the floor
      if (bIn > 0.3 && deflate > 0.05) { const tx = fig.head[0] + 40, ty = fig.head[1] - 20; const r = P.rng(88 + b % 3); const pts = [[tx, ty]]; for (let i = 1; i <= 7; i++) pts.push([lerp(tx, bx - 30, i / 8) + P.rnd(r, -40, 40) * deflate, lerp(ty, by + bh * 0.4, i / 8) + P.rnd(r, -36, 36) * deflate]); pts.push([bx - 30, by + bh * 0.45]); P.ink(ctx, pts, { width: 3, seed: 89, boil: b, jitter: 1.5, curve: true, color: P.C.ink70, alpha: deflate }); const knot = [[tx + 60, ty - 40], [tx + 90, ty - 10], [tx + 50, ty], [tx + 85, ty - 45], [tx + 55, ty - 25], [tx + 95, ty - 28]]; P.ink(ctx, knot, { width: 3, seed: 90, boil: b, jitter: 1.4, curve: true, color: P.C.ink70, alpha: deflate }); const loose = [[tx + 70, ty + 10], [tx + 110, ty + 120], [tx + 150, ty + 200], [tx + 200, ty + 250]]; P.ink(ctx, P.partial(loose, deflate), { width: 3, seed: 91, boil: b, jitter: 1.5, curve: true, color: P.C.ink70, alpha: deflate }); }
      if (bw > 4) { P.cloud(ctx, bx, by, bw, bh, { seed: 400, outline: 4 }); for (let k = 0; k < 2; k++) P.paperBlob(ctx, fig.head[0] + 70 + k * 34 + ho * 420 * (0.25 + 0.3 * k), fig.head[1] - 110 - k * 62, 16 + k * 10, 14 + k * 8, { seed: 410 + k, n: 9, wob: 0.06, outline: 3, alpha: deflate });
        const CARDS = [['Chipotle', 'waiting on legal'], ['Sweetgreen', 'our contact left?'], ['Notion', 'call back Tuesday']];
        CARDS.forEach(([n, l], i) => { const cx = bx - 150 + i * 150, cy = by - 40 + Math.sin(t * 2.6 + i) * 8 + (i % 2) * 40; const s = bIn * deflate; if (s < 0.2) return; ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.rotate((i - 1) * 0.08 + Math.sin(t * 1.7 + i) * 0.04); P.dealCard(ctx, -70, -28, 150, 56, { name: n, line: l, seed: 420 + i, fill: i % 2 ? P.C.cream : P.C.paper }); ctx.restore(); }); }
    }
    // the hire (beat 2 → leaves; returns in the hire beat)
    if (t > T.hireIn && t < T.hireWalk) { const hs = E(t, T.hireIn, T.hireStop, ease.outCubic); const back = E(t, B.myth.start - 0.2, B.myth.start + 0.9, ease.inOutCubic); const hx = lerp(lerp(2060, 1330, hs), HIRE_WAIT, back); const mv = hs < 1 || (back > 0 && back < 1); const wk = mv ? walk(t, 2.4) : standing; const ask = E(t, T.hireStop, T.hireStop + 0.6, ease.outBack) * (1 - back); const q = E(t, T.qmark, T.qmark + 0.4, ease.outBack) * (1 - E(t, T.taut, T.taut + 0.5));
      P.figure(ctx, hx, GY, FS * 0.94, { ...HIRE, boil: b, flip: (back > 0 && back < 1) ? 1 : -1, pose: { ...wk, armL: mv ? wk.armL : -0.9 * ask, armR: mv ? wk.armR : 1.3 * ask, tilt: -0.05 * ask }, face: { mouth: 0.3 - q * 0.5 + back * 0.3, brows: 0.4 - q * 0.9 + back * 0.6, blink: blink(t, 2) } });
      if (q > 0) P.text(ctx, '?', hx + 20, GY - 440 + Math.sin(t * 3) * 5, { font: 'hand', size: 90 * q, weight: 700, color: P.C.ink, align: 'center', alpha: q }); }
    if (t > T.hireWalk) { const hw = E(t, T.hireWalk, T.hireWalk + 1.2, ease.inOutCubic); const hx = lerp(HIRE_WAIT, 1720, hw); const pick = E(t, T.pickup, T.pickup + 0.7, ease.inOutCubic); const wk = hw < 1 ? walk(t, 2.4) : standing;
      P.figure(ctx, hx, GY, FS * 0.94, { ...HIRE, boil: b, pose: { ...wk, armL: hw < 1 ? wk.armL : -1.2 * pick, armR: hw < 1 ? wk.armR : 1.6 * pick, tilt: 0.04 * pick }, face: { mouth: 0.7, brows: 0.4, blink: blink(t, 2) } });
      world.hireX = hx; world.pick = pick;
      for (let i = 0; i < 6; i++) { const fp = E(t, T.fan + i * 0.1, T.fan + i * 0.1 + 0.5, ease.outBackSoft); if (fp <= 0) continue; const tx = [440, 620, 800, 1240, 1900, 2080][i]; ctx.save(); ctx.globalAlpha = fp; ctx.translate(lerp(hx, tx, fp), GY - tileH * 0.7); ctx.scale(0.7, 0.7); P.dealCard(ctx, 0, 0, tileW, tileH, { name: COMPANIES[i], small: true, seed: 520 + i }); ctx.restore(); } }

    // ── myth: the hand pulls the string taut; the giant; lifted / grounded ──
    if (t > T.handIn && t < T.taut + 0.6) { const hIn = E(t, T.handIn, T.pinch, ease.outCubic); const pullP = E(t, T.pull, T.taut, ease.inOutCubic); const out = E(t, T.taut, T.taut + 0.6, ease.inCubic); const sx = fig.head[0] + 250; const hx = lerp(2100, sx, hIn) + pullP * 1500 + out * 600, hy = lerp(GY - 380, fig.head[1] + 230, hIn) + pullP * (GY - 10 - (fig.head[1] + 230)) + out * 300; P.hand(ctx, hx, hy, 130, Math.PI, { seed: 200, pointing: false }); }
    const gIn = bounceIn(t, T.giantIn, 0.7);
    if (gIn > 0 && t < T.giantFade + 0.75) { const heave = E(t, T.heave, T.heave + 0.9, ease.inOutCubic) * (1 - E(t, T.reground - 0.35, T.reground, ease.inCubic)); const fade = E(t, T.giantFade, T.giantFade + 0.5, ease.inCubic); const gx = 1150;
      const grounded = (1 - heave) * gIn * (1 - fade); if (t > T.ticks && grounded > 0.6) { const k = 0.5 + 0.5 * Math.sin(t * 6); for (let i = -2; i <= 2; i++) { if (i === 0) continue; const xx = gx + i * 70; P.ink(ctx, [[xx, GY - 8 - k * 4], [xx + (i < 0 ? -14 : 14), GY - 30 - k * 8]], { color: P.C.forest, width: 5, seed: 910 + i, boil: b, jitter: 0.6, alpha: grounded }); } }
      P.giant(ctx, gx, GY + (1 - gIn) * -560, 1.18, { seed: 500, boil: b, lifted: heave, alpha: 1 - fade });
      // the hand lifts him by the shoulders, then sets him down
      if (t > T.heave - 0.5 && t < T.reground + 0.5) { const hin = E(t, T.heave - 0.5, T.heave, ease.outCubic), hout = E(t, T.reground, T.reground + 0.5, ease.inCubic); const lift = heave; P.hand(ctx, gx + 250 + (1 - hin) * 700 + hout * 700, GY - 520 - lift * 150 - (1 - hin) * 200 - hout * 300, 150, Math.PI * 1.08, { seed: 201, pointing: false }); }
      doodle(ctx, 'lifted = weak · same with deals', 1380, 380, T.liftedLabel, t, { size: 44, rotate: 0.04, color: P.C.ink70, dur: 0.35, alpha: 1 - E(t, T.reground, T.reground + 0.4) });
      doodle(ctx, 'grounded = strong', 1400, 820, T.reground + 0.35, t, { size: 42, rotate: -0.02, color: P.C.forest, alpha: 1 - E(t, T.giantFade, T.giantFade + 0.4) }); }
    if (t > T.title && t < B.tell.start + 0.4) { const a = 1 - E(t, B.tell.start, B.tell.start + 0.4); serifLine(ctx, 'Antaeus', 520, 200, T.title, t, { size: 110, alpha: a }); doodle(ctx, 'named for the giant', 520, 262, T.named, t, { size: 40, align: 'center', rotate: -0.02, color: P.C.ink70, alpha: a }); }

    // ── tell: she deals the cards; blue slips fill in the rest ──
    if (t > T.card1 - 0.3 && t < T.gather + 1.2) {
      const tellFade = 1 - E(t, T.stackUp, T.stackUp + 0.4);
      const c1 = E(t, T.card1, T.card1 + 0.6, ease.outBackSoft);
      if (c1 > 0 && tellFade > 0) { const cw = 220, ch = 210, x = 1090, y = GY - ch - (1 - c1) * 380; ctx.save(); ctx.globalAlpha = tellFade; P.paperRect(ctx, x, y, cw, ch, { fill: P.C.cream, seed: 700, shadow: 0.18, dy: 5, outline: 4, rotate: -0.02, cx: x + cw / 2, cy: y + ch / 2 }); P.paperBlob(ctx, x + cw / 2, y + 76, 36, 40, { fill: P.C.skin, seed: 701, n: 10, wob: 0.05 }); P.paperShape(ctx, P.rough([[x + 66, y + 160], [x + 176, y + 160], [x + 160, y + 112], [x + 82, y + 112]], 702, 1.5), { fill: P.C.ink70, shadow: 0.1, curve: true }); P.text(ctx, 'who we sell to', x + cw / 2, y + 194, { font: 'hand', size: 30, weight: 700, align: 'center' }); ctx.restore(); }
      // the six company cards, taped down one by one (a small wall, two rows of three)
      for (let i = 0; i < 6; i++) { const p = E(t, T.card2 + i * 0.16, T.card2 + i * 0.16 + 0.45, ease.outBackSoft); if (p <= 0) continue; const [tx, ty] = TILE(i); const su = E(t, T.stackUp + i * 0.06, T.stackUp + i * 0.06 + 0.6, ease.inOutCubic); const isOne = i === 2;
        let x = tx, y = ty - (1 - p) * 300, alpha = 1, rot = 0, scale = 1;
        if (isOne) { const oc = E(t, T.oneCard, T.oneCard + 0.8, ease.outBackSoft); x = lerp(tx, 980, oc); y = lerp(ty, 420, oc); scale = lerp(1, 3.3, oc); }
        else { alpha = 1 - su * 0.5; }
        const gone = (i === 4 && t > T.slideOut); if (gone) continue; if (isOne) alpha *= 1 - E(t, T.slideOut, T.slideOut + 0.5);
        const gth = E(t, T.gather, T.gather + 0.8, ease.inOutCubic); x = lerp(x, 1250 - 90, gth); y = lerp(y, GY - 110 - i * 3, gth); scale = lerp(scale, 0.7, gth); alpha *= 1 - E(t, T.formed - 0.1, T.formed + 0.1);
        ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
        if (isOne && scale > 1.2) { const k = seg(scale, 1.2, 3.3); P.dealCard(ctx, 0, 0, tileW, tileH * 0.78, { name: 'OpenAI', line: 'write to OpenAI first', value: '', seed: 522, rule: k > 0.6 ? P.C.orange : null, alpha, small: false }); }
        else P.dealCard(ctx, 0, 0, tileW, tileH, { name: COMPANIES[i], small: true, seed: 520 + i, alpha, rotate: rot, tapeOn: p > 0.9 && su < 0.5 && !isOne });
        ctx.restore(); }
      // "it fills in the rest": three blue slips slide out from behind the wall, one at a time
      const FILLS = [['Boeing · new head of operations', 0], ['Notion · hiring twelve sellers', 5], ['Chipotle · opening forty stores', 4]];
      FILLS.forEach(([str, k], i) => { const at = T.fills + i * 0.45; const p = E(t, at, at + 0.6, ease.outBackSoft); if (p <= 0) return; const gth = E(t, T.gather, T.gather + 0.8, ease.inOutCubic); const col = k % 2; const x0 = 1330 + col * 120 - (col ? 0 : 60), y0 = GY - 3 * tileH - 90 - i * 62; const x = lerp(lerp(x0 + 60, x0, p), 1250 - 120, gth), y = lerp(y0, GY - 140, gth); if (p > 0.9 && gth <= 0 && t < T.oneCard) { const [ax, ay] = TILE(k); P.doodleArrow(ctx, [x0 + 150, y0 + 26], [ax + tileW / 2, ay - 6], { boil: b, curve: 0.12, width: 3, color: P.C.blue, head: 12, p: E(t, at + 0.5, at + 0.9) }); } const a = (1 - E(t, T.oneCard - 0.35, T.oneCard + 0.1)); ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(lerp(1, 0.7, gth), lerp(1, 0.7, gth)); P.paperLabel(ctx, str, 0, 0, { font: 'hand', size: 28, weight: 700, fill: P.C.bluePaper, color: P.C.ink, seed: 730 + i, rotate: (i - 1) * 0.02, padY: 3, pad: 12, alpha: p }); ctx.restore(); });
      if (tellFade > 0) serifLine(ctx, 'Tell it once.', W / 2, 200, T.tellText, t, { size: 74, alpha: tellFade });
    }
    // ── morning: the airplane signal, the one card, the why ──
    if (t > T.plane && t < T.gather) { const p = E(t, T.plane, T.planeLand, ease.inOutCubic); const [ox, oy] = TILE(2); const x = lerp(2100, ox + tileW - 30, p), y = lerp(80, oy - 30, p) - Math.sin(p * Math.PI) * 120; const land = E(t, T.planeLand, T.planeLand + 0.3, ease.outBounce); const oc = E(t, T.oneCard, T.oneCard + 0.8, ease.outBackSoft); const px = lerp(x, 980 + tileW * 3.3 - 40, oc), py = lerp(y + land * 10, 420 - 40, oc); const a = 1 - E(t, T.oneCard + 0.9, T.oneCard + 1.3);
      if (a > 0) { ctx.save(); ctx.globalAlpha = a; P.paperPlane(ctx, px, py, 44, Math.PI * 0.9 + p * 0.3, { seed: 720 }); P.text(ctx, 'JUST RAISED MONEY', px + 6, py - 26, { font: 'mono', size: 15, weight: 700, color: P.C.blue, align: 'center', spacing: 1, rotate: -0.1 }); ctx.restore(); } }
    if (t > T.oneCard && t < T.gather + 0.3) { const a = 1 - E(t, T.slideOut, T.slideOut + 0.5); doodle(ctx, 'do this first →', 700, 400, T.oneCard + 0.5, t, { size: 44, color: P.C.ink70, rotate: -0.06, alpha: a }); doodle(ctx, 'why: fresh money · hiring fast', 1290, 700, T.why, t, { size: 38, color: P.C.blue, align: 'center', rotate: 0, dur: 0.9, alpha: a }); serifLine(ctx, 'The one thing to do first.', W / 2, 200, T.oneCard + 0.1, t, { size: 74, alpha: a }); }
    // ── slip: Sweetgreen slides out of the stack, drifts, gets pressed back down by the founder ──
    if (t > T.slideOut && t < T.gather + 1.2) {
      const so = E(t, T.slideOut, T.slideOut + 0.5, ease.inOutCubic); const up = E(t, T.drift, T.drift + 1.6, ease.inOutCubic) * (1 - E(t, T.press - 0.1, T.press + 0.35, ease.inOutCubic)); const gth = E(t, T.gather, T.gather + 0.8, ease.inOutCubic);
      const [sx0] = TILE(4); const x0 = lerp(sx0, 1175, so), y0 = GY - tileH; const x = lerp(x0, 1250 - 90, gth), y = lerp(y0 - up * 240, GY - 110 - 12, gth); const alpha = 1 - E(t, T.formed - 0.1, T.formed + 0.1);
      if (up > 0 && up < 1) P.ink(ctx, [[x + tileW / 2, GY - 6], [x + tileW / 2 + 8, GY - 6 - up * 200]], { color: P.C.ink30, width: 2, seed: 1200, boil: b, jitter: 1 });
      if (up > 0.5 && t < T.press) doodle(ctx, 'lifted', x + tileW + 30, y - 40, T.drift + 0.9, t, { size: 40, color: P.C.ink70, rotate: -0.08, alpha: 1 - E(t, T.press - 0.2, T.press) });
      ctx.save(); ctx.translate(x, y); ctx.scale(lerp(1, 0.7, gth), lerp(1, 0.7, gth)); P.dealCard(ctx, 0, 0, tileW, tileH, { name: 'Sweetgreen', small: true, seed: 524, rotate: up * 0.22, lifted: up, alpha }); ctx.restore();
      const redA = 1 - E(t, T.press, T.press + 0.35); if (t > T.redNote && redA > 0) { ctx.save(); ctx.globalAlpha = redA; ctx.translate(x + tileW + 8, y - 26 + (1 - redA) * 60); ctx.rotate(0.06 + (1 - redA) * 0.8); P.paperLabel(ctx, '11 days quiet · no next step', 0, 0, { font: 'hand', size: 30, weight: 700, fill: P.C.redPaper, color: P.C.red, seed: 1211, pad: 12, padY: 3 }); ctx.restore(); }
      const st = E(t, T.strip, T.strip + 0.6, ease.outBackSoft); const held = E(t, T.pickStrip, T.pickStrip + 0.4, ease.inOutCubic);
      if (st > 0 && t < T.press + 0.2) { const sx = lerp(-700, 1175, st), sy = lerp(GY - 58, y + tileH + 8, held); P.paperLabel(ctx, "smallest step: book Thursday's call", sx, sy, { font: 'hand', size: 32, weight: 700, fill: P.C.bluePaper, seed: 1210, rotate: -0.01, pad: 14, padY: 4 }); }
      if (t > T.press) { const k = E(t, T.press, T.press + 0.4, ease.outBack); const a = 1 - E(t, T.gather, T.gather + 0.5); P.ink(ctx, [[x - 14, GY - 8], [x - 4, GY - 26 * k]], { color: P.C.forest, width: 5, seed: 1220, boil: b, jitter: 0.5, alpha: a }); P.ink(ctx, [[x + tileW + 14, GY - 8], [x + tileW + 4, GY - 26 * k]], { color: P.C.forest, width: 5, seed: 1221, boil: b, jitter: 0.5, alpha: a }); doodle(ctx, 'back on the ground', x + tileW / 2, GY + 64, T.backLabel, t, { size: 40, color: P.C.forest, align: 'center', rotate: 0, alpha: a }); }
      const sA = 1 - E(t, T.gather, T.gather + 0.4); serifLine(ctx, 'It catches a deal slipping.', W / 2, 200, T.drift + 0.2, t, { size: 74, alpha: sA });
    }
    // ── book: the seven parts riffle out; the cover; lands on the line ──
    if (t > T.formed) {
      const bx = 1250; const land = E(t, T.bookLand, T.bookLand + 0.5, ease.outBounce); const pick = world.pick || 0; const hireX = world.hireX || 1480;
      let cx = bx, cy = lerp(GY - 300, GY - 130, land); let scale = 1; if (pick > 0) { cx = lerp(bx, hireX - 190, pick); cy = lerp(cy, GY - 150, pick); scale = lerp(1, 0.7, pick); }
      const fm = E(t, T.formed, T.formed + 0.4, ease.outBackSoft);
      ctx.save(); ctx.translate(cx, cy); ctx.scale(scale * fm, scale * fm);
      // seven tabs riffle out along the right edge
      for (let i = 0; i < 7; i++) { const p = E(t, T.tabs + i * 0.09, T.tabs + i * 0.09 + 0.3, ease.outBackSoft); if (p <= 0) continue; const y = -110 + i * 32; P.paperRect(ctx, 150, y, 60 + 150 * p, 28, { fill: i % 2 ? P.C.cream : P.C.paper, seed: 1300 + i, shadow: 0.12, dy: 2, amp: 1 }); P.text(ctx, BOOK_PARTS[i], 176, y + 20, { font: 'hand', size: 20, weight: 700, alpha: p }); }
      P.book(ctx, 0, 0, 320, 240, { open: 0, seed: 51, title: '', rotate: -0.02 + pick * 0.05 });
      const cl = seg(t, T.coverLine, T.coverLine + 0.8); if (cl > 0) { P.text(ctx, P.revealWords('If a hire', cl), 6, -10, { font: 'hand', size: 36, weight: 700, color: '#ffffff', align: 'center' }); P.text(ctx, P.revealWords('started Monday', Math.max(0, cl - 0.35) / 0.65), 6, 34, { font: 'hand', size: 36, weight: 700, color: '#ffffff', align: 'center' }); }
      if (t > T.coverLine + 0.5) P.tape(ctx, -40, -132, 80, 22, 0.05, 61);
      ctx.restore();
      serifLine(ctx, 'The handoff book.', W / 2, 200, T.formed, t, { size: 74, alpha: 1 - E(t, B.hire.start, B.hire.start + 0.4) });
    }
    if (t > B.hire.start) serifLine(ctx, 'Your first sales hire runs it without you.', 860, 200, B.hire.voStart != null ? B.hire.voStart + 0.15 : B.hire.start + 0.4, t, { size: 58 });
    // hook + head text
    if (t > T.label && t < T.gather && (t < T.taut || t > T.relabel)) { const re = E(t, T.relabel, T.relabel + 0.5, ease.outCubic); const a = (t < T.taut ? 1 - E(t, T.pull, T.taut) : 1) * (1 - E(t, T.gather - 0.5, T.gather)); const lift = t > T.relabel && t < T.relabel + 0.5 ? Math.sin(re * Math.PI) * 30 : 0; P.tape(ctx, 110, 96 - lift, 380, 44, -0.02 + (re > 0 ? 0.01 : 0), 30, { alpha: a }); P.text(ctx, re > 0.5 ? 'Founder · Tuesday morning' : 'Founder · Monday morning', 300, 128 - lift, { font: 'hand', size: 34, weight: 700, align: 'center', alpha: a, rotate: -0.02 }); }
    if (t > T.notes && t < T.bubble + 0.6) { const a = 1 - E(t, T.bubble, T.bubble + 0.6); const n = Math.floor(8 * seg(t, T.notes, T.notesEnd)); ctx.save(); ctx.globalAlpha = a * 0.8; for (let g = 0; g < n; g++) { const x = 130 + g * 58, y = 190; for (let k = 0; k < 4; k++) P.ink(ctx, [[x + k * 10, y], [x + k * 10 + 2, y + 34]], { width: 3, seed: 1000 + g * 5 + k, boil: b, jitter: 0.6 }); P.ink(ctx, [[x - 4, y + 30], [x + 38, y + 4]], { width: 3, seed: 1004 + g * 5, boil: b, jitter: 0.6 }); } if (n >= 8) P.text(ctx, '40', 600, 226, { font: 'hand', size: 44, weight: 700, color: P.C.ink70 }); ctx.restore(); }
    if (t > T.liftText && t < T.taut) serifLine(ctx, "You can't hand over your head.", W / 2, 200, T.liftText, t, { size: 78, alpha: 1 - E(t, B.myth.start - 0.4, B.myth.start + 0.1) });
    P.grain(ctx, W, H); P.vignette(ctx, W, H, 0.08);
  }

  // ── the end card ──
  function endCard(ctx, t) {
    const b = boilAt(t); P.field(ctx, W, H, { warm: 0.12 });
    P.ink(ctx, [[-40, GY], [W + 40, GY + 1]], { width: 7, seed: 9, boil: b, jitter: 1.1 });
    desk(ctx, t, b);
    const mp = E(t, T.mark, T.mark + 1.2, ease.inOutCubic);
    if (mp > 0) P.mark(ctx, 780, GY, 500, { progress: 0.3 + mp * 0.7, boil: b, groundLen: 0, stroke: 3.2 });
    
    serifLine(ctx, 'Antaeus', 1060, GY - 330, T.name, t, { size: 160, align: 'left' });
    serifLine(ctx, cues.tagline || 'Your first hire could run this.', 1064, GY - 228, T.tagline, t, { size: 56, align: 'left', italic: true, color: P.C.ink70 });
    const up = E(t, T.url, T.url + 0.6, ease.outBackSoft);
    if (up > 0) P.paperLabel(ctx, 'antaeus.app', 1060, GY - 140 + (1 - up) * 120, { font: 'serif', size: 80, fill: P.C.paper, seed: 1510, rotate: -0.01, pad: 22, padY: 6, alpha: up });
    const bp = E(t, T.button, T.button + 0.6, ease.outBackSoft); const breathe = 1 + 0.012 * Math.sin((t - T.button) * 1.6);
    if (bp > 0) { const bx = 1060, by = GY + 16 + (1 - bp) * 200; ctx.save(); ctx.translate(bx + 150, by + 34); ctx.scale(breathe, breathe); ctx.translate(-(bx + 150), -(by + 34)); P.paperRect(ctx, bx, by, 300, 68, { fill: P.C.orange, seed: 1530, shadow: 0.22, dy: 6, outline: 4, texture: 0.08, amp: 1.4 }); P.text(ctx, 'Try the demo', bx + 150, by + 46, { font: 'sans', size: 30, weight: 700, color: '#ffffff', align: 'center' }); ctx.restore();
      if (t > T.button - 0.5 && t < T.button + 1.1) { const hin = E(t, T.button - 0.5, T.button + 0.1, ease.outCubic), hout = E(t, T.button + 0.6, T.button + 1.1, ease.inCubic); const pressk = pulse(t, T.button + 0.1, T.button + 0.6, 0.2); P.hand(ctx, bx + 330 + 1.1 * 140 + (1 - hin) * 500 + hout * 500 - pressk * 14, by + 40 + pressk * 6, 140, Math.PI, { seed: 230, pointing: true }); } }
    doodle(ctx, 'free · no card needed', 1060, GY + 130, T.ctaNotes, t, { size: 30, color: P.C.ink70, rotate: -0.02 });
    doodle(ctx, 'a sample company inside', 1400, GY + 130, T.ctaNotes + 0.4, t, { size: 30, color: P.C.ink70, rotate: -0.02 });
    doodle(ctx, 'works beside what you already use', 1060, GY + 168, T.ctaNotes + 0.8, t, { size: 30, color: P.C.ink70, rotate: -0.02 });
    // the loud note is asleep on the desk's neat stack
    if (t > T.zzz) P.text(ctx, 'zzz', DESK.x + 400, DESK.top - 150 - Math.sin(t * 1.4) * 6, { font: 'hand', size: 34 * E(t, T.zzz, T.zzz + 0.4), weight: 700, color: P.C.ink50, rotate: -0.2 });
    P.grain(ctx, W, H); P.vignette(ctx, W, H, 0.08);
  }

  const zoomAt = (ctx, z, cy = 800) => { ctx.translate(W / 2, cy); ctx.scale(z, z); ctx.translate(-W / 2, -cy); };
  const zoomFor = (t) => { // slow, deliberate push-ins per beat; never a cut
    const base = 1.03; const push = (a, bb, k) => k * E(t, a, bb, ease.inOutCubic);
    return base + push(B.hook.start, B.head.end, 0.03) - push(B.myth.start, B.myth.start + 0.9, 0.04) + push(B.tell.start, B.morning.end, 0.02) + push(B.slip.start, B.slip.end, 0.02) - push(B.book.start, B.book.start + 0.8, 0.03);
  };
  function render(ctx, t) {
    ctx.save();
    if (t < T.wipe) { ctx.save(); zoomAt(ctx, zoomFor(t)); world(ctx, t); ctx.restore(); }
    else if (t < T.wipe + 0.7) P.pageWipe(ctx, W, H, seg(t, T.wipe, T.wipe + 0.7), () => { ctx.save(); zoomAt(ctx, zoomFor(t)); world(ctx, t); ctx.restore(); }, () => endCard(ctx, t));
    else endCard(ctx, t);
    ctx.restore();
  }
  return { duration, render, T, B };
}
