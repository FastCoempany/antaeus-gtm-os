/* paper.js — hand-drawn paper-collage drawing primitives for the Antaeus explainer.
   Pure JS, no dependencies. Every function is stateless given (ctx, params, seed)
   so frames can be rendered deterministically at any time t. */

// ───────────────────────────── random ─────────────────────────────
export function mulberry32(seed) {
  let a = (seed >>> 0) || 1;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const rng = (seed) => mulberry32(Math.floor(seed * 1000003) ^ 0x9E3779B9);
export const rnd = (r, a, b) => a + (b - a) * r();

// ───────────────────────────── palette ────────────────────────────
export const C = {
  field: '#f6f8fc', paper: '#ffffff', cream: '#fbf7ee', cream2: '#f4ecd8', kraft: '#e6d3b3', kraft2: '#d9c39a',
  ink: '#0a1c40', ink70: 'rgba(10,28,64,0.7)', ink50: 'rgba(10,28,64,0.5)', ink30: 'rgba(10,28,64,0.3)', ink12: 'rgba(10,28,64,0.12)',
  orange: '#e6701e', orangeSoft: 'rgba(230,112,30,0.14)', blue: '#2563eb', blueSoft: 'rgba(37,99,235,0.10)', bluePaper: '#dbe6fb',
  forest: '#1b5e3f', forestSoft: 'rgba(27,94,63,0.12)', forestPaper: '#cfe3d6', amber: '#f59e0b', red: '#ef4444', redPaper: '#fbd5d5',
  skin: '#f6dcc3', skin2: '#eec9a8', hairDark: '#1f2a44', hairBrown: '#6b4a2b', sticky: '#fdf0b0', sticky2: '#fbe38a',
  tape: 'rgba(238,226,190,0.78)', shadow: 'rgba(10,28,64,0.20)',
};

// ───────────────────────────── geometry ───────────────────────────
export function rot(p, cx, cy, a) {
  const c = Math.cos(a), s = Math.sin(a), dx = p[0] - cx, dy = p[1] - cy;
  return [cx + dx * c - dy * s, cy + dx * s + dy * c];
}
export function rotPts(pts, cx, cy, a) { return a ? pts.map(p => rot(p, cx, cy, a)) : pts; }
export function rectPts(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
export function ellipsePts(cx, cy, rx, ry, n = 28, phase = 0) {
  const out = [];
  for (let i = 0; i < n; i++) { const a = phase + i / n * Math.PI * 2; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return out;
}
/** Rough polygon: subdivide each edge and wobble it like a scissors cut. */
export function rough(pts, seed, amp = 2.2, sub = 3, closed = true) {
  const r = rng(seed); const out = [];
  const n = pts.length, m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const k = Math.max(1, Math.round(sub * len / 60));
    for (let j = 0; j < k; j++) {
      const t = j / k;
      const off = (j === 0 ? 0.6 : 1) * rnd(r, -amp, amp);
      out.push([a[0] + dx * t + nx * off + rnd(r, -amp * 0.3, amp * 0.3), a[1] + dy * t + ny * off + rnd(r, -amp * 0.3, amp * 0.3)]);
    }
  }
  if (!closed) out.push([pts[n - 1][0] + rnd(r, -amp * .5, amp * .5), pts[n - 1][1] + rnd(r, -amp * .5, amp * .5)]);
  return out;
}
export function trace(ctx, pts, curve = false, closed = true) {
  ctx.beginPath();
  if (!curve) { ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); if (closed) ctx.closePath(); return; }
  // Catmull-Rom → bezier, smooth blobby cut-outs (heads, clouds, hands)
  const n = pts.length; const P = (i) => pts[((i % n) + n) % n];
  ctx.moveTo(P(0)[0], P(0)[1]);
  const m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const p0 = closed ? P(i - 1) : pts[Math.max(0, i - 1)], p1 = P(i), p2 = closed ? P(i + 1) : pts[Math.min(n - 1, i + 1)], p3 = closed ? P(i + 2) : pts[Math.min(n - 1, i + 2)];
    ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  if (closed) ctx.closePath();
}

// ───────────────────────────── textures ───────────────────────────
let _pattern = null, _grain = null;
export function paperPattern(ctx) {
  if (_pattern) return _pattern;
  const c = document.createElement('canvas'); c.width = c.height = 420; const g = c.getContext('2d');
  const r = mulberry32(77);
  for (let i = 0; i < 9000; i++) { const v = 90 + Math.floor(r() * 120); g.fillStyle = `rgba(${v},${v - 10},${v - 25},${0.25 + r() * 0.5})`; g.fillRect(r() * 420, r() * 420, 1 + (r() < 0.15 ? 1 : 0), 1); }
  g.lineWidth = 0.8;
  for (let i = 0; i < 420; i++) { const x = r() * 420, y = r() * 420, a = r() * Math.PI, l = 4 + r() * 14; const v = 60 + Math.floor(r() * 120); g.strokeStyle = `rgba(${v},${v},${v + 10},${0.18 + r() * 0.3})`; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  _pattern = ctx.createPattern(c, 'repeat'); return _pattern;
}
export function grainPattern(ctx) {
  if (_grain) return _grain;
  const c = document.createElement('canvas'); c.width = c.height = 300; const g = c.getContext('2d');
  const r = mulberry32(1234);
  for (let i = 0; i < 26000; i++) { const v = Math.floor(r() * 255); g.fillStyle = `rgba(${v},${v},${v},${0.9})`; g.fillRect(r() * 300, r() * 300, 1, 1); }
  _grain = ctx.createPattern(c, 'repeat'); return _grain;
}

// ───────────────────────────── paper shapes ───────────────────────
/** A paper cut-out: soft shadow, flat fill, fibre texture, faint cut edge. */
export function paperShape(ctx, pts, o = {}) {
  const { fill = C.paper, shadow = 0.18, dy = 5, dx = 1.5, blur = 12, curve = false, texture = 0.11, alpha = 1, edge = 0.10, rotate = 0, cx = 0, cy = 0, closed = true, outline = 0 } = o;
  ctx.save();
  if (rotate) { ctx.translate(cx, cy); ctx.rotate(rotate); ctx.translate(-cx, -cy); }
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = fill;
  if (shadow > 0) { ctx.shadowColor = `rgba(10,28,64,${shadow})`; ctx.shadowBlur = blur; ctx.shadowOffsetX = dx; ctx.shadowOffsetY = dy; }
  if (outline > 0) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = outline * 2; ctx.lineJoin = 'round'; trace(ctx, pts, curve, closed); ctx.stroke(); ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.fillStyle = fill; }
  trace(ctx, pts, curve, closed); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
  if (texture > 0) {
    ctx.save(); trace(ctx, pts, curve, closed); ctx.clip(); ctx.globalAlpha *= texture; ctx.fillStyle = paperPattern(ctx);
    let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9; for (const p of pts) { minx = Math.min(minx, p[0]); miny = Math.min(miny, p[1]); maxx = Math.max(maxx, p[0]); maxy = Math.max(maxy, p[1]); }
    ctx.fillRect(minx - 10, miny - 10, maxx - minx + 20, maxy - miny + 20); ctx.restore();
  }
  if (edge > 0) { ctx.globalAlpha *= edge; ctx.strokeStyle = C.ink; ctx.lineWidth = 1; trace(ctx, pts, curve, closed); ctx.stroke(); }
  ctx.restore();
}
export function paperRect(ctx, x, y, w, h, o = {}) {
  const seed = o.seed ?? (x * 7 + y * 13 + w);
  const pts = rough(rectPts(x, y, w, h), seed, o.amp ?? 1.8, 3);
  paperShape(ctx, pts, { cx: x + w / 2, cy: y + h / 2, ...o });
}
export function paperBlob(ctx, cx, cy, rx, ry, o = {}) {
  const seed = o.seed ?? (cx * 3 + cy * 5);
  const r = rng(seed); const n = o.n ?? 14; const pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const k = 1 + rnd(r, -(o.wob ?? 0.06), o.wob ?? 0.06); pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  paperShape(ctx, pts, { curve: true, cx, cy, ...o });
}

/** Masking tape strip. */
export function tape(ctx, x, y, w, h, angle = 0, seed = 1, o = {}) {
  const r = rng(seed); const pts = [];
  const zig = (x0, x1, yy, dir) => { const k = 4; for (let i = 0; i <= k; i++) { const t = i / k; pts.push([x0 + (x1 - x0) * t, yy + (i % 2 ? dir * h * 0.09 : 0) + rnd(r, -1, 1)]); } };
  // top edge (straight, tiny wobble), right zigzag end, bottom edge, left zigzag end
  pts.push([x + rnd(r, 0, 3), y]); pts.push([x + w - rnd(r, 0, 3), y]);
  for (let i = 1; i < 5; i++) pts.push([x + w + (i % 2 ? -3 : 1) + rnd(r, -1, 1), y + h * i / 5]);
  pts.push([x + w - rnd(r, 0, 3), y + h]); pts.push([x + rnd(r, 0, 3), y + h]);
  for (let i = 4; i >= 1; i--) pts.push([x + (i % 2 ? 3 : -1) + rnd(r, -1, 1), y + h * i / 5]);
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(angle); ctx.translate(-(x + w / 2), -(y + h / 2));
  ctx.globalAlpha *= (o.alpha ?? 1);
  ctx.fillStyle = o.color ?? C.tape; ctx.shadowColor = 'rgba(10,28,64,0.12)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 1;
  trace(ctx, pts); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); trace(ctx, pts); ctx.clip(); ctx.globalAlpha *= 0.35; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) { const yy = y + h * (0.15 + i * 0.18) + rnd(r, -1, 1); ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy + rnd(r, -1, 1)); ctx.stroke(); }
  ctx.restore(); ctx.restore();
}

