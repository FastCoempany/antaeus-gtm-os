#!/usr/bin/env node
// Validates a scoring reader's result. Usage: node validate-reader.js <result.json> <slice.txt>
const fs = require("fs");
let j; try { j = JSON.parse(fs.readFileSync(process.argv[2], "utf8")); } catch (e) { console.error("INVALID JSON:", e.message); process.exit(1); }
const slice = fs.readFileSync(process.argv[3], "utf8"); const total = slice.split("\n").filter(Boolean).length;
const norm = (s) => String(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim().toLowerCase();
const hay = norm(slice);
const DIMS = ["semantic_compression", "private_ontology", "metaphorical_abstraction", "declarative_certainty", "aphoristic_cadence", "high_context_dependence", "paratactic_compression", "personification", "elliptical_syntax"];
const errs = [];
if (typeof j.slice !== "string") errs.push("slice missing");
if (j.linesRead !== total) errs.push(`linesRead must equal the number of lines in the slice (${total}); read the whole slice`);
if (!j.dimensions || typeof j.dimensions !== "object") errs.push("dimensions missing");
for (const d of DIMS) {
    const x = (j.dimensions || {})[d]; if (!x) { errs.push(`dimensions.${d} missing`); continue; }
    if (typeof x.sliceScore !== "number" || x.sliceScore < 0 || x.sliceScore > 10) errs.push(`${d}.sliceScore must be a number 0–10`);
    if (typeof x.reasoning !== "string" || x.reasoning.length < 40) errs.push(`${d}.reasoning too short`);
    if (!Array.isArray(x.examples)) errs.push(`${d}.examples must be an array`);
    if (!Array.isArray(x.clean)) errs.push(`${d}.clean must be an array`);
    for (const e of (x.examples || []).concat(x.clean || [])) { if (!e.text || !hay.includes(norm(e.text).slice(0, 80))) errs.push(`${d}: quoted text not found in the slice: ${String(e.text).slice(0, 70)}`); }
    if (x.sliceScore >= 1 && (x.examples || []).length < 1) errs.push(`${d}: a score of 1 or more needs at least one example`);
}
if (!Array.isArray(j.damage)) errs.push("damage must be an array");
for (const e of j.damage || []) if (!e.text || !hay.includes(norm(e.text).slice(0, 80))) errs.push(`damage: quoted text not found in the slice: ${String(e.text).slice(0, 70)}`);
if (errs.length) { console.error(errs.slice(0, 40).join("\n")); console.error(`\n${errs.length} problem(s)`); process.exit(1); }
console.log(`OK slice=${j.slice} lines=${j.linesRead} scores=${DIMS.map((d) => j.dimensions[d].sliceScore).join("/")} damage=${j.damage.length}`);
