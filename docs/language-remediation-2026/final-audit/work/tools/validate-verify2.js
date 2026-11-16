#!/usr/bin/env node
// Validates a combined verification file against its audit file. Usage: node validate-verify2.js <verify.json> <audit.json>
const fs=require('fs');let v,a;try{v=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));a=JSON.parse(fs.readFileSync(process.argv[3],'utf8'))}catch(e){console.error('INVALID JSON:',e.message);process.exit(1)}
const errs=[];const R=['CONFIRMED','AMENDED','REJECTED'],F=['CONFIRMED','AMENDED','REJECTED','N/A'];
if(!Array.isArray(v.verdicts))errs.push('verdicts must be an array');
const seen=new Set();(v.verdicts||[]).forEach((x,i)=>{if(!x.findingId)errs.push(`verdicts[${i}] findingId missing`);seen.add(x.findingId);if(!R.includes(x.real))errs.push(`verdicts[${i}] real invalid (${x.real})`);if(!F.includes(x.fix))errs.push(`verdicts[${i}] fix invalid (${x.fix})`);if(x.real==='REJECTED'&&x.fix!=='N/A')errs.push(`verdicts[${i}] fix must be N/A when real is REJECTED`);if(x.real!=='REJECTED'&&x.fix==='N/A')errs.push(`verdicts[${i}] fix verdict required when the finding is real`);if(typeof x.reason!=='string'||x.reason.length<8)errs.push(`verdicts[${i}] reason missing`);if(x.fix==='AMENDED'&&!(typeof x.finalProposed==='string'&&x.finalProposed.trim()))errs.push(`verdicts[${i}] fix AMENDED needs finalProposed`)});
const miss=(a.findings||[]).map(f=>f.id).filter(id=>!seen.has(id));if(miss.length)errs.push(`no verdict for ${miss.length} findings: ${miss.slice(0,20).join(', ')}`);
for(const k of ['dispositionChallenges','missed'])if(!Array.isArray(v[k]))errs.push(`${k} must be an array`);
(v.missed||[]).forEach((x,i)=>{for(const k of ['id','category','file','current','problem','proposed'])if(!x[k])errs.push(`missed[${i}] ${k} missing`);if(x.file&&!fs.existsSync('/home/user/antaeus-gtm-os/'+x.file))errs.push(`missed[${i}] file does not exist: ${x.file}`)});
if(errs.length){console.error(errs.slice(0,50).join('\n'));process.exit(1)}
const c={};v.verdicts.forEach(x=>{c['real:'+x.real]=(c['real:'+x.real]||0)+1;c['fix:'+x.fix]=(c['fix:'+x.fix]||0)+1});console.log(`OK verdicts=${v.verdicts.length} ${JSON.stringify(c)} challenges=${v.dispositionChallenges.length} missed=${v.missed.length}`);
