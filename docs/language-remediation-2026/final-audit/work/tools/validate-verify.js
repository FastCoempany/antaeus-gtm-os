#!/usr/bin/env node
// Validates a verification file against its audit file. Usage: node validate-verify.js <verify.json> <audit.json>
const fs=require('fs');let v,a;try{v=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));a=JSON.parse(fs.readFileSync(process.argv[3],'utf8'))}catch(e){console.error('INVALID JSON:',e.message);process.exit(1)}
const errs=[];const V=['CONFIRMED','AMENDED','REJECTED'];
if(!['refute','rewrite'].includes(v.lens))errs.push('lens must be refute|rewrite');
if(!Array.isArray(v.verdicts))errs.push('verdicts must be an array');
const seen=new Set();(v.verdicts||[]).forEach((x,i)=>{if(!x.findingId)errs.push(`verdicts[${i}] findingId missing`);seen.add(x.findingId);if(!V.includes(x.verdict))errs.push(`verdicts[${i}] verdict invalid`);if(typeof x.reason!=='string'||x.reason.length<8)errs.push(`verdicts[${i}] reason missing`);if(x.verdict==='AMENDED'&&!(typeof x.finalProposed==='string'&&x.finalProposed.trim()))errs.push(`verdicts[${i}] AMENDED needs finalProposed`)});
const miss=(a.findings||[]).map(f=>f.id).filter(id=>!seen.has(id));if(miss.length)errs.push(`no verdict for ${miss.length} findings: ${miss.slice(0,20).join(', ')}`);
for(const k of ['dispositionChallenges','missed'])if(!Array.isArray(v[k]))errs.push(`${k} must be an array`);
if(errs.length){console.error(errs.slice(0,50).join('\n'));process.exit(1)}
const c={};v.verdicts.forEach(x=>c[x.verdict]=(c[x.verdict]||0)+1);console.log(`OK lens=${v.lens} verdicts=${v.verdicts.length} ${JSON.stringify(c)} challenges=${v.dispositionChallenges.length} missed=${v.missed.length}`);
