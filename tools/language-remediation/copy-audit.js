#!/usr/bin/env node
"use strict";

/**
 * Language-regression audit for the Antaeus plain-language migration.
 *
 * Tier 1 phrases fail CI unless they are explicitly allowlisted.
 * Tier 2 terms are review warnings because some have legitimate internal
 * or ordinary-English uses. The rendered preview transcript is the most
 * important audit surface; src/ is also scanned to catch generators and
 * shared UI before regeneration.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const TARGETS = [path.join(ROOT, "src"), path.join(ROOT, "preview-transcript")];

const TIER1 = [
    "touch the ground",
    "the ground — your whole motion",
    "whole motion",
    "the live edge",
    "you are the system",
    "inheritable with guardrails",
    "workspace is awake",
    "system's pick",
    "where it bites",
    "sharp matches",
    "the cuts",
    "the climb",
    "the summit",
    "all four fronts",
    "face-off",
    "air cover",
    "the machine"
];

const TIER2 = [
    "motion",
    "heat",
    "hottest",
    "going cold",
    "sharp",
    "sharpen",
    "bite",
    "carve",
    "awake",
    "thread",
    "pressure",
    "pulling",
    "decay",
    "decaying",
    "dying",
    "floor",
    "thin",
    "front",
    "relay",
    "dividend",
    "morning landing",
    "system's read",
    "what the system saw",
    "heartbeat",
    "standing orders"
];

// Exact source-relative path + optional phrase. Keep this intentionally small.
const ALLOWLIST = [];

const SOURCE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".html"]);
const SKIP_DIRS = new Set(["node_modules", ".git", "dist"]);

function walk(dir) {
    if (!fs.existsSync(dir)) return [];
    const out = [];
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        if (ent.isDirectory() && SKIP_DIRS.has(ent.name)) continue;
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) out.push(...walk(p));
        else if (ent.isFile() && SOURCE_EXTS.has(path.extname(ent.name))) out.push(p);
    }
    return out;
}

function isAllowed(rel, phrase) {
    return ALLOWLIST.some((x) => x.path === rel && (!x.phrase || x.phrase === phrase));
}

function scanPhrase(content, phrase) {
    const out = [];
    const low = content.toLowerCase();
    const needle = phrase.toLowerCase();
    let at = 0;
    while (true) {
        const idx = low.indexOf(needle, at);
        if (idx < 0) break;
        const before = content.slice(0, idx);
        const line = before.split("\n").length;
        const start = Math.max(0, idx - 80);
        const end = Math.min(content.length, idx + needle.length + 120);
        out.push({ line, context: content.slice(start, end).replace(/\s+/g, " ").trim() });
        at = idx + needle.length;
    }
    return out;
}

const failures = [];
const warnings = [];
let fileCount = 0;

for (const target of TARGETS) {
    for (const file of walk(target)) {
        fileCount += 1;
        const rel = path.relative(ROOT, file);
        const content = fs.readFileSync(file, "utf8");

        for (const phrase of TIER1) {
            if (isAllowed(rel, phrase)) continue;
            for (const hit of scanPhrase(content, phrase)) {
                failures.push({ file: rel, phrase, ...hit });
            }
        }

        for (const phrase of TIER2) {
            if (isAllowed(rel, phrase)) continue;
            for (const hit of scanPhrase(content, phrase)) {
                warnings.push({ file: rel, phrase, ...hit });
            }
        }
    }
}

function printRows(title, rows, limit) {
    console.log(`\n${title}: ${rows.length}`);
    for (const row of rows.slice(0, limit)) {
        console.log(`- ${row.file}:${row.line} [${row.phrase}] ${row.context}`);
    }
    if (rows.length > limit) console.log(`... ${rows.length - limit} more`);
}

console.log(`Scanned files: ${fileCount}`);
printRows("Tier-1 failures", failures, 80);
printRows("Tier-2 review warnings", warnings, 120);

if (failures.length > 0) {
    console.error("\ncopy:audit failed: deprecated Tier-1 user-facing language remains.");
    process.exit(1);
}

console.log("\ncopy:audit passed Tier 1. Review Tier-2 warnings before merging.");