// ───────────────────────────── ink strokes ────────────────────────
/** Hand-drawn marker/pen polyline. `boil` changes the wobble each few frames. */
export function ink(ctx, pts, o = {}) {
  const { color = C.ink, width = 4, seed = 1, jitter = 1.3, alpha = 1, curve = false, closed = false, cap = 'round', taper = false } = o;
  const r = rng(seed + (o.boil ?? 0) * 17.3);
  // resample long segments so the wobble is organic
  const res = [];
  for (let i = 0; i < pts.length - (closed ? 0 : 1); i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length]; const len = Math.hypot(b[0] - a[0], b[1] - a[1]); const k = Math.max(1, Math.round(len / 22));
    for (let j = 0; j < k; j++) { const t = j / k; res.push([a[0] + (b[0] - a[0]) * t + rnd(r, -jitter, jitter), a[1] + (b[1] - a[1]) * t + rnd(r, -jitter, jitter)]); }
  }
  if (!closed) res.push([pts[pts.length - 1][0] + rnd(r, -jitter * .6, jitter * .6), pts[pts.length - 1][1] + rnd(r, -jitter * .6, jitter * .6)]);
  ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineCap = cap; ctx.lineJoin = 'round';
  if (taper && res.length > 2) {
    for (let i = 0; i < res.length - 1; i++) { const t = i / (res.length - 1); const w = width * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, t * 1.15))); ctx.lineWidth = Math.max(0.8, w); ctx.beginPath(); ctx.moveTo(res[i][0], res[i][1]); ctx.lineTo(res[i + 1][0], res[i + 1][1]); ctx.stroke(); }
  } else {
    ctx.lineWidth = width; trace(ctx, res, curve, closed); ctx.stroke();
    ctx.globalAlpha *= 0.55; ctx.lineWidth = width * 0.55; ctx.translate(rnd(r, -.8, .8), rnd(r, -.8, .8)); trace(ctx, res, curve, closed); ctx.stroke();
  }
  ctx.restore();
}
/** Partial reveal of a polyline (0..1) — for "drawing" lines on. */
export function partial(pts, p) {
  if (p >= 1) return pts; if (p <= 0) return [pts[0], pts[0]];
  const segs = []; let total = 0;
  for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); segs.push(l); total += l; }
  let want = total * p; const out = [pts[0]];
  for (let i = 0; i < segs.length; i++) { if (want >= segs[i]) { out.push(pts[i + 1]); want -= segs[i]; } else { const t = want / segs[i]; out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t]); return out; } }
  return out;
}
export function doodleArrow(ctx, from, to, o = {}) {
  const { color = C.ink, width = 4, curve = 0.25, seed = 3, boil = 0, head = 16, p = 1 } = o;
  const mx = (from[0] + to[0]) / 2, my = (from[1] + to[1]) / 2; const dx = to[0] - from[0], dy = to[1] - from[1]; const len = Math.hypot(dx, dy) || 1;
  const cx = mx - dy / len * len * curve, cy = my + dx / len * len * curve;
  const pts = []; const N = 18;
  for (let i = 0; i <= N; i++) { const t = i / N; pts.push([(1 - t) * (1 - t) * from[0] + 2 * (1 - t) * t * cx + t * t * to[0], (1 - t) * (1 - t) * from[1] + 2 * (1 - t) * t * cy + t * t * to[1]]); }
  const vis = partial(pts, p); ink(ctx, vis, { color, width, seed, boil, jitter: 1 });
  if (p > 0.85) {
    const e = vis[vis.length - 1], q = vis[vis.length - 2]; const a = Math.atan2(e[1] - q[1], e[0] - q[0]); const hs = head * Math.min(1, (p - 0.85) / 0.15);
    ink(ctx, [[e[0] - Math.cos(a - 0.5) * hs, e[1] - Math.sin(a - 0.5) * hs], e, [e[0] - Math.cos(a + 0.5) * hs, e[1] - Math.sin(a + 0.5) * hs]], { color, width, seed: seed + 1, boil, jitter: 0.8 });
  }
}
export function scribbleCircle(ctx, cx, cy, rx, ry, o = {}) {
  const { color = C.orange, width = 4, seed = 5, boil = 0, p = 1, turns = 1.35 } = o; const pts = [];
  const N = 40; const r = rng(seed);
  for (let i = 0; i <= N * p; i++) { const a = -Math.PI * 0.7 + i / N * Math.PI * 2 * turns; const k = 1 + rnd(r, -.04, .04) + i / N * 0.05; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  if (pts.length > 1) ink(ctx, pts, { color, width, seed, boil, jitter: 1.2, curve: true, taper: true });
}
export function scribbleUnderline(ctx, x0, x1, y, o = {}) {
  const { color = C.orange, width = 5, seed = 9, boil = 0, p = 1 } = o; const pts = [[x0, y], [x1, y + 2], [x0 + 6, y + 9], [x1 - 4, y + 10]];
  ink(ctx, partial(pts, p), { color, width, seed, boil, jitter: 1.6, taper: true });
}
/** Scribbled hatching fill inside a rect (for "chaos"/"redacted" feel). */
export function hatch(ctx, x, y, w, h, o = {}) {
  const { color = C.ink30, width = 2, seed = 4, gap = 9, angle = -0.6, p = 1 } = o; const pts = [];
  const n = Math.floor((w + h) / gap * p);
  for (let i = 0; i < n; i++) { const s = i * gap; const a = [x + Math.min(s, w), y + Math.max(0, s - w)], b = [x + Math.max(0, s - h), y + Math.min(s, h)]; pts.push(i % 2 ? [a, b] : [b, a]); }
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  for (let i = 0; i < pts.length; i++) ink(ctx, pts[i], { color, width, seed: seed + i, jitter: 0.8 });
  ctx.restore();
}

// ───────────────────────────── text ───────────────────────────────
export const FONTS = { serif: '"DM Serif Display", Georgia, serif', sans: '"Public Sans", system-ui, sans-serif', mono: '"JetBrains Mono", Menlo, monospace', hand: '"Caveat", "Patrick Hand", cursive', hand2: '"Kalam", "Patrick Hand", cursive', hand3: '"Patrick Hand", cursive' };
export function setFont(ctx, font = 'sans', size = 24, weight = 400, italic = false) { ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${FONTS[font] || font}`; }
export function text(ctx, str, x, y, o = {}) {
  const { font = 'sans', size = 24, weight = 400, color = C.ink, align = 'left', baseline = 'alphabetic', rotate = 0, alpha = 1, italic = false, spacing = 0, shadow = 0 } = o;
  ctx.save(); ctx.globalAlpha *= alpha; setFont(ctx, font, size, weight, italic); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = baseline;
  if (spacing) ctx.letterSpacing = `${spacing}px`;
  if (rotate) { ctx.translate(x, y); ctx.rotate(rotate); x = 0; y = 0; }
  if (shadow) { ctx.shadowColor = `rgba(10,28,64,${shadow})`; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3; }
  ctx.fillText(str, x, y); ctx.restore();
}
export function measure(ctx, str, font = 'sans', size = 24, weight = 400, spacing = 0) { ctx.save(); setFont(ctx, font, size, weight); if (spacing) ctx.letterSpacing = `${spacing}px`; const w = ctx.measureText(str).width; ctx.restore(); return w; }
/** Text printed on a strip of paper (a cut-out word). Returns the strip box. */
export function paperLabel(ctx, str, x, y, o = {}) {
  const { font = 'serif', size = 40, weight = 400, color = C.ink, fill = C.paper, pad = 14, padY = 8, rotate = 0, seed = 11, align = 'left', alpha = 1, shadow = 0.16, tapeOn = false, italic = false, spacing = 0 } = o;
  const w = measure(ctx, str, font, size, weight, spacing) + pad * 2; const h = size * 1.12 + padY * 2;
  let bx = x; if (align === 'center') bx = x - w / 2; else if (align === 'right') bx = x - w;
  const cx = bx + w / 2, cy = y + h / 2;
  ctx.save(); ctx.globalAlpha *= alpha;
  paperRect(ctx, bx, y, w, h, { fill, seed, rotate, cx, cy, shadow, amp: 1.6 });
  ctx.translate(cx, cy); ctx.rotate(rotate); ctx.translate(-cx, -cy);
  text(ctx, str, bx + pad, y + padY + size * 0.86, { font, size, weight, color, italic, spacing });
  if (tapeOn) tape(ctx, bx + w / 2 - 34, y - 9, 68, 20, -0.08 + (seed % 7) * 0.02, seed + 3);
  ctx.restore();
  return { x: bx, y, w, h, cx, cy };
}
/** Word-by-word typewriter-ish reveal helper: returns substring by progress. */
export function revealWords(str, p) { const w = str.split(' '); return w.slice(0, Math.ceil(w.length * Math.max(0, Math.min(1, p)))).join(' '); }

// ───────────────────────────── field (background) ─────────────────
export function field(ctx, W, H, o = {}) {
  const { grid = 0.055, warm = 0, blueWash = 0.05, orangeWash = 0.04, step = 34 } = o;
  ctx.save();
  ctx.fillStyle = warm > 0 ? mix(C.field, '#fbf6ea', warm) : C.field; ctx.fillRect(0, 0, W, H);
  let g = ctx.createRadialGradient(W * 0.2, H * 0.1, 0, W * 0.2, H * 0.1, W * 0.7); g.addColorStop(0, `rgba(37,99,235,${blueWash})`); g.addColorStop(1, 'rgba(37,99,235,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  g = ctx.createRadialGradient(W * 0.85, H * 0.95, 0, W * 0.85, H * 0.95, W * 0.6); g.addColorStop(0, `rgba(230,112,30,${orangeWash})`); g.addColorStop(1, 'rgba(230,112,30,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (grid > 0) { ctx.strokeStyle = `rgba(10,28,64,${grid})`; ctx.lineWidth = 1; ctx.beginPath(); for (let x = 0.5; x < W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (let y = 0.5; y < H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke(); }
  ctx.restore();
}
export function grain(ctx, W, H, alpha = 0.045) { ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = grainPattern(ctx); ctx.fillRect(0, 0, W, H); ctx.restore(); }
export function vignette(ctx, W, H, a = 0.10) { ctx.save(); const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95); g.addColorStop(0, 'rgba(10,28,64,0)'); g.addColorStop(1, `rgba(10,28,64,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
export function mix(a, b, t) { const pa = hex(a), pb = hex(b); return `rgb(${Math.round(pa[0] + (pb[0] - pa[0]) * t)},${Math.round(pa[1] + (pb[1] - pa[1]) * t)},${Math.round(pa[2] + (pb[2] - pa[2]) * t)})`; }
export function hex(h) { const s = h.replace('#', ''); return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]; }
export function rgba(h, a) { const p = hex(h); return `rgba(${p[0]},${p[1]},${p[2]},${a})`; }

// ───────────────────────────── the mark ───────────────────────────
/** The Grounded A. size = height of the 48-unit box. progress: 0..1 draws ground → left leg → right leg → bar.
    lifted: 0..1 raises + tilts + hollows the A (the Living Mark's weak state). */
export function mark(ctx, cx, groundY, size, o = {}) {
  const { progress = 1, lifted = 0, color = C.ink, boil = 0, groundColor = color, stroke = 3.2, groundLen = 1, seed = 42, jitter = 0.9, alpha = 1 } = o;
  const u = size / 48; const ox = cx - 24 * u, oy = groundY - 38 * u; const w = stroke * u;
  const P = (x, y) => [ox + x * u, oy + y * u];
  const seg = (a, b) => Math.max(0, Math.min(1, (progress - a) / (b - a)));
  ctx.save(); ctx.globalAlpha *= alpha;
  // ground line: from centre outward
  const gl = seg(0, 0.3) * groundLen; const half = 22 * u * gl;
  if (gl > 0) ink(ctx, [[cx - half, groundY], [cx + half, groundY]], { color: groundColor, width: w, seed, boil, jitter });
  // the A (lifted transform)
  const lift = lifted; ctx.translate(cx, groundY - 14 * u); ctx.rotate(lift * 0.11); ctx.translate(-cx, -(groundY - 14 * u)); ctx.translate(lift * 2 * u, -lift * 9 * u);
  ctx.globalAlpha *= (1 - lift * 0.55);
  const l1 = seg(0.3, 0.6), l2 = seg(0.6, 0.85), l3 = seg(0.85, 1);
  if (l1 > 0) ink(ctx, partial([P(14, 38), P(24, 10)], l1), { color, width: w, seed: seed + 1, boil, jitter, cap: 'butt' });
  if (l2 > 0) ink(ctx, partial([P(24, 10), P(34, 38)], l2), { color, width: w, seed: seed + 2, boil, jitter, cap: 'butt' });
  if (l3 > 0) ink(ctx, partial([P(18.2, 28), P(29.8, 28)], l3), { color, width: w, seed: seed + 3, boil, jitter, cap: 'butt' });
  ctx.restore();
}

// ───────────────────────────── objects ────────────────────────────
export function stickyNote(ctx, x, y, s, o = {}) {
  const { text: str = '', rotate = 0, seed = 21, color = C.sticky, boil = 0, alpha = 1, fontSize = 22, font = 'hand', curl = true } = o;
  const pts = rough(rectPts(x, y, s, s), seed, 1.5, 3);
  paperShape(ctx, pts, { fill: color, rotate, cx: x + s / 2, cy: y + s / 2, shadow: 0.16, dy: 4, alpha });
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x + s / 2, y + s / 2); ctx.rotate(rotate); ctx.translate(-(x + s / 2), -(y + s / 2));
  // top stripe (the sticky glue band), slightly darker
  ctx.fillStyle = 'rgba(10,28,64,0.05)'; ctx.fillRect(x + 2, y + 2, s - 4, s * 0.14);
  if (str) { const lines = String(str).split('\n'); lines.forEach((ln, i) => text(ctx, ln, x + s / 2, y + s * 0.42 + i * fontSize * 1.05, { font, size: fontSize, weight: 600, color: C.ink, align: 'center' })); }
  ctx.restore();
}
/** A deal card: company name, a line of state, optional value. */
export function dealCard(ctx, x, y, w, h, o = {}) {
  const { name = 'Boeing', line = 'Waiting on legal', value = '', rotate = 0, seed = 31, fill = C.paper, rule = null, alpha = 1, lifted = 0, tapeOn = false, boil = 0, small = false } = o;
  const pts = rough(rectPts(x, y, w, h), seed, 1.6, 3);
  paperShape(ctx, pts, { fill, rotate, cx: x + w / 2, cy: y + h / 2, shadow: 0.18 + lifted * 0.1, dy: 5 + lifted * 14, blur: 12 + lifted * 16, alpha: alpha * (1 - lifted * 0.35) });
  ctx.save(); ctx.globalAlpha *= alpha * (1 - lifted * 0.35); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rotate); ctx.translate(-(x + w / 2), -(y + h / 2));
  if (rule) { ink(ctx, [[x + 10, y + 8], [x + 10, y + h - 8]], { color: rule, width: 5, seed: seed + 5, boil, jitter: 0.6 }); }
  const px = x + (rule ? 26 : 16);
  text(ctx, name, px, y + (small ? h * 0.52 : h * 0.42), { font: 'serif', size: small ? h * 0.42 : h * 0.34, color: C.ink });
  if (!small && line) text(ctx, line, px, y + h * 0.74, { font: 'hand', size: h * 0.26, weight: 600, color: C.ink70 });
  if (value) text(ctx, value, x + w - 14, y + h * 0.42, { font: 'mono', size: h * 0.2, weight: 700, color: C.ink50, align: 'right' });
  if (tapeOn) tape(ctx, x + w * 0.5 - 30, y - 10, 60, 20, 0.06, seed + 8);
  ctx.restore();
}
/** A paper airplane pointing along `angle` (0 = right). */
export function paperPlane(ctx, x, y, s, angle = 0, o = {}) {
  const { fill = C.bluePaper, seed = 41, alpha = 1 } = o;
  const body = [[-s, -s * 0.35], [s, 0], [-s, s * 0.35], [-s * 0.6, 0]].map(p => rot([x + p[0], y + p[1]], x, y, angle));
  const wing = [[-s, -s * 0.35], [s, 0], [-s * 0.55, s * 0.05]].map(p => rot([x + p[0], y + p[1]], x, y, angle));
  paperShape(ctx, rough(body, seed, 1), { fill, shadow: 0.16, dy: 4, alpha });
  paperShape(ctx, rough(wing, seed + 1, 0.8), { fill: mix(fill, '#ffffff', 0.5), shadow: 0, alpha, edge: 0.14 });
}
/** The handoff book (closed or open). open: 0..1 */
export function book(ctx, cx, cy, w, h, o = {}) {
  const { open = 0, cover = C.forest, seed = 51, alpha = 1, rotate = 0, boil = 0, pagesLines = 5, title = '' } = o;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(cx, cy); ctx.rotate(rotate); ctx.translate(-cx, -cy);
  if (open < 0.5) {
    const k = 1 - open * 2; // closed book: cover with spine, pages edge
    const x = cx - w / 2, y = cy - h / 2;
    paperRect(ctx, x + 6, y + 4, w, h, { fill: C.cream2, seed: seed + 2, shadow: 0.2, dy: 6, amp: 1.2 }); // page block
    paperRect(ctx, x, y, w, h, { fill: cover, seed, shadow: 0.22, dy: 6, amp: 1.4 });
    ink(ctx, [[x + 16, y + 6], [x + 16, y + h - 6]], { color: 'rgba(255,255,255,0.35)', width: 3, seed: seed + 3, boil, jitter: 0.5 });
    if (title) { const ls = title.split('\n'); ls.forEach((ln, i) => text(ctx, ln, x + w / 2 + 6, y + h * 0.42 + i * h * 0.16, { font: 'serif', size: h * 0.13, color: '#ffffff', align: 'center' })); }
    ctx.globalAlpha *= k;
  } else {
    const k = (open - 0.5) * 2; const pw = w * 0.95, ph = h * 0.92; // open book: two pages
    const lx = cx - pw, rx = cx;
    paperRect(ctx, lx - 8, cy - ph / 2 - 6, pw * 2 + 16, ph + 12, { fill: cover, seed: seed + 9, shadow: 0.22, dy: 8, amp: 1.4 });
    paperRect(ctx, lx, cy - ph / 2, pw, ph, { fill: C.cream, seed: seed + 4, shadow: 0.1, dy: 2, amp: 1.2 });
    paperRect(ctx, rx, cy - ph / 2, pw, ph, { fill: C.paper, seed: seed + 5, shadow: 0.1, dy: 2, amp: 1.2 });
    ink(ctx, [[cx, cy - ph / 2 + 6], [cx, cy + ph / 2 - 6]], { color: C.ink12, width: 3, seed: seed + 6, jitter: 0.6 });
    // text lines on pages appear with k
    const nL = Math.floor(pagesLines * k + 0.999);
    for (let i = 0; i < nL; i++) { const yy = cy - ph / 2 + ph * 0.2 + i * ph * 0.12; const r = rng(seed + i); ink(ctx, [[lx + pw * 0.12, yy], [lx + pw * (0.5 + r() * 0.38), yy]], { color: C.ink30, width: 3, seed: seed + 20 + i, jitter: 0.5 }); ink(ctx, [[rx + pw * 0.12, yy + 4], [rx + pw * (0.45 + r() * 0.4), yy + 4]], { color: C.ink30, width: 3, seed: seed + 40 + i, jitter: 0.5 }); }
  }
  ctx.restore();
}
export function coffeeCup(ctx, x, y, s, o = {}) {
  const { seed = 61, boil = 0, steam = 0 } = o;
  paperShape(ctx, rough([[x - s * .4, y - s * .5], [x + s * .4, y - s * .5], [x + s * .32, y + s * .5], [x - s * .32, y + s * .5]], seed, 1.2), { fill: C.paper, shadow: 0.16, dy: 3 });
  ink(ctx, [[x + s * .42, y - s * .3], [x + s * .7, y - s * .25], [x + s * .7, y + s * .15], [x + s * .35, y + s * .2]], { color: C.ink, width: 3, seed: seed + 1, boil, jitter: 0.7, curve: true });
  ink(ctx, [[x - s * .28, y - s * .1], [x + s * .28, y - s * .1]], { color: C.orange, width: 3, seed: seed + 2, boil, jitter: 0.5 });
  if (steam > 0) for (let i = 0; i < 2; i++) { const px = x - s * .15 + i * s * .3; ink(ctx, [[px, y - s * .6], [px + 4, y - s * .8], [px - 4, y - s * 1.0], [px + 3, y - s * 1.2]], { color: C.ink30, width: 2, seed: seed + 5 + i, boil, jitter: 1, curve: true, alpha: steam }); }
}
export function laptop(ctx, x, y, s, o = {}) {
  const { seed = 71, boil = 0, screen = C.bluePaper } = o;
  paperShape(ctx, rough([[x - s * .5, y - s * .7], [x + s * .5, y - s * .7], [x + s * .52, y - s * .02], [x - s * .52, y - s * .02]], seed, 1.2), { fill: C.ink, shadow: 0.2, dy: 4 });
  paperShape(ctx, rough([[x - s * .44, y - s * .64], [x + s * .44, y - s * .64], [x + s * .46, y - s * .08], [x - s * .46, y - s * .08]], seed + 1, 0.8), { fill: screen, shadow: 0, edge: 0.05 });
  paperShape(ctx, rough([[x - s * .6, y - s * .02], [x + s * .6, y - s * .02], [x + s * .64, y + s * .06], [x - s * .64, y + s * .06]], seed + 2, 1), { fill: C.cream2, shadow: 0.2, dy: 3 });
}
export function phone(ctx, x, y, s, angle, o = {}) {
  const { seed = 81, ring = 0, boil = 0 } = o;
  paperShape(ctx, rotPts(rough(rectPts(x - s * .22, y - s * .45, s * .44, s * .9), seed, 1), x, y, angle), { fill: C.ink, shadow: 0.18, dy: 4 });
  paperShape(ctx, rotPts(rough(rectPts(x - s * .17, y - s * .38, s * .34, s * .72), seed + 1, .7), x, y, angle), { fill: C.paper, shadow: 0, edge: 0.05 });
  if (ring > 0) for (let i = 1; i <= 2; i++) { const rr = s * (0.5 + i * 0.16) * (0.85 + 0.15 * ring); ink(ctx, [[x - rr, y - s * .5], [x - rr * 1.15, y - s * .25], [x - rr, y]], { color: C.orange, width: 3, seed: seed + i, boil, jitter: 1, curve: true, alpha: ring }); ink(ctx, [[x + rr, y - s * .5], [x + rr * 1.15, y - s * .25], [x + rr, y]], { color: C.orange, width: 3, seed: seed + i + 5, boil, jitter: 1, curve: true, alpha: ring }); }
}

