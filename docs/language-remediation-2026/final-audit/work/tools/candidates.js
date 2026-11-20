#!/usr/bin/env node
// For original records that have no verbatim evidence today, find the closest current text:
//   - rendered lines in the given corpora, and
//   - individual string literals / JSX text in live source (with file:line).
// Usage: node candidates.js --auto <reconciliation-auto.json> --out <file> [--corpus label=path ...] [--only id1,id2]
// Output: { "<recordId>": { rendered: [{score, corpus, where, text}], source: [{score, file, line, text}] } }
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = "/home/user/antaeus-gtm-os";
const ts = require(path.join(ROOT, "node_modules/typescript"));
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const AUTO = opt("--auto"), OUT = opt("--out");
const corpora = []; args.forEach((a, i) => { if (a === "--corpus") { const [l, p] = args[i + 1].split("="); corpora.push([l, p]); } });
const norm = s => String(s || "").toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/ /g, " ").replace(/\s+/g, " ").trim();
const grams = s => { const g = new Set(); const t = "  " + s + " "; for (let i = 0; i < t.length - 2; i++) g.add(t.slice(i, i + 3)); return g; };

// ---- documents ----
const docs = []; // {kind:'rendered'|'source', text, n, where, g}
const seen = new Set();
for (const [label, p] of corpora) {
    if (!fs.existsSync(p)) continue;
    for (const l of fs.readFileSync(p, "utf8").split("\n")) {
        const m = l.match(/^\[([^|\]]+) \| ([^|]*) \| ([^\]]+)\] ([\s\S]*)$/); if (!m) continue;
        const n = norm(m[4]); if (n.length < 2) continue;
        const key = "r|" + n; if (seen.has(key)) continue; seen.add(key);
        docs.push({ kind: "rendered", corpus: label, where: `${m[1]} | ${m[2]}`, text: m[4], n });
    }
}
const SERVED = ["src", "js", "supabase/functions", "worker", "app", "auth", "why-antaeus", "should-we-hire-an-ae", ...fs.readdirSync(ROOT).filter(f => /\.html$/.test(f))];
function walk(p) { if (!fs.existsSync(p)) return []; const st = fs.statSync(p); if (st.isFile()) return [p]; return fs.readdirSync(p, { withFileTypes: true }).flatMap(e => ["node_modules", "dist", ".git"].includes(e.name) ? [] : walk(path.join(p, e.name))); }
for (const t of SERVED) for (const f of walk(path.join(ROOT, t))) {
    const rel = path.relative(ROOT, f);
    if (/\.(test|spec)\.[jt]sx?$/.test(rel) || /__tests__|fixtures\//.test(rel)) continue;
    if (!/\.[jt]sx?$/.test(rel)) continue;
    const c = fs.readFileSync(f, "utf8");
    const sf = ts.createSourceFile(f, c, ts.ScriptTarget.Latest, true, /x$/.test(rel) ? ts.ScriptKind.TSX : (/\.js$/.test(rel) ? ts.ScriptKind.JS : ts.ScriptKind.TS));
    (function v(nd) {
        if (ts.isJsxText(nd) || ts.isStringLiteral(nd) || ts.isNoSubstitutionTemplateLiteral(nd) || ts.isTemplateExpression(nd)) {
            const raw = ts.isTemplateExpression(nd) ? nd.getText(sf).slice(1, -1).replace(/\$\{[^}]*\}/g, "…") : nd.text;
            const n = norm(raw);
            if (n.length >= 3 && /[a-z]/.test(n) && !/^[a-z0-9_\-./:#@]+$/.test(n)) {
                const key = "s|" + n; if (!seen.has(key)) { seen.add(key); docs.push({ kind: "source", file: rel, line: sf.getLineAndCharacterOfPosition(nd.getStart(sf)).line + 1, text: raw.replace(/\s+/g, " ").trim(), n }); }
            }
            if (ts.isTemplateExpression(nd)) return;
        }
        ts.forEachChild(nd, v);
    })(sf);
}
const index = new Map();
docs.forEach((d, i) => { d.g = grams(d.n); for (const g of d.g) { let a = index.get(g); if (!a) index.set(g, a = []); a.push(i); } });

// ---- records ----
const auto = JSON.parse(fs.readFileSync(AUTO, "utf8"));
const only = opt("--only") ? new Set(opt("--only").split(",")) : null;
const want = auto.records.filter(r => r.original && (only ? only.has(r.id) : !/VERBATIM|RETAINED_STILL_RENDERED|RULE/.test(r.auto)));
const out = {};
for (const r of want) {
    const n = norm(r.original), g = grams(n);
    const tally = new Map();
    for (const x of g) { const a = index.get(x); if (!a || a.length > 4000) continue; for (const i of a) tally.set(i, (tally.get(i) || 0) + 1); }
    const scored = [];
    for (const [i, c] of tally) { const d = docs[i]; const dice = 2 * c / (g.size + d.g.size); if (dice >= 0.34) scored.push([dice, i]); }
    scored.sort((a, b) => b[0] - a[0]);
    const rendered = [], source = [];
    for (const [s, i] of scored) {
        const d = docs[i];
        if (d.kind === "rendered" && rendered.length < 3) rendered.push({ score: +s.toFixed(2), corpus: d.corpus, where: d.where, text: d.text.slice(0, 400) });
        if (d.kind === "source" && source.length < 3) source.push({ score: +s.toFixed(2), file: d.file, line: d.line, text: d.text.slice(0, 400) });
        if (rendered.length >= 3 && source.length >= 3) break;
    }
    out[r.id] = { rendered, source };
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
const withAny = Object.values(out).filter(v => v.rendered.length || v.source.length).length;
console.log(`docs=${docs.length} records=${want.length} withCandidates=${withAny} none=${want.length - withAny}`);
