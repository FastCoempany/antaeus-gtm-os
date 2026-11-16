#!/usr/bin/env node
// Splits rendered corpora into reader slices for the saturation scoring pass.
// Usage: node build-score-slices.js --out <dir> --primary <rendered-corpus.txt> [--extra label=path ...] [--plain label=path ...]
//   --primary : the certified corpus (enterprise demo, default screens). Every line is kept.
//   --extra   : another walk in the same "[area | state | kind] text" format. Only lines whose text
//               does not already appear in the primary corpus are kept (the rest was already read).
//   --plain   : a text file already in "[page | state | kind] text" format to slice as-is (onboarding, public pages).
const fs = require("fs"), path = require("path");
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const multi = (n) => args.map((a, i) => (a === n ? args[i + 1] : null)).filter(Boolean).map((s) => { const k = s.indexOf("="); return [s.slice(0, k), s.slice(k + 1)]; });
const OUT = opt("--out"); fs.mkdirSync(OUT, { recursive: true });
const MAX = 420;
const norm = (s) => s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
const parse = (p) => fs.readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => { const m = l.match(/^\[([^|\]]+) \| ([^|]*) \| ([^\]]+)\] ([\s\S]*)$/); if (m) return { area: m[1].trim(), state: m[2].trim(), kind: m[3].trim(), text: m[4] }; const h = l.match(/^\[([^|\]]+) \| ([^\]]*)\] ([\s\S]*)$/); return h ? { area: h[1].trim(), state: h[2].trim(), kind: "hover or field text", text: h[3] } : { area: "_other", state: "", kind: "", text: l }; });
const manifest = [];
function emit(label, group, rows, corpusLabel) {
    // keep states together where possible
    let part = 1, buf = [];
    const flush = () => { if (!buf.length) return; const name = `${label}${rows.length > MAX ? "-" + part : ""}.txt`.replace(/[^A-Za-z0-9_.\-]+/g, "_"); fs.writeFileSync(path.join(OUT, name), buf.map((r) => `[${r.state} | ${r.kind}] ${r.text}`).join("\n") + "\n"); manifest.push({ slice: name.replace(/\.txt$/, ""), file: path.join(OUT, name), corpus: corpusLabel, area: group, lines: buf.length }); part++; buf = []; };
    const chunks = Math.max(1, Math.ceil(rows.length / MAX)), target = Math.ceil(rows.length / chunks);
    let lastState = null, done = 0;
    for (const r of rows) { if (buf.length >= target && r.state !== lastState && rows.length - done > 40) flush(); buf.push(r); done++; lastState = r.state; if (buf.length >= target * 1.3 && rows.length - done > 40) flush(); }
    flush();
}
const primary = parse(opt("--primary"));
const seen = new Set(primary.map((r) => norm(r.text)));
const byArea = {}; for (const r of primary) (byArea[r.area] = byArea[r.area] || []).push(r);
for (const [a, rows] of Object.entries(byArea)) emit(`ent-${a}`, a, rows, "enterprise-default");
for (const [label, p] of multi("--extra")) {
    if (!fs.existsSync(p)) { console.error("missing", p); continue; }
    const rows = parse(p); const fresh = []; const local = new Set();
    for (const r of rows) { const n = norm(r.text); if (seen.has(n) || local.has(r.area + "|" + n)) continue; local.add(r.area + "|" + n); fresh.push(r); }
    const g = {}; for (const r of fresh) (g[r.area] = g[r.area] || []).push(r);
    // group small areas together so no reader gets a tiny slice
    let bucket = [], names = [];
    const out = () => { if (bucket.length) { emit(`${label}-${names[0]}${names.length > 1 ? "-to-" + names[names.length - 1] : ""}`, names.join(","), bucket.map((r) => ({ ...r, state: `${r.area} · ${r.state}` })), label); bucket = []; names = []; } };
    for (const [a, rs] of Object.entries(g)) { if (bucket.length + rs.length > MAX && bucket.length) out(); bucket.push(...rs); names.push(a); if (bucket.length >= MAX) out(); }
    out();
    console.log(`${label}: ${rows.length} lines, ${fresh.length} not already in the primary corpus`);
}
for (const [label, p] of multi("--plain")) { if (!fs.existsSync(p)) { console.error("missing", p); continue; } const rows = parse(p).map((r) => ({ ...r, state: `${r.area} · ${r.state}` })); emit(label, label, rows, label); }
fs.writeFileSync(path.join(OUT, "_manifest.json"), JSON.stringify(manifest, null, 1));
console.log(manifest.map((m) => `${m.slice.padEnd(40)} ${String(m.lines).padStart(5)}  ${m.corpus}`).join("\n"));
console.log(`slices=${manifest.length} lines=${manifest.reduce((s, m) => s + m.lines, 0)}`);
