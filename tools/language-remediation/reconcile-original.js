#!/usr/bin/env node
"use strict";
/**
 * Original-manifest reconciliation: automatic evidence.
 *
 * Enumerates every record in the original working set (inventory, three
 * batch manifests, interaction patch manifest, contextual generator review,
 * doctrine hits) under a stable id, and records where the original wording
 * and the specified replacement appear TODAY:
 *   - in the regenerated rendered corpus (artifacts/language-remediation/rendered-corpus.txt,
 *     plus any extra corpora passed with --corpus label=path), and
 *   - in live source text (string literals / JSX text / HTML text of everything the site serves).
 *
 * This is evidence, not a verdict. A reviewed decision file
 * (docs/language-remediation-2026/20_FINAL_RECONCILIATION_DECISIONS.json)
 * supplies the judged status for records the automatic check cannot settle.
 *
 * Usage: node tools/language-remediation/reconcile-original.js [--out file] [--corpus label=path ...]
 */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const ROOT = path.resolve(__dirname, "../..");
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const WS_CANDIDATES = [
    "ANTAEUS_FINAL_AUDIT_CONTROL_PACKET_2026-11-16/antaeus-audit-control/original-working-set",
    "docs/language-remediation-2026/handoff-2026-11-04/original-working-set"
];
const WS = path.join(ROOT, opt("--ws", WS_CANDIDATES.find(p => fs.existsSync(path.join(ROOT, p)))));
const OUT = path.resolve(opt("--out", path.join(ROOT, "artifacts/language-remediation/original-reconciliation-auto.json")));
const corpora = [["default-enterprise", path.join(ROOT, "artifacts/language-remediation/rendered-corpus.txt")]];
args.forEach((a, i) => { if (a === "--corpus") { const [label, p] = args[i + 1].split("="); corpora.push([label, path.resolve(p)]); } });

const norm = s => String(s || "").toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/ /g, " ").replace(/\s+/g, " ").trim();
// The original inventory appended the walkthrough's position cue to some lines.
const stripCue = s => String(s || "")
    .replace(/ — (?:[a-z, ]+ · )?(?:top|middle|bottom|lower|upper) (?:of )?page, (?:left|center|right)(?: ·.*)?$/i, "")
    .replace(/ · hover: [“"].*$/i, "").trim();

// ---------- current rendered corpora ----------
const corpusIndex = corpora.filter(([, p]) => fs.existsSync(p)).map(([label, p]) => {
    const lines = fs.readFileSync(p, "utf8").split("\n").filter(Boolean).map(l => {
        const m = l.match(/^\[([^|\]]+) \| ([^|]*) \| ([^\]]+)\] ([\s\S]*)$/);
        return m ? { room: m[1], state: m[2], kind: m[3], text: m[4], n: norm(m[4]) } : { room: "", state: "", kind: "", text: l, n: norm(l) };
    });
    return { label, lines, blob: lines.map(l => l.n).join("\n") };
});
// Short strings (labels) must equal a whole rendered line; a substring test would
// match "next" inside "next step" or "hot" inside "photo". Longer strings match as substrings.
const SHORT = 40;
function inCorpus(text) {
    const n = norm(text);
    if (n.length < 2) return [];
    const hits = [];
    for (const c of corpusIndex) {
        if (!c.blob.includes(n)) continue;
        let count = 0; const samples = [];
        for (const l of c.lines) if (n.length < SHORT ? l.n === n : l.n.includes(n)) { count++; if (samples.length < 3) samples.push(`${l.room} | ${l.state}`); }
        if (count) hits.push({ corpus: c.label, lines: count, samples });
    }
    return hits;
}

// ---------- current live source text ----------
const SERVED = ["src", "js", "supabase/functions", "worker", "app", "auth", "why-antaeus", "should-we-hire-an-ae",
    ...fs.readdirSync(ROOT).filter(f => /\.html$/.test(f))];
