#!/usr/bin/env node
// Validates an audit result file. Usage: node validate-audit.js <file> [--obligations <slice.json>]
const fs=require('fs');const f=process.argv[2];const oi=process.argv.indexOf('--obligations');
let j;try{j=JSON.parse(fs.readFileSync(f,'utf8'))}catch(e){console.error('INVALID JSON:',e.message);process.exit(1)}
const errs=[];const need=(c,m)=>{if(!c)errs.push(m)};
need(typeof j.area==='string','area missing');
for(const k of ['coverage','findings','dispositions','retained','gaps']) need(Array.isArray(j[k]),`${k} must be an array`);
const CAT=['LANG-A','LANG-B','LANG-C','LANG-D','FUNC','CLAIM','A11Y','TOOLING'];
const GEN=['v4','ds','legacy','shared','backend','static','seed','doctrine','tooling'];
const HOW=['executed-in-walkthrough','source-and-test-reviewed','not-verified'];
const ST=['IMPLEMENTED','IMPLEMENTED DIFFERENTLY BUT ACCEPTABLY','SUPERSEDED BY APPROVED PRODUCT EVOLUTION','STILL MISSING','NO LONGER APPLICABLE'];
const ids=new Set();
(j.coverage||[]).forEach((c,i)=>{need(c.surface&&HOW.includes(c.how)&&GEN.includes(c.generation),`coverage[${i}] needs surface, generation in ${GEN.join('|')}, how in ${HOW.join('|')}`)});
(j.findings||[]).forEach((x,i)=>{
  need(x.id&&!ids.has(x.id),`findings[${i}] id missing or duplicate (${x.id})`);ids.add(x.id);
  need(CAT.includes(x.category),`findings[${i}] category invalid (${x.category})`);
  need([1,2,3].includes(x.severity),`findings[${i}] severity must be 1|2|3`);
  need(typeof x.file==='string'&&x.file.length>0,`findings[${i}] file missing`);
  need(GEN.includes(x.generation),`findings[${i}] generation invalid (${x.generation})`);
  for(const k of ['current','problem','governing','proposed']) need(typeof x[k]==='string'&&x[k].trim().length>0,`findings[${i}] ${k} missing`);
  if(x.file&&!/^[A-Za-z0-9_.\-\/ ()]+$/.test(x.file)) errs.push(`findings[${i}] file path looks wrong: ${x.file}`);
  if(x.file&&!fs.existsSync('/home/user/antaeus-gtm-os/'+x.file)) errs.push(`findings[${i}] file does not exist: ${x.file}`);
});
const dids=new Set();
(j.dispositions||[]).forEach((d,i)=>{need(d.recordId,`dispositions[${i}] recordId missing`);need(ST.includes(d.status),`dispositions[${i}] status invalid (${d.status})`);need(typeof d.note==='string'&&d.note.length>5,`dispositions[${i}] note missing`);need((d.currentText&&d.where)||d.status==='NO LONGER APPLICABLE',`dispositions[${i}] (${d.recordId}) needs currentText and where as evidence`);dids.add(d.recordId)});
if(oi>0){const s=JSON.parse(fs.readFileSync(process.argv[oi+1],'utf8'));const want=(s.judge||[]).map(r=>r.id).filter(id=>!process.argv.includes('--kinds')||true);const miss=want.filter(id=>!dids.has(id));if(miss.length)errs.push(`missing dispositions for ${miss.length} judge records: ${miss.slice(0,25).join(', ')}${miss.length>25?' …':''}`)}
if(errs.length){console.error(errs.slice(0,60).join('\n'));console.error(`\n${errs.length} problem(s)`);process.exit(1)}
console.log(`OK area=${j.area} coverage=${j.coverage.length} findings=${j.findings.length} dispositions=${j.dispositions.length} retained=${j.retained.length} gaps=${j.gaps.length}`);