// ───────────────────────────── characters ─────────────────────────
/** Paper cut-out person. floor = y of the ground line their feet stand on. s = height scale (1 ≈ 300px tall).
    pose: {armL, armR (radians from hanging straight down, positive = forward/up), legL, legR, tilt (head), lean (body), bob (y offset)}
    face: {mouth: -1..1 (frown..smile), brows: -1..1 (worried..raised), blink: 0..1, eyesX, eyesY}  */
export function figure(ctx, x, floor, s, o = {}) {
  const { jacket = C.ink, hair = C.hairDark, skin = C.skin, seed = 100, boil = 0, pose = {}, face = {}, alpha = 1, flip = 1, hold = null, hairStyle = 0, outline = 3, customHead = null, headLift = 0, headRot = 0, headScale = 1 } = o;
  const { armL = 0.1, armR = -0.1, legL = 0, legR = 0, tilt = 0, lean = 0, bob = 0 } = pose;
  const { mouth = 0.3, brows = 0, blink = 0, eyesX = 0, eyesY = 0 } = face;
  const H = 300 * s; const y0 = floor + bob;
  const legH = H * 0.27, torsoH = H * 0.33, headR = H * 0.135;
  const hipY = y0 - legH, shoulderY = hipY - torsoH + H * 0.03, headY = shoulderY - headR * 1.15;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, 0); ctx.scale(flip, 1); ctx.translate(-x, 0);
  const b = boil;
  // legs (behind torso)
  const leg = (dx, ang, sd) => { const w = H * 0.075; const pts = rough(rectPts(-w / 2, 0, w, legH), sd, 1.2, 2).map(p => rot([x + dx + p[0], hipY + p[1]], x + dx, hipY, ang)); paperShape(ctx, pts, { fill: mix(jacket, '#000000', 0.25), shadow: 0.14, dy: 3, outline }); const foot = rough([[-w * 0.6, legH - 2], [w * 0.9, legH - 2], [w * 0.95, legH + 6], [-w * 0.7, legH + 6]], sd + 1, 0.8).map(p => rot([x + dx + p[0], hipY + p[1]], x + dx, hipY, ang)); paperShape(ctx, foot, { fill: C.ink, shadow: 0.12, dy: 2 }); };
  leg(-H * 0.05, legL, seed + 1); leg(H * 0.05, legR, seed + 2);
  // torso
  const tw = H * 0.24;
  const torso = rough([[-tw * 0.42, 0], [tw * 0.42, 0], [tw * 0.5, torsoH * 0.98], [-tw * 0.5, torsoH * 0.98]], seed + 3, 1.6, 3).map(p => rot([x + p[0], shoulderY + p[1]], x, hipY, lean));
  paperShape(ctx, torso, { fill: jacket, shadow: 0.2, dy: 5, outline });
  // shirt V
  const v = [[-tw * 0.12, 0], [tw * 0.12, 0], [0, torsoH * 0.22]].map(p => rot([x + p[0], shoulderY + p[1]], x, hipY, lean));
  paperShape(ctx, rough(v, seed + 4, 0.6), { fill: C.paper, shadow: 0, edge: 0.06 });
  // arms
  const arm = (dx, ang, sd, side) => { const w = H * 0.062, L = H * 0.30; const ax = x + dx, ay = shoulderY + H * 0.03; const pts = rough(rectPts(-w / 2, 0, w, L), sd, 1.2, 2).map(p => rot([ax + p[0], ay + p[1]], ax, ay, side * ang)); paperShape(ctx, pts, { fill: jacket, shadow: 0.16, dy: 3, outline }); const hx = ax + Math.sin(side * ang) * -L, hy = ay + Math.cos(side * ang) * L; paperBlob(ctx, hx, hy, w * 0.62, w * 0.62, { fill: skin, seed: sd + 7, shadow: 0.14, dy: 2, n: 9, wob: 0.08 }); return [hx, hy]; };
  const hL = arm(-tw * 0.44, armL, seed + 5, 1), hR = arm(tw * 0.44, armR, seed + 6, -1);
  // head
  const hx = x + Math.sin(tilt) * headR * 0.3, hy = headY - headLift;
  if (customHead) { ctx.save(); ctx.translate(hx, hy); ctx.rotate(headRot + tilt); ctx.scale(flip, 1); customHead(ctx, 0, 0, headR); ctx.restore(); ctx.restore(); return { hands: [hL, hR], head: [hx, hy], headR, shoulderY, hipY }; }
  if (headScale <= 0.01) { ctx.restore(); return { hands: [hL, hR], head: [hx, hy], headR, shoulderY, hipY }; }
  ctx.save(); if (headScale !== 1) { ctx.translate(hx, hy + headR); ctx.scale(headScale, headScale); ctx.translate(-hx, -(hy + headR)); }
  paperBlob(ctx, hx, hy, headR * 0.92, headR, { fill: skin, seed: seed + 8, shadow: 0.18, dy: 4, n: 12, wob: 0.05, rotate: tilt, cx: hx, cy: hy, outline });
  // hair
  const hp = hairStyle === 1
    ? ellipsePts(hx, hy - headR * 0.45, headR * 1.02, headR * 0.6, 14, Math.PI).slice(0, 8).concat([[hx + headR * 1.0, hy - headR * 0.1], [hx - headR * 1.0, hy - headR * 0.1]])
    : ellipsePts(hx, hy - headR * 0.35, headR * 0.98, headR * 0.7, 14, Math.PI).slice(0, 8);
  paperShape(ctx, rough(rotPts(hp, hx, hy, tilt), seed + 9, 1.4, 2), { fill: hair, shadow: 0.12, dy: 2, curve: true });
  // face
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(tilt); ctx.scale(flip, 1);
  const ex = headR * 0.32, ey = -headR * 0.05 + eyesY * 3; const eyeH = headR * 0.16 * (1 - blink);
  ctx.fillStyle = C.ink; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * ex + eyesX * 3, ey, headR * 0.09, Math.max(0.8, eyeH), 0, 0, Math.PI * 2); ctx.fill(); }
  for (const sx of [-1, 1]) { const by = ey - headR * 0.3 - brows * headR * 0.08; ink(ctx, [[sx * ex - headR * 0.16, by + (sx < 0 ? -brows : brows) * headR * 0.12], [sx * ex + headR * 0.16, by + (sx < 0 ? brows : -brows) * headR * 0.12]], { color: C.ink, width: Math.max(1.5, headR * 0.07), seed: seed + 20 + sx, boil: b, jitter: 0.5 }); }
  const my = headR * 0.42; const mw = headR * 0.32;
  ink(ctx, [[-mw, my - mouth * headR * 0.1], [0, my + mouth * headR * 0.16], [mw, my - mouth * headR * 0.1]], { color: C.ink, width: Math.max(1.5, headR * 0.07), seed: seed + 23, boil: b, jitter: 0.4, curve: true });
  ctx.restore();
  ctx.restore();
  ctx.restore();
  return { hands: [hL, hR], head: [hx, hy], headR, shoulderY, hipY };
}

