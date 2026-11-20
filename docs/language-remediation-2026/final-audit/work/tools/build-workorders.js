#!/usr/bin/env node
// Builds one work order per repository partition from the adjudicated findings.
// Usage: node build-workorders.js [--merged <dir>] [--out <dir>]
// Reads merged/adjudicated.json, plus (if present) overrides.json:
//   { "<area>/<id>": { "decision": "apply|drop", "finalProposed": "...", "note": "..." } }
// and extra-findings.json (orchestrator's own findings, same finding shape with area + id).
const fs = require("fs"), path = require("path");
const S = __dirname;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const MERGED = arg("--merged", path.join(S, "merged"));
const OUT = arg("--out", path.join(S, "workorders"));
fs.mkdirSync(OUT, { recursive: true });
const read = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return d; } };
const items = read(path.join(MERGED, "adjudicated.json"), []);
const overrides = read(path.join(S, "overrides.json"), {});
const extra = read(path.join(S, "extra-findings.json"), []);

// First match wins. Each partition owns its paths exclusively.
const PARTS = [
    ["welcome", ["src/welcome/"]],
    ["readiness-lib", ["src/lib/readiness/"]],
    ["dashboard", ["src/dashboard/", "src/birdseye/"]],
    ["onboarding", ["src/onboarding/", "js/onboarding.js", "supabase/functions/seeding-enrichment/"]],
    ["icp-studio", ["src/icp-studio/"]],
    ["territory-architect", ["src/territory-architect/"]],
    ["prospecting-desk", ["src/prospecting-desk/", "supabase/functions/prospecting-research/"]],
    ["signal-console", ["src/signal-console/"]],
    ["briefing", ["src/briefing/", "src/lib/briefing-", "supabase/functions/briefing-pipeline/", "supabase/functions/briefing-pattern-critic/", "deliverables/specs/briefing/"]],
    ["outdoors-events", ["src/outdoors-events/", "supabase/functions/outdoors-events-discovery/"]],
    ["outbound-studio", ["src/outbound-studio/"]],
    ["cold-call-studio", ["src/cold-call-studio/"]],
    ["linkedin-playbook", ["src/linkedin-playbook/"]],
    ["discovery-ui", ["src/discovery-studio/", "css/discovery-"]],
    ["discovery-content-base", ["js/discovery-segment-runtime.js", "js/discovery-frameworks.js"]],
    ["discovery-content-a", ["js/discovery-segment-runtime-legal.js", "js/discovery-segment-runtime-recruiting.js", "js/discovery-segment-runtime-product-ux.js", "js/discovery-segment-runtime-govtech.js", "js/discovery-segment-runtime-customer-support.js"]],
    ["discovery-content-b", ["js/discovery-segment-runtime-sales-revenue.js", "js/discovery-segment-runtime-manufacturing.js", "js/discovery-segment-runtime-data-intelligence.js", "js/discovery-segment-runtime-ai-native.js", "js/discovery-segment-runtime-global-contractor-management.js"]],
    ["deal-workspace", ["src/deal-workspace/"]],
    ["pilot-desk", ["src/pilot-desk/"]],
    ["getting-to-signed", ["src/getting-to-signed/"]],
    ["call-in-a-favor", ["src/call-in-a-favor/"]],
    ["future-autopsy", ["src/future-autopsy/"]],
    ["quota-workback", ["src/quota-workback/"]],
    ["founding-gtm", ["src/founding-gtm/"]],
    ["settings", ["src/settings/"]],
    ["demo-seeds", ["js/demo-seed-", "js/demo-storage-bootstrap.js", "src/cloud-seed/"]],
    ["functions-other", ["supabase/"]],
    ["shared-src", ["src/"]],
    ["variant-pages", ["demo-a-time.html", "demo-b-space.html", "demo-c-story.html", "demo-reveal.html", "demo-90.html", "landing-a-system.html", "landing-b-monday.html", "landing-c-inherit.html", "landing-a-alive.html", "landing-b-alive.html", "landing-c-alive.html", "signup-a-momentum.html", "signup-b-promise.html", "signup-c-read.html", "seeding-flow-front.html", "seeding-flow.html", "seeding-flow-deals.html"]],
    ["tooling", ["tools/", ".github/", "package.json", "tests/", "playwright.config.ts", "vite.config.ts", "preview.html"]],
    ["maps-and-docs", ["deliverables/", "docs/", "CLAUDE.md", "COPY_STANDARD.md", "README.md"]],
    ["static-public", [""]]
];
const partOf = (file) => { for (const [k, ps] of PARTS) if (ps.some((p) => file.startsWith(p))) return k; return "static-public"; };

const all = items.concat(extra.map((x) => ({ source: "orchestrator", decision: "ACCEPTED", finalProposed: x.proposed, why: [], ...x })));
const orders = {}, dropped = [], held = [];
for (const it of all) {
    const key = `${it.area}/${it.id}`;
    const ov = overrides[key];
    let apply = /^(ACCEPTED|ACCEPTED_TWO_PROPOSALS|SINGLE_REVIEWER)$/.test(it.decision);
    if (ov && ov.decision === "drop") { dropped.push({ key, why: ov.note || "orchestrator" }); continue; }
    if (ov && ov.decision === "apply") apply = true;
    if (!apply) { held.push({ key, decision: it.decision, file: it.file, current: (it.current || "").slice(0, 160), why: it.why }); continue; }
    const p = partOf(it.file || "");
    (orders[p] = orders[p] || []).push({
        id: key, category: it.category, severity: it.severity, file: it.file, line: it.line, generation: it.generation, state: it.state,
        current: it.current, problem: it.problem, governing: it.governing,
        change: (ov && ov.finalProposed) || it.finalProposed || it.proposed,
        reviewerNotes: (it.why || []).concat(ov && ov.note ? ["orchestrator: " + ov.note] : []),
        checkedBy: it.source === "audit" ? `audit + refute(${it.refute}) + rewrite(${it.rewrite})` : it.source,
        testsAffected: it.testsAffected || []
    });
}
const lines = [];
for (const [k] of PARTS) {
    const o = orders[k]; if (!o) continue;
    o.sort((a, b) => (a.file || "").localeCompare(b.file || "") || (a.line || 0) - (b.line || 0));
    fs.writeFileSync(path.join(OUT, k + ".json"), JSON.stringify({ partition: k, paths: PARTS.find((p) => p[0] === k)[1], items: o }, null, 1));
    const c = o.reduce((m, x) => { m[x.category] = (m[x.category] || 0) + 1; return m; }, {});
    lines.push(`${k.padEnd(24)} ${String(o.length).padStart(4)} items  ${JSON.stringify(c)}  files=${new Set(o.map((x) => x.file)).size}`);
}
fs.writeFileSync(path.join(OUT, "_held.json"), JSON.stringify(held, null, 1));
fs.writeFileSync(path.join(OUT, "_dropped.json"), JSON.stringify(dropped, null, 1));
lines.push(`held for orchestrator review (rejected / no accepted fix / unverified): ${held.length}; dropped by override: ${dropped.length}`);
fs.writeFileSync(path.join(OUT, "_summary.txt"), lines.join("\n") + "\n");
console.log(lines.join("\n"));
