#!/usr/bin/env node
// Validates a judge's result. Usage: node validate-judge.js <result.json>
const fs = require("fs");
let j; try { j = JSON.parse(fs.readFileSync(process.argv[2], "utf8")); } catch (e) { console.error("INVALID JSON:", e.message); process.exit(1); }
const DIMS = ["semantic_compression", "private_ontology", "metaphorical_abstraction", "declarative_certainty", "aphoristic_cadence", "high_context_dependence", "paratactic_compression", "personification", "elliptical_syntax"];
const errs = [];
for (const scope of ["certified", "extended"]) {
    const s = j[scope]; if (!s) { errs.push(`${scope} missing`); continue; }
    let sum = 0;
    for (const d of DIMS) {
        const x = (s.dimensions || {})[d]; if (!x) { errs.push(`${scope}.dimensions.${d} missing`); continue; }
        if (typeof x.score !== "number" || x.score < 0 || x.score > 10) errs.push(`${scope}.${d}.score must be 0–10`); else sum += x.score;
        if (!Array.isArray(x.evidence) || x.evidence.length < 3) errs.push(`${scope}.${d}.evidence needs at least 3 quoted examples (text + where)`);
        if (!Array.isArray(x.counterEvidence) || x.counterEvidence.length < 2) errs.push(`${scope}.${d}.counterEvidence needs at least 2 quoted examples`);
        if (typeof x.reasoning !== "string" || x.reasoning.length < 150) errs.push(`${scope}.${d}.reasoning too short`);
        if (typeof x.versusBaseline !== "string" || x.versusBaseline.length < 40) errs.push(`${scope}.${d}.versusBaseline missing`);
    }
    const overall = Math.round(sum / 9 * 10);
    if (s.overall !== overall) errs.push(`${scope}.overall must be Math.round(sum/9*10) = ${overall} (sum ${sum.toFixed(1)})`);
}
if (typeof j.dominantRemainingProblems !== "string" || j.dominantRemainingProblems.length < 80) errs.push("dominantRemainingProblems missing");
if (!Array.isArray(j.verifiedMyself)) errs.push("verifiedMyself must list what you read directly");
if (errs.length) { console.error(errs.join("\n")); process.exit(1); }
console.log(`OK certified=${j.certified.overall} extended=${j.extended.overall}`);
