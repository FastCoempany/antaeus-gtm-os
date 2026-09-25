/* engine.js — tiny deterministic timeline for canvas animation. Every frame is a pure function of t. */
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
/** normalized progress of t inside [a,b] */
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const ease = {
  linear: t => t,
  inQuad: t => t * t,
  outQuad: t => 1 - (1 - t) * (1 - t),
  inOutQuad: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inCubic: t => t * t * t,
  inOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outQuart: t => 1 - Math.pow(1 - t, 4),
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outBackSoft: t => { const c1 = 0.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  inBack: t => { const c1 = 1.70158, c3 = c1 + 1; return c3 * t * t * t - c1 * t * t; },
  outElastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1,
  outBounce: t => { const n1 = 7.5625, d1 = 2.75; if (t < 1 / d1) return n1 * t * t; if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75; if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375; return n1 * (t -= 2.625 / d1) * t + 0.984375; },
  settle: t => { const c1 = 0.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};
/** eased progress of t in [a,b] */
export const E = (t, a, b, fn = ease.outCubic) => { const s = seg(t, a, b); return s <= 0 ? 0 : s >= 1 ? 1 : fn(s); };
/** in-then-out: rises over [a,a+r], holds, falls over [b-r,b] */
export const pulse = (t, a, b, r = 0.3) => Math.min(seg(t, a, a + r), 1 - seg(t, b - r, b));
/** discrete boil frame index — hand-drawn lines re-jitter at `fps` */
export const boilAt = (t, fps = 8) => Math.floor(t * fps);
/** slow hand-held drift for objects (very small) */
export const drift = (t, seed = 0, amp = 2) => [Math.sin(t * 0.9 + seed) * amp + Math.sin(t * 2.3 + seed * 1.7) * amp * 0.4, Math.cos(t * 0.7 + seed * 0.6) * amp];
/** a bounce-in y offset: object drops from -dist to 0 over [a,b] */
export const dropIn = (t, a, b, dist = 400) => (1 - E(t, a, b, ease.outBounce)) * -dist;
export const slideIn = (t, a, b, dist = 400, fn = ease.outBackSoft) => (1 - E(t, a, b, fn)) * dist;
/** walk cycle helpers */
export const walk = (t, speed = 2.2) => { const ph = t * speed * Math.PI * 2; return { legL: Math.sin(ph) * 0.45, legR: Math.sin(ph + Math.PI) * 0.45, armL: Math.sin(ph + Math.PI) * 0.35, armR: Math.sin(ph) * 0.35, bob: Math.abs(Math.sin(ph)) * -5 }; };
/** blink: returns 0..1 closed amount, blinking every ~3.4s with a seed phase */
export const blink = (t, seed = 0) => { const period = 3.4 + (seed % 3) * 0.37; const x = ((t + seed * 1.13) % period) / period; return x > 0.94 ? Math.sin((x - 0.94) / 0.06 * Math.PI) : 0; };

export class Timeline {
  constructor() { this.scenes = []; this.duration = 0; }
  add(start, end, draw, opts = {}) { this.scenes.push({ start, end, draw, ...opts }); this.duration = Math.max(this.duration, end); return this; }
  render(ctx, t) {
    for (const s of this.scenes) {
      if (t < s.start || t >= s.end) continue;
      ctx.save(); s.draw(ctx, t, t - s.start, seg(t, s.start, s.end)); ctx.restore();
    }
  }
}
/** Camera: gentle push/pan expressed as a transform applied around the frame centre. */
export function camera(ctx, W, H, { zoom = 1, x = 0, y = 0, rot = 0 } = {}) {
  ctx.translate(W / 2 + x, H / 2 + y); ctx.rotate(rot); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2);
}
