#!/usr/bin/env node
"use strict";

/**
 * Rebuild the rendered user-facing copy inventory from preview-transcript/.
 *
 * The language-remediation project originally analyzed a plain-text export
 * of this same generated transcript. This script makes the derived inventory
 * reproducible inside the repo so the audit does not depend on a stale
 * external snapshot.
 *
 * Usage:
 *   npm run build:transcript
 *   npm run copy:inventory
 *
 * Output:
 *   artifacts/language-remediation/copy-inventory.json
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const TRANSCRIPT = path.join(ROOT, "preview-transcript");
const OUT_DIR = path.join(ROOT, "artifacts", "language-remediation");
const OUT = path.join(OUT_DIR, "copy-inventory.json");

const ISSUE_TERMS = [
    ["ground", "private_ontology"],
    ["whole motion", "semantic_compression"],
    ["motion", "semantic_compression"],
    ["heat", "private_ontology"],
    ["hottest", "private_ontology"],
    ["sharp", "private_ontology"],
    ["bite", "metaphor"],
    ["carve", "metaphor"],
    ["live edge", "private_ontology"],
    ["the machine", "personification"],
    ["one move", "semantic_compression"],
    ["workspace is awake", "personification"],
    ["awake", "personification"],
    ["thread", "semantic_compression"],
    ["pressure", "semantic_compression"],
    ["decay", "metaphor"],
    ["dying", "metaphor"],
    ["dies", "metaphor"],
    ["climb", "metaphor"],
    ["summit", "metaphor"],
    ["inheritable", "private_ontology"],
    ["handoff kit", "private_ontology"],
    ["face-off", "metaphor"],
    ["air cover", "metaphor"],
    ["standing orders", "metaphor"],
    ["system's read", "metadiscourse"],
    ["what the system saw", "metadiscourse"]
];

function decode(s) {
    return s
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ");
}

function stripTags(s) {
    return decode(s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function walk(dir) {
    const out = [];
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) out.push(...walk(p));
        else if (ent.isFile() && ent.name.endsWith(".html")) out.push(p);
    }
    return out;
}

function classify(text) {
    const low = text.toLowerCase();
    const issues = [];
    for (const [term, category] of ISSUE_TERMS) {
        if (low.includes(term)) issues.push({ term, category });
    }
    if (/\b(here's|here is|the one thing|what the system|this is where)\b/i.test(text)) {
        issues.push({ term: "metadiscursive construction", category: "metadiscourse" });
    }
    if (text.includes(" — ") && text.trim().split(/\s+/).length <= 22) {
        issues.push({ term: "short dash construction", category: "compressed_cadence" });
    }
    return issues;
}

if (!fs.existsSync(TRANSCRIPT)) {
    console.error("preview-transcript/ not found. Run npm run build:transcript first.");
    process.exit(1);
}

const occurrences = [];
const supplemental = [];
const linePattern = /<div class="line"><span class="kind">\[([^\]]+)\]<\/span>\s*([\s\S]*?)\s*<span class="cue">([\s\S]*?)<\/span><\/div>/g;

for (const file of walk(TRANSCRIPT)) {
    const html = fs.readFileSync(file, "utf8");
    const room = path.basename(path.dirname(file));
    if (path.dirname(file) === TRANSCRIPT) {
        // The index stores the actual navigation capture and the locked-room
        // tooltip outside renderLines. Include them in the review corpus while
        // preserving the original rendered-line metric for comparison.
        for (const captured of html.matchAll(/<(pre|blockquote)>([\s\S]*?)<\/\1>/g)) {
            supplemental.push({ room: "navigation", state: "Workspace map / locked onboarding", text: stripTags(captured[2]), source: path.relative(ROOT, file), kind: "navigation-or-tooltip" });
        }
    }
    let m;
    while ((m = linePattern.exec(html)) !== null) {
        const text = stripTags(m[2]);
        if (!text) continue;
        const preceding = html.slice(0, m.index);
        const state = [...preceding.matchAll(/<h[23]>([\s\S]*?)<\/h[23]>/g)].at(-1)?.[1] || "gate";
        const context = stripTags(m[3]);
        occurrences.push({
            room,
            state: stripTags(state),
            elementType: m[1],
            text,
            renderContext: context,
            source: path.relative(ROOT, file)
        });
        // Keep supplementary user text separate so existing line-count metrics
        // remain comparable. Hover text, placeholders and values still require review.
        for (const extra of context.matchAll(/(?:hover:|placeholder|filled with)\s*“([^”]+)”/g)) {
            supplemental.push({ room, state: stripTags(state), text: extra[1], source: path.relative(ROOT, file), kind: "hover-or-field-value" });
        }
    }
}

const byText = new Map();
for (const row of occurrences) {
    let rec = byText.get(row.text);
    if (!rec) {
        rec = {
            text: row.text,
            occurrenceCount: 0,
            rooms: new Set(),
            elementTypes: new Set(),
            sources: new Set(),
            states: new Set(),
            issues: classify(row.text)
        };
        byText.set(row.text, rec);
    }
    rec.occurrenceCount += 1;
    rec.rooms.add(row.room);
    rec.elementTypes.add(row.elementType);
    rec.sources.add(row.source);
    rec.states.add(`${row.room}: ${row.state}`);
}

const unique = Array.from(byText.values())
    .map((r) => ({
        text: r.text,
        occurrenceCount: r.occurrenceCount,
        rooms: Array.from(r.rooms).sort(),
        elementTypes: Array.from(r.elementTypes).sort(),
        sources: Array.from(r.sources).sort(),
        states: Array.from(r.states).sort(),
        issues: r.issues
    }))
    .sort((a, b) => b.issues.length - a.issues.length || b.occurrenceCount - a.occurrenceCount || a.text.localeCompare(b.text));

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(
    OUT,
    JSON.stringify(
        {
            generatedAt: new Date().toISOString(),
            source: "preview-transcript/",
            renderedOccurrences: occurrences.length,
            uniqueRenderedStrings: unique.length,
            records: unique,
            occurrences,
            supplemental
        },
        null,
        2
    ) + "\n"
);
fs.writeFileSync(path.join(OUT_DIR, "rendered-corpus.txt"), occurrences.map(r => `[${r.room} | ${r.state} | ${r.elementType}] ${r.text}`).join("\n") + "\n\nSUPPLEMENTAL HOVER / FIELD TEXT\n" + supplemental.map(r => `[${r.room} | ${r.state}] ${r.text}`).join("\n") + "\n");

console.log(`Rendered occurrences: ${occurrences.length}`);
console.log(`Unique rendered strings: ${unique.length}`);
console.log(`Wrote ${path.relative(ROOT, OUT)}`);
