#!/usr/bin/env node
"use strict";
// Regression detection, not saturation scoring. Preserve all hits in the report.
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const { execFileSync } = require("node:child_process");
const ROOT = path.resolve(__dirname, "../..");
const TIER1 = ["touch the ground", "the ground — your whole motion", "whole motion", "live edge", "you are the system", "inheritable with guardrails", "workspace is awake", "system's pick", "where it bites", "sharp matches", "the cuts", "the climb", "the summit", "all four fronts", "face-off", "air cover", "the machine", "no might", "no could", "declarative over hedged", "fragments are acceptable", "fragments acceptable"];
const TIER2 = ["motion", "heat", "hottest", "going cold", "sharp", "sharpen", "bite", "carve", "awake", "thread", "pressure", "pulling", "decay", "decaying", "dying", "floor", "thin", "front", "relay", "dividend", "morning landing", "system's read", "what the system saw", "heartbeat", "standing orders"];
const CATEGORY = { A: "rendered/customer-visible", B: "runtime/customer-visible candidate", C: "prompt/template", D: "active doctrine", E: "tests/comments/deprecated examples", F: "internal identifier", G: "reviewed ordinary usage" };
const TARGETS = ["src", "supabase/functions", "deliverables/room-capability-maps", "preview-transcript", "deliverables/design-principle-strict-bible/08-room-guardian-specs/antaeus-discovery-studio-capability-map-2026-07-07.html", "js/discovery-frameworks.js", "js/demo-seed-data-ent.js", "js/demo-seed-data-smb.js", "start.html", "why-antaeus/index.html", "login.html", "signup.html", "forgot-password.html", "reset-password.html", "coming-soon.html", "demo-seed.html"];
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const slash = s => s.replace(/\\/g, "/");
function walk(file) {
    if (!fs.existsSync(file)) return [];
    if (fs.statSync(file).isFile()) return /\.(tsx?|jsx?|html|md)$/.test(file) ? [file] : [];
    return fs.readdirSync(file, { withFileTypes: true }).flatMap(e => ["node_modules", ".git", "dist"].includes(e.name) ? [] : walk(path.join(file, e.name)));
}
function rangesForSource(content, file) {
    const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const ranges = [];
    function visit(n) {
        if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n) || ts.isJsxText(n)) {
            const p = n.parent;
            const attr = ts.isJsxAttribute(p) ? p.name.getText(sf) : "";
            const technical = ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isLiteralTypeNode(p) || (ts.isPropertyAssignment(p) && p.name === n) || ["class", "className", "id", "href", "src", "style", "data-testid"].includes(attr) || /^[@./#][\w/.:?=&#-]+$/.test(n.text || "");
            let ancestor = p;
            while (ancestor && !ts.isVariableDeclaration(ancestor)) ancestor = ancestor.parent;
            const negativeExample = ts.isArrayLiteralExpression(p) && ancestor && /^(BANNED|FORBIDDEN|DEPRECATED)_/.test(ancestor.name.getText(sf));
            ranges.push({ start: n.getStart(sf), end: n.end, category: negativeExample ? "E" : technical ? "F" : ts.isJsxText(n) || attr ? "A" : null });
        }
        ts.forEachChild(n, visit);
    }
    visit(sf);
    return ranges;
}
function classify(file, content, at, ranges) {
    if (/\.(test|spec)\.[jt]sx?$/.test(file) || /(?:^|\/)(?:__tests__|fixtures)\//.test(file)) return "E";
    const doctrine = file.startsWith("deliverables/") || /\/voice\/(?:voice-document|family-temperatures)/.test(file);
    if (file.endsWith(".html")) {
        const before = content.slice(0, at);
        const marked = before.lastIndexOf('data-copy-context="deprecated-example"');
        if (marked >= 0) {
            const open = before.lastIndexOf("<", marked);
            const tag = content.slice(open).match(/^<(\w+)/)?.[1];
            const end = tag && content.indexOf(`</${tag}>`, marked);
            if (end >= at) return "E";
        }
        return doctrine || content.lastIndexOf('<div class="map">', at) >= 0 ? "D" : "A";
    }
    const r = ranges.find(x => x.start <= at && x.end > at);
    if (r?.category === "E" || r?.category === "F") return r.category;
    if (doctrine || file.endsWith(".md")) return "D";
    if (r) return r.category || (/prompt|voice-document|synthesis-shared|llm\//.test(file) ? "C" : "B");
    const end = content.indexOf("\n", at);
    const line = content.slice(content.lastIndexOf("\n", at) + 1, end < 0 ? content.length : end);
    if (/declarative over hedged|fragments (?:are )?acceptable|no might|no could/i.test(line)) return "D";
    return /^\s*(?:\/\/|\*|\/\*)/.test(line) ? "E" : "F";
}
function scanFile(file, content, allowlist = []) {
    const ranges = /\.[jt]sx?$/.test(file) ? rangesForSource(content, file) : [];
    const rows = [];
    for (const [tier, phrases] of [[1, TIER1], [2, TIER2]]) for (const phrase of phrases) {
        const rx = new RegExp(`(?<![\\w])${esc(phrase)}(?![\\w])`, "gi");
        for (const m of content.matchAll(rx)) {
            const at = m.index;
            let category = classify(file, content, at, ranges);
            const end = content.indexOf("\n", at);
            const sourceLine = content.slice(content.lastIndexOf("\n", at) + 1, end < 0 ? content.length : end).trim();
            const allowance = allowlist.find(a => a.path === file && a.phrase === phrase && sourceLine.includes(a.excerpt) && a.reviewBy >= new Date().toISOString().slice(0, 10));
            if (allowance) category = allowance.category;
            rows.push({ file, line: content.slice(0, at).split("\n").length, phrase, tier, category, context: content.slice(Math.max(0, at - 100), Math.min(content.length, at + phrase.length + 180)).replace(/\s+/g, " ").trim(), ...(allowance ? { review: allowance.justification, owner: allowance.owner, reviewBy: allowance.reviewBy } : {}) });
        }
    }
    return rows;
}
function main() {
    const allowlist = JSON.parse(fs.readFileSync(path.join(__dirname, "copy-allowlist.json"), "utf8"));
    for (const a of allowlist) {
        if (!a.path || !a.phrase || !a.excerpt || !a.owner || !a.justification || !/^\d{4}-\d{2}-\d{2}$/.test(a.reviewBy) || !["E", "F", "G"].includes(a.category)) throw new Error("Invalid copy allowlist entry: exact context and review metadata required");
        if (a.reviewBy < new Date().toISOString().slice(0, 10)) throw new Error(`Expired copy review: ${a.path} (${a.phrase})`);
    }
    const extra = fs.readdirSync(path.join(ROOT, "js")).filter(n => /^discovery-segment-runtime.*\.js$/.test(n)).map(n => `js/${n}`);
    const files = [...new Set([...TARGETS, ...extra].flatMap(t => walk(path.join(ROOT, t))))].sort();
    const rows = files.flatMap(f => scanFile(slash(path.relative(ROOT, f)), fs.readFileSync(f, "utf8"), allowlist));
    const governed = rows.filter(r => "ABCD".includes(r.category));
    const failures = governed.filter(r => r.tier === 1);
    const warnings = governed.filter(r => r.tier === 2);
    const categories = Object.fromEntries(Object.keys(CATEGORY).map(k => [k, { description: CATEGORY[k], hits: rows.filter(r => r.category === k).length }]));
    const out = path.join(ROOT, "artifacts/language-remediation");
    const invPath = path.join(out, "copy-inventory.json");
    const inv = fs.existsSync(invPath) ? JSON.parse(fs.readFileSync(invPath, "utf8")) : null;
    const report = { files: files.length, renderedOccurrences: inv?.renderedOccurrences ?? null, uniqueRenderedStrings: inv?.uniqueRenderedStrings ?? null, tier1Failures: failures.length, tier2ReviewWarnings: warnings.length, categories, allowlistedHits: rows.filter(r => r.review).length, rows };
    // Compare the same detector on both sides of the current branch diff.
    // This is a regression-risk count, never the qualitative saturation score.
    try {
        const changed = execFileSync("git", ["diff", "--name-only", "origin/main", "--"], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim().split(/\r?\n/);
        const scanned = new Set(files.map(f => slash(path.relative(ROOT, f))));
        let previous = 0, current = 0;
        for (const file of changed.filter(f => scanned.has(f))) {
            current += governed.filter(r => r.file === file).length;
            try {
                const before = execFileSync("git", ["show", `origin/main:${file}`], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
                previous += scanFile(file, before, allowlist).filter(r => "ABCD".includes(r.category)).length;
            } catch { /* Newly introduced file has no main-side text. */ }
        }
        report.changedRiskAgainstMain = { previous, current, delta: current - previous };
    } catch { report.changedRiskAgainstMain = null; }
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, "copy-audit.json"), JSON.stringify(report, null, 2) + "\n");
    console.log(`Scanned files: ${files.length}; rendered inventory: ${report.renderedOccurrences ?? "not built"} occurrences / ${report.uniqueRenderedStrings ?? "not built"} unique strings`);
    console.log(`Categories: ${Object.entries(categories).map(([k, v]) => `${k}=${v.hits}`).join(", ")}`);
    console.log(`Changed-file governed risk versus main: ${JSON.stringify(report.changedRiskAgainstMain)} (not a saturation score)`);
    for (const [label, list, limit] of [["Tier-1 failures", failures, 80], ["Tier-2 review warnings", warnings, 30]]) {
        console.log(`\n${label}: ${list.length}`);
        for (const r of list.slice(0, limit)) console.log(`- ${r.file}:${r.line} [${r.category}/${r.phrase}] ${r.context}`);
        if (list.length > limit) console.log(`... ${list.length - limit} more; full report: artifacts/language-remediation/copy-audit.json`);
    }
    console.log("\nTests/comments, identifiers and reviewed usages remain in the report. Tier-2 and corpus saturation require contextual review.");
    if (failures.length) process.exitCode = 1;
    else console.log("copy:audit passed Tier 1.");
}
module.exports = { scanFile, classify };
if (require.main === module) main();
