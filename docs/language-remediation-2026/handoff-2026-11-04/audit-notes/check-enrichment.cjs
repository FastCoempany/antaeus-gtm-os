const fs = require('fs');
const p='supabase/functions/seeding-enrichment/index.ts';
let s=fs.readFileSync(p,'utf8').replace('// @ts-nocheck — Deno Edge runtime; typechecked at deploy, not in the Vite build.','// Deno entrypoint; validate with deno check before deployment.');
s=s.replace('for (const e of entries) {','for (const e of entries) {\n        if (!e || typeof e !== "object") continue;');
fs.writeFileSync(p,s);
