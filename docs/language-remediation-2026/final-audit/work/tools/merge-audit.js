#!/usr/bin/env node
// Merges every area's audit file with its two verification files.
// Usage: node merge-audit.js [--out <dir>]
// Writes: merged/adjudicated.json (every finding with both verdicts and a decision),
//         merged/dispositions.json (every original-record disposition, with challenges attached),
//         merged/summary.txt
const fs = require("fs"), path = require("path");
const S = __dirname;
const AUD = path.join(S, "audit");
const oi = process.argv.indexOf("--out");
const OUT = oi > 0 ? process.argv[oi + 1] : path.join(S, "merged");
fs.mkdirSync(OUT, { recursive: true });
const read = (f) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return null; } };

const files = fs.readdirSync(AUD).filter((f) => f.endsWith(".json"));
const areas = files.filter((f) => !/\.verify[-.]/.test(f)).map((f) => f.replace(/\.json$/, "")).sort();
const items = [], disps = [], cov = [], retained = [], gaps = [], missing = [];
for (const key of areas) {
    const a = read(path.join(AUD, key + ".json"));
    let r = read(path.join(AUD, key + ".verify-refute.json"));
    let w = read(path.join(AUD, key + ".verify-rewrite.json"));
    const both = read(path.join(AUD, key + ".verify.json"));
    if (both && !r && !w) {
        // one verifier, two verdicts per finding: split into the two-lens form used below
        r = { verdicts: (both.verdicts || []).map((v) => ({ findingId: v.findingId, verdict: v.real, reason: v.reason })), dispositionChallenges: both.dispositionChallenges || [], missed: both.missed || [] };
        w = { verdicts: (both.verdicts || []).filter((v) => v.fix && v.fix !== "N/A").map((v) => ({ findingId: v.findingId, verdict: v.fix, reason: v.reason, finalProposed: v.finalProposed })), dispositionChallenges: [], missed: [] };
    }
    if (!a) { missing.push(key + ": audit unreadable"); continue; }
    if (!r) missing.push(key + ": no refute verification");
    if (!w && (a.findings || []).length) missing.push(key + ": no rewrite verification");
    const rv = new Map(((r && r.verdicts) || []).map((v) => [v.findingId, v]));
    const wv = new Map(((w && w.verdicts) || []).map((v) => [v.findingId, v]));
    for (const f of a.findings || []) {
        const R = rv.get(f.id), W = wv.get(f.id);
        let decision, finalProposed = f.proposed, why = [];
        if (R && R.verdict === "REJECTED") { decision = "REJECTED_NOT_REAL"; why.push("refute: " + R.reason); }
        else if (W && W.verdict === "REJECTED") { decision = "REAL_BUT_NO_ACCEPTED_FIX"; why.push("rewrite: " + W.reason); }
        else if (!R) { decision = "UNVERIFIED"; }
        else {
            decision = "ACCEPTED";
            const rP = R.finalProposed && R.finalProposed.trim(), wP = W && W.finalProposed && W.finalProposed.trim();
            if (wP) { finalProposed = wP; if (rP && rP !== wP) { decision = "ACCEPTED_TWO_PROPOSALS"; why.push("refute proposal: " + rP); } }
            else if (rP) finalProposed = rP;
            if (R.verdict === "AMENDED") why.push("refute amended: " + R.reason);
            if (W && W.verdict === "AMENDED") why.push("rewrite amended: " + W.reason);
        }
        items.push({ area: key, id: f.id, source: "audit", decision, category: f.category, severity: f.severity, file: f.file, line: f.line, generation: f.generation, state: f.state, current: f.current, problem: f.problem, governing: f.governing, proposed: f.proposed, finalProposed, testsAffected: f.testsAffected || [], confidence: f.confidence, refute: R ? R.verdict : null, rewrite: W ? W.verdict : null, why });
    }
    for (const [lens, v] of [["refute", r], ["rewrite", w]]) {
        for (const m of (v && v.missed) || []) {
            items.push({ area: key, id: m.id || `${key.toUpperCase()}-${lens[0].toUpperCase()}?`, source: "missed-by-" + lens, decision: "SINGLE_REVIEWER", category: m.category, severity: m.severity, file: m.file, line: m.line, generation: m.generation, state: m.state, current: m.current, problem: m.problem, governing: m.governing, proposed: m.proposed, finalProposed: m.proposed, testsAffected: m.testsAffected || [], confidence: m.confidence, refute: null, rewrite: null, why: [] });
        }
    }
    const ch = new Map();
    for (const c of ((r && r.dispositionChallenges) || []).concat((w && w.dispositionChallenges) || [])) { if (!ch.has(c.recordId)) ch.set(c.recordId, []); ch.get(c.recordId).push(c); }
    for (const d of a.dispositions || []) disps.push({ area: key, ...d, challenges: ch.get(d.recordId) || [] });
    for (const c of a.coverage || []) cov.push({ area: key, ...c });
    for (const x of a.retained || []) retained.push({ area: key, ...x });
    for (const g of a.gaps || []) gaps.push({ area: key, gap: g });
}
fs.writeFileSync(path.join(OUT, "adjudicated.json"), JSON.stringify(items, null, 1));
fs.writeFileSync(path.join(OUT, "dispositions.json"), JSON.stringify(disps, null, 1));
fs.writeFileSync(path.join(OUT, "coverage.json"), JSON.stringify(cov, null, 1));
fs.writeFileSync(path.join(OUT, "retained.json"), JSON.stringify(retained, null, 1));
fs.writeFileSync(path.join(OUT, "gaps.json"), JSON.stringify(gaps, null, 1));
const count = (arr, f) => arr.reduce((m, x) => { const k = f(x); m[k] = (m[k] || 0) + 1; return m; }, {});
const lines = [];
lines.push(`areas with audit files: ${areas.length}`);
lines.push(`problems: ${missing.length ? missing.join("; ") : "none"}`);
lines.push(`items: ${items.length}  ${JSON.stringify(count(items, (x) => x.decision))}`);
lines.push(`by category (accepted or single-reviewer): ${JSON.stringify(count(items.filter((x) => /ACCEPTED|SINGLE/.test(x.decision)), (x) => x.category))}`);
lines.push(`by severity (accepted or single-reviewer): ${JSON.stringify(count(items.filter((x) => /ACCEPTED|SINGLE/.test(x.decision)), (x) => x.severity))}`);
lines.push(`dispositions: ${disps.length}  ${JSON.stringify(count(disps, (x) => x.status))}  challenged: ${disps.filter((d) => d.challenges.length).length}`);
lines.push(`coverage rows: ${cov.length}  ${JSON.stringify(count(cov, (x) => x.how))}`);
lines.push(`retained rows: ${retained.length}; gaps: ${gaps.length}`);
lines.push("");
for (const key of areas) {
    const it = items.filter((x) => x.area === key);
    lines.push(`${key.padEnd(26)} ${JSON.stringify(count(it, (x) => x.decision))}  sev3=${it.filter((x) => x.severity === 3 && /ACCEPTED|SINGLE/.test(x.decision)).length}  disp=${disps.filter((d) => d.area === key).length}`);
}
fs.writeFileSync(path.join(OUT, "summary.txt"), lines.join("\n") + "\n");
console.log(lines.join("\n"));