/** A paper hand entering the frame. Built pointing right (fingertip at +x); rotate with `angle`.
    pointing=true → index finger out, others curled; pointing=false → open flat hand (for placing / pressing). */
export function hand(ctx, x, y, s, angle = 0, o = {}) {
  const { seed = 200, pointing = true, skin = C.skin, alpha = 1, outline = 5 } = o;
  const T = (pts) => pts.map(p => rot([x + p[0] * s, y + p[1] * s], x, y, angle));
  // design space: wrist at x=0, fingers toward +x, y down. Units ≈ s.
  const palm = [[0.0, -0.36], [0.55, -0.40], [0.72, -0.30], [0.74, 0.34], [0.55, 0.44], [0.0, 0.40]];
  const index = [[0.62, -0.36], [1.06, -0.36], [1.12, -0.24], [1.06, -0.12], [0.62, -0.12]];
  const fMid = pointing ? [[0.66, -0.10], [0.84, -0.10], [0.86, 0.06], [0.66, 0.08]] : [[0.62, -0.10], [1.10, -0.12], [1.14, 0.02], [1.06, 0.10], [0.62, 0.10]];
  const fRing = pointing ? [[0.66, 0.10], [0.82, 0.10], [0.84, 0.24], [0.66, 0.26]] : [[0.62, 0.12], [1.02, 0.12], [1.06, 0.26], [0.98, 0.32], [0.62, 0.30]];
  const fPinky = pointing ? [[0.64, 0.28], [0.76, 0.28], [0.78, 0.40], [0.62, 0.42]] : [[0.60, 0.32], [0.90, 0.32], [0.93, 0.44], [0.86, 0.48], [0.60, 0.46]];
  const thumb = [[0.30, -0.36], [0.44, -0.62], [0.58, -0.66], [0.66, -0.56], [0.62, -0.34]];
  const cuff = [[-0.34, -0.40], [0.06, -0.42], [0.08, 0.44], [-0.34, 0.44]];
  ctx.save(); ctx.globalAlpha *= alpha;
  const sh = { shadow: 0.18, dy: 6, dx: 2, curve: true, outline };
  paperShape(ctx, rough(T(cuff), seed + 5, 1.2), { fill: C.ink, shadow: 0.2, dy: 6, outline });
  paperShape(ctx, rough(T(fPinky), seed + 3, 0.8), { fill: skin, ...sh });
  paperShape(ctx, rough(T(fRing), seed + 2, 0.8), { fill: skin, ...sh });
  paperShape(ctx, rough(T(fMid), seed + 1, 0.8), { fill: skin, ...sh });
  paperShape(ctx, rough(T(palm), seed, 1.2), { fill: skin, ...sh });
  paperShape(ctx, rough(T(index), seed + 7, 0.8), { fill: skin, ...sh });
  paperShape(ctx, rough(T(thumb), seed + 4, 0.9), { fill: skin, ...sh });
  // knuckle creases
  for (const [fx, fy] of pointing ? [[0.84, -0.24], [0.76, 0.0]] : [[0.86, -0.02], [0.82, 0.2]]) { const q = T([[fx, fy - 0.05], [fx + 0.02, fy + 0.05]]); ink(ctx, q, { color: C.ink30, width: Math.max(1, s * 0.02), seed: seed + 9, jitter: 0.4 }); }
  ctx.restore();
  return T([[1.1, -0.24]])[0];
}