function walk(p) {
    if (!fs.existsSync(p)) return [];
    const st = fs.statSync(p);
    if (st.isFile()) return [p];
    return fs.readdirSync(p, { withFileTypes: true }).flatMap(e => ["node_modules", "dist", ".git"].includes(e.name) ? [] : walk(path.join(p, e.name)));
}
const sourceTexts = []; // {file, n}
for (const t of SERVED) for (const f of walk(path.join(ROOT, t))) {
    const rel = path.relative(ROOT, f).replace(/\\/g, "/");
    if (/\.(test|spec)\.[jt]sx?$/.test(rel) || /__tests__|fixtures\//.test(rel)) continue;
    if (/\.[jt]sx?$/.test(rel)) {
        const c = fs.readFileSync(f, "utf8");
        const sf = ts.createSourceFile(f, c, ts.ScriptTarget.Latest, true, /x$/.test(rel) ? ts.ScriptKind.TSX : (/\.js$/.test(rel) ? ts.ScriptKind.JS : ts.ScriptKind.TS));
        const parts = [];
        (function v(n) {
            if (ts.isJsxText(n) || ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) parts.push(n.text);
            ts.forEachChild(n, v);
        })(sf);
        sourceTexts.push({ file: rel, n: norm(parts.join("\n")) });
    } else if (/\.(html|md)$/.test(rel)) {
        const c = fs.readFileSync(f, "utf8").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
        sourceTexts.push({ file: rel, n: norm(c) });
    }
}
function inSource(text) {
    const n = norm(text);
    if (n.length < 4) return [];
    const files = [];
    for (const s of sourceTexts) if (s.n.includes(n)) { files.push(s.file); if (files.length >= 6) break; }
    return files;
}

// ---------- enumerate original records ----------
const J = f => JSON.parse(fs.readFileSync(path.join(WS, f), "utf8"));
const pad = (n, w) => String(n).padStart(w, "0");
const records = [];
const add = r => records.push(r);
const inv = J("01_USER_FACING_COPY_INVENTORY.json");
inv.records.forEach((r, i) => add({ id: `INV-${pad(i, 4)}`, input: "01_USER_FACING_COPY_INVENTORY.json", index: i, kind: "inventory-string",
    original: stripCue(r.text), originalRaw: r.text, replacement: r.proposed_replacement_if_decided || null, rooms: r.rooms, states: r.states.slice(0, 4),
    classifications: r.classifications, terms: r.matched_deprecated_terms, severity: r.severity_0_to_5, originalAction: r.recommended_action, occurrences: r.occurrence_count }));
for (const [file, tag] of [["05_COPY_IMPLEMENTATION_MANIFEST_BATCH_01.json", "B1"], ["08_COPY_IMPLEMENTATION_MANIFEST_BATCH_02.json", "B2"], ["10_COPY_IMPLEMENTATION_MANIFEST_BATCH_03.json", "B3"]]) {
    const m = J(file);
    m.exact_replacements.forEach((r, i) => add({ id: `${tag}-X-${pad(i, 3)}`, input: file, index: i, kind: "exact-replacement", jsonPath: `exact_replacements[${i}]`, original: r.current, replacement: r.replacement }));
    (m.navigation || []).forEach((r, i) => add({ id: `${tag}-NAV-${pad(i, 2)}`, input: file, index: i, kind: "navigation-description", jsonPath: `navigation[${i}]`, original: null, replacement: r.description, subject: r.room }));
    (m.deprecated_terms || []).forEach((r, i) => add({ id: `${tag}-TERM-${pad(i, 2)}`, input: file, index: i, kind: "deprecated-term", jsonPath: `deprecated_terms[${i}]`, original: r.term, replacement: null, preferred: r.preferred, rule: r.rule }));
    (m.readiness_state_migration || []).forEach((r, i) => add({ id: `${tag}-READY-${i}`, input: file, index: i, kind: "readiness-state", jsonPath: `readiness_state_migration[${i}]`, original: r.current, replacement: r.replacement }));
    (m.epistemic_output_schema || []).forEach((r, i) => add({ id: `${tag}-EPI-${i}`, input: file, index: i, kind: "rule", jsonPath: `epistemic_output_schema[${i}]`, original: null, replacement: null, rule: `Epistemic output schema element: ${r}` }));
    (m.instructions || []).forEach((r, i) => add({ id: `${tag}-INSTR-${i}`, input: file, index: i, kind: "rule", jsonPath: `instructions[${i}]`, original: null, replacement: null, rule: r }));
    Object.entries(m.semantic_migrations || {}).forEach(([k, v], i) => add({ id: `${tag}-SEM-${i}`, input: file, index: i, kind: "rule", jsonPath: `semantic_migrations.${k}`, original: null, replacement: null, rule: `${k}: ${v}` }));
    (m.implementation_rules || m.rules || []).forEach((r, i) => add({ id: `${tag}-RULE-${i}`, input: file, index: i, kind: "rule", jsonPath: `${m.implementation_rules ? "implementation_rules" : "rules"}[${i}]`, original: null, replacement: null, rule: r }));
    (m.preserve_standard_sales_terms || []).forEach((r, i) => add({ id: `${tag}-PRES-${pad(i, 2)}`, input: file, index: i, kind: "preserve-term", jsonPath: `preserve_standard_sales_terms[${i}]`, original: r, replacement: r }));
}
J("14_HIGH_SEVERITY_INTERACTION_PATCH_MANIFEST.json").records.forEach((r, i) => add({ id: `HS-${pad(i, 3)}`, input: "14_HIGH_SEVERITY_INTERACTION_PATCH_MANIFEST.json", index: i, kind: "interaction-string", jsonPath: `records[${i}]`,
    original: stripCue(r.text), originalRaw: r.text, replacement: r.replacement || null, rooms: r.rooms, states: (r.states || []).slice(0, 4), classifications: r.classifications, severity: r.severity_0_to_5, originalStatus: r.status }));
J("16_REMAINING_CONTEXTUAL_GENERATOR_REVIEW.json").records.forEach((r, i) => add({ id: `CG-${pad(i, 2)}`, input: "16_REMAINING_CONTEXTUAL_GENERATOR_REVIEW.json", index: i, kind: "contextual-generator", jsonPath: `records[${i}]`,
    original: stripCue(r.text), originalRaw: r.text, replacement: null, rooms: r.rooms, states: (r.states || []).slice(0, 4), classifications: r.classifications, severity: r.severity_0_to_5 }));
J("06_INTERNAL_DOCTRINE_HITS.json").records.forEach((r, i) => add({ id: `DOC-${pad(i, 3)}`, input: "06_INTERNAL_DOCTRINE_HITS.json", index: i, kind: "doctrine-line", jsonPath: `records[${i}]`,
    original: r.text, replacement: null, rooms: [r.room], classifications: r.classifications, terms: r.matched_terms, severity: r.severity_0_to_5, sourceLine: r.source_line }));

// rooms for exact replacements: inherit from the inventory record carrying the same original text
const invByNorm = new Map();
for (const r of records) if (r.kind === "inventory-string") { const k = norm(r.original); if (!invByNorm.has(k)) invByNorm.set(k, r); }
for (const r of records) if (r.kind === "exact-replacement" || r.kind === "readiness-state") {
    const k = norm(r.original);
    let hit = invByNorm.get(k);
    if (!hit) for (const [ik, ir] of invByNorm) if (k.length >= 8 && (ik.includes(k) || (ik.length >= 12 && k.includes(ik)))) { hit = ir; break; }
    r.rooms = hit ? hit.rooms : [];
    if (hit) r.inventoryId = hit.id;
}

// ---------- automatic evidence ----------
let auto = { implementedVerbatim: 0, oldStillRendered: 0, needsJudgment: 0, retainedStillRendered: 0, retainedGone: 0, rule: 0 };
for (const r of records) {
    const isRule = r.kind === "rule" || r.kind === "deprecated-term" || r.kind === "preserve-term";
    r.evidence = {
        originalRendered: r.original && !isRule ? inCorpus(r.original) : [],
        originalInSource: r.original && !isRule ? inSource(r.original) : [],
        replacementRendered: r.replacement ? inCorpus(r.replacement) : [],
        replacementInSource: r.replacement ? inSource(r.replacement) : []
    };
    const oldR = r.evidence.originalRendered.length > 0, newR = r.evidence.replacementRendered.length > 0, newS = r.evidence.replacementInSource.length > 0;
    if (isRule) { r.auto = "RULE_NEEDS_REVIEW"; auto.rule++; }
    else if (r.kind === "inventory-string" && r.originalAction === "retain_unless_context_requires_change") {
        r.auto = oldR ? "RETAINED_STILL_RENDERED" : "RETAINED_NO_LONGER_RENDERED"; oldR ? auto.retainedStillRendered++ : auto.retainedGone++;
    }
    else if (r.replacement && (newR || newS) && !oldR) { r.auto = newR ? "REPLACEMENT_RENDERED_VERBATIM" : "REPLACEMENT_IN_SOURCE_VERBATIM"; auto.implementedVerbatim++; }
    else if (oldR) { r.auto = "ORIGINAL_STILL_RENDERED"; auto.oldStillRendered++; }
    else { r.auto = "NEEDS_JUDGMENT"; auto.needsJudgment++; }
}
const byInput = {};
for (const r of records) { const b = byInput[r.input] = byInput[r.input] || {}; b[r.auto] = (b[r.auto] || 0) + 1; }
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ workingSet: path.relative(ROOT, WS), corpora: corpusIndex.map(c => ({ label: c.label, lines: c.lines.length })), sourceFiles: sourceTexts.length, totals: { records: records.length, ...auto }, byInput, records }, null, 1) + "\n");
console.log(`records ${records.length}; corpora ${corpusIndex.map(c => `${c.label}:${c.lines.length}`).join(", ")}; source files ${sourceTexts.length}`);
console.log(JSON.stringify(auto));
for (const [k, v] of Object.entries(byInput)) console.log(k, JSON.stringify(v));
console.log(`wrote ${path.relative(ROOT, OUT)}`);