// ───────────────────────────── extra props ────────────────────────
/** A filing cabinet (the founder's "head"). Drawn centred at (cx, cy); h = total height. drawers: array of 0..1 open amounts. */
export function cabinet(ctx, cx, cy, h, o = {}) {
  const { seed = 300, boil = 0, drawers = [0, 0, 0], outline = 4, alpha = 1, fill = '#c9d3e6' } = o;
  const w = h * 0.82; const x = cx - w / 2, y = cy - h / 2;
  ctx.save(); ctx.globalAlpha *= alpha;
  paperShape(ctx, rough(rectPts(x, y, w, h), seed, 1.6, 3), { fill, shadow: 0.2, dy: 5, outline });
  const dh = h / 3 - 6;
  drawers.forEach((op, i) => {
    const dy0 = y + 4 + i * (h / 3); const dx = op * w * 0.55;
    if (op > 0.02) { paperShape(ctx, rough(rectPts(x + 6, dy0 + 2, dx + 4, dh - 4), seed + 20 + i, 1), { fill: mix(fill, '#000000', 0.25), shadow: 0.12, dy: 2, texture: 0 }); }
    paperShape(ctx, rough(rectPts(x + 6 + dx, dy0, w - 12, dh), seed + 10 + i, 1.2), { fill: mix(fill, '#ffffff', 0.35), shadow: op > 0.02 ? 0.18 : 0.06, dy: 3, edge: 0.14 });
    ink(ctx, [[cx - w * 0.12 + dx, dy0 + dh / 2], [cx + w * 0.12 + dx, dy0 + dh / 2]], { color: C.ink, width: Math.max(2, h * 0.03), seed: seed + 30 + i, boil, jitter: 0.5 });
  });
  ctx.restore();
}
/** A thought cloud made of paper puffs. */
export function cloud(ctx, cx, cy, w, h, o = {}) {
  const { seed = 400, fill = C.paper, alpha = 1, outline = 4 } = o; const r = rng(seed); const pts = [];
  const n = 16; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const k = 1 + (i % 2 ? 0.12 : -0.06) + rnd(r, -0.03, 0.03); pts.push([cx + Math.cos(a) * w / 2 * k, cy + Math.sin(a) * h / 2 * k]); }
  paperShape(ctx, pts, { fill, curve: true, shadow: 0.16, dy: 5, alpha, outline });
}
/** The giant Antaeus: a big torn-edge navy silhouette standing on `floor`. lifted 0..1 raises + hollows him. */
export function giant(ctx, x, floor, s, o = {}) {
  const { seed = 500, boil = 0, lifted = 0, alpha = 1, color = C.ink, outline = 0 } = o;
  const H = 520 * s; const y0 = floor - lifted * H * 0.28; const a = alpha * (1 - lifted * 0.55);
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y0 - H * 0.5); ctx.rotate(lifted * 0.14); ctx.translate(-x, -(y0 - H * 0.5));
  const sh = { fill: color, shadow: 0.22, dy: 7, outline, texture: 0.08, curve: true };
  const R = (pts, sd, amp = 3) => rough(pts, sd, amp, 2);
  // legs: slightly bowed columns with big flat feet
  paperShape(ctx, R([[x - H * 0.15, y0 - H * 0.44], [x - H * 0.03, y0 - H * 0.42], [x - H * 0.05, y0 - H * 0.06], [x - H * 0.02, y0], [x - H * 0.25, y0], [x - H * 0.2, y0 - H * 0.06]], seed + 1), sh);
  paperShape(ctx, R([[x + H * 0.03, y0 - H * 0.42], [x + H * 0.15, y0 - H * 0.44], [x + H * 0.2, y0 - H * 0.06], [x + H * 0.25, y0], [x + H * 0.02, y0], [x + H * 0.05, y0 - H * 0.06]], seed + 2), sh);
  // torso: broad shoulders, narrower waist
  paperShape(ctx, R([[x - H * 0.3, y0 - H * 0.8], [x - H * 0.1, y0 - H * 0.84], [x + H * 0.1, y0 - H * 0.84], [x + H * 0.3, y0 - H * 0.8], [x + H * 0.26, y0 - H * 0.62], [x + H * 0.19, y0 - H * 0.4], [x - H * 0.19, y0 - H * 0.4], [x - H * 0.26, y0 - H * 0.62]], seed + 3, 4), sh);
  // arms hanging a little out from the body, ending in fists
  paperShape(ctx, R([[x - H * 0.31, y0 - H * 0.79], [x - H * 0.2, y0 - H * 0.76], [x - H * 0.27, y0 - H * 0.5], [x - H * 0.3, y0 - H * 0.36], [x - H * 0.42, y0 - H * 0.38], [x - H * 0.38, y0 - H * 0.55]], seed + 4), sh);
  paperShape(ctx, R([[x + H * 0.2, y0 - H * 0.76], [x + H * 0.31, y0 - H * 0.79], [x + H * 0.38, y0 - H * 0.55], [x + H * 0.42, y0 - H * 0.38], [x + H * 0.3, y0 - H * 0.36], [x + H * 0.27, y0 - H * 0.5]], seed + 5), sh);
  paperBlob(ctx, x - H * 0.36, y0 - H * 0.35, H * 0.06, H * 0.06, { ...sh, seed: seed + 8, n: 9, wob: 0.08 });
  paperBlob(ctx, x + H * 0.36, y0 - H * 0.35, H * 0.06, H * 0.06, { ...sh, seed: seed + 9, n: 9, wob: 0.08 });
  // neck, head, beard, hair
  paperShape(ctx, R([[x - H * 0.06, y0 - H * 0.9], [x + H * 0.06, y0 - H * 0.9], [x + H * 0.07, y0 - H * 0.8], [x - H * 0.07, y0 - H * 0.8]], seed + 10, 2), sh);
  paperBlob(ctx, x, y0 - H * 0.95, H * 0.1, H * 0.11, { ...sh, seed: seed + 6, n: 12, wob: 0.06 });
  paperShape(ctx, R([[x - H * 0.1, y0 - H * 0.92], [x + H * 0.1, y0 - H * 0.92], [x + H * 0.08, y0 - H * 0.82], [x, y0 - H * 0.76], [x - H * 0.08, y0 - H * 0.82]], seed + 7, 2.5), sh);
  paperShape(ctx, R([[x - H * 0.11, y0 - H * 0.98], [x - H * 0.06, y0 - H * 1.08], [x + H * 0.06, y0 - H * 1.08], [x + H * 0.11, y0 - H * 0.98], [x + H * 0.08, y0 - H * 0.96], [x - H * 0.08, y0 - H * 0.96]], seed + 11, 2.5), sh);
  // eyes: two small paper dots, so he is a person, not a shadow
  ctx.fillStyle = C.cream; ctx.beginPath(); ctx.ellipse(x - H * 0.035, y0 - H * 0.955, H * 0.012, H * 0.014, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + H * 0.035, y0 - H * 0.955, H * 0.012, H * 0.014, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  return { headY: y0 - H * 0.95, top: y0 - H * 1.08, feetY: y0, H };
}
/** A paper sun with scissor-cut rays. */
export function sun(ctx, cx, cy, r, o = {}) {
  const { seed = 600, boil = 0, alpha = 1, rays = 12, spin = 0 } = o; const rr = rng(seed);
  ctx.save(); ctx.globalAlpha *= alpha;
  for (let i = 0; i < rays; i++) { const a = spin + i / rays * Math.PI * 2; const len = r * (1.45 + rnd(rr, 0, 0.25)); const w = r * 0.22; const pts = [[cx + Math.cos(a - 0.12) * r * 1.02, cy + Math.sin(a - 0.12) * r * 1.02], [cx + Math.cos(a) * len, cy + Math.sin(a) * len], [cx + Math.cos(a + 0.12) * r * 1.02, cy + Math.sin(a + 0.12) * r * 1.02]]; paperShape(ctx, rough(pts, seed + i, 1), { fill: '#f7e08a', shadow: 0.1, dy: 3, texture: 0.08 }); }
  paperBlob(ctx, cx, cy, r, r, { fill: '#fbe7a1', seed, shadow: 0.16, dy: 4, n: 14, wob: 0.04, outline: 4 });
  ctx.restore();
}
/** A rubber-stamp style label (forest green by default). */
export function stamp(ctx, str, cx, cy, o = {}) {
  const { color = C.forest, size = 34, rotate = -0.08, seed = 700, boil = 0, alpha = 0.9, font = 'sans', weight = 700, pad = 18 } = o;
  const w = measure(ctx, str, font, size, weight, 2) + pad * 2, h = size * 1.5;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(cx, cy); ctx.rotate(rotate);
  ink(ctx, rough(rectPts(-w / 2, -h / 2, w, h), seed, 1.5, 3), { color, width: 4, seed: seed + 1, boil, jitter: 0.8, closed: true });
  text(ctx, str, 0, size * 0.36, { font, size, weight, color, align: 'center', spacing: 2 });
  ctx.restore();
}
/** Page-turn wipe: draws `next` over `prev` with the new sheet sliding up from the bottom. p: 0..1 */
export function pageWipe(ctx, W, H, p, prev, next) {
  prev(); if (p <= 0) return;
  const e = 1 - Math.pow(1 - p, 3); const yTop = H * (1 - e);
  ctx.save(); ctx.beginPath(); ctx.rect(0, yTop, W, H - yTop + 4); ctx.clip(); next(); ctx.restore();
  ctx.save(); const g = ctx.createLinearGradient(0, yTop - 40, 0, yTop); g.addColorStop(0, 'rgba(10,28,64,0)'); g.addColorStop(1, 'rgba(10,28,64,0.22)'); ctx.fillStyle = g; ctx.fillRect(0, yTop - 40, W, 40);
  ctx.strokeStyle = 'rgba(10,28,64,0.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, yTop); ctx.lineTo(W, yTop); ctx.stroke(); ctx.restore();
}
export function suitcase(ctx, x, y, s, o = {}) { const { seed = 800 } = o; paperRect(ctx, x - s * 0.5, y - s * 0.7, s, s * 0.7, { fill: C.kraft, seed, shadow: 0.18, dy: 3, outline: 3 }); ink(ctx, [[x - s * 0.15, y - s * 0.7], [x - s * 0.15, y - s * 0.84], [x + s * 0.15, y - s * 0.84], [x + s * 0.15, y - s * 0.7]], { color: C.ink, width: 3, seed: seed + 1, jitter: 0.5 }); ink(ctx, [[x - s * 0.4, y - s * 0.38], [x + s * 0.4, y - s * 0.38]], { color: C.ink30, width: 2, seed: seed + 2, jitter: 0.4 }); }
