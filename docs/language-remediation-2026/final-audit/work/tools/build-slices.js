const fs=require('fs'),path=require('path');
const ROOT='/home/user/antaeus-gtm-os';
const d=require('./ledger/auto-pre.json');
const ID={"Welcome":"welcome","Dashboard":"dashboard","Readiness Score":"readiness","ICP Studio":"icp-studio","Territory Architect":"territory-architect","Prospecting Desk":"prospecting-desk","Signal Console":"signal-console","Briefing":"briefing","Outdoors Events":"outdoors-events","Outbound Studio":"outbound-studio","Cold Call Studio":"cold-call-studio","LinkedIn Playbook":"linkedin-playbook","Discovery Studio":"discovery-studio","Deal Workspace":"deal-workspace","Pilot Desk":"pilot-desk","Getting to Signed":"getting-to-signed","Call in a Favor":"call-in-a-favor","Future Autopsy":"future-autopsy","Quota Workback":"quota-workback","Founding GTM":"founding-gtm","Settings":"settings"};
const slices={};
const slot=k=>slices[k]=slices[k]||{judge:[],verbatim:[],watch:[],retainedStillRendered:0,retainedGone:0};
for(const r of d.records){
  if(r.kind==='navigation-description'){ slot('_shared-chrome').judge.push({id:r.id,input:r.input,jsonPath:r.jsonPath,kind:r.kind,subject:r.subject,replacement:r.replacement,auto:r.auto,evidence:r.evidence}); continue; }
  if(['rule','deprecated-term','preserve-term'].includes(r.kind)) { slot('_rules').judge.push({id:r.id,input:r.input,jsonPath:r.jsonPath,kind:r.kind,original:r.original,preferred:r.preferred,rule:r.rule,replacement:r.replacement}); continue; }
  const rooms=r.rooms||[];
  const owner = rooms.length>=8 ? '_shared-chrome' : (ID[rooms[0]]||'_unmapped');
  const s=slot(owner);
  const lean={id:r.id,input:r.input,jsonPath:r.jsonPath||`records[${r.index}]`,kind:r.kind,original:r.original,replacement:r.replacement,rooms:r.rooms,states:r.states,classifications:r.classifications,terms:r.terms,severity:r.severity,originalAction:r.originalAction||r.originalStatus,auto:r.auto,evidence:r.evidence};
  if(r.auto==='NEEDS_JUDGMENT'||r.auto==='ORIGINAL_STILL_RENDERED') s.judge.push(lean);
  else if(r.auto==='REPLACEMENT_RENDERED_VERBATIM'||r.auto==='REPLACEMENT_IN_SOURCE_VERBATIM') s.verbatim.push({id:r.id,original:r.original,replacement:r.replacement,auto:r.auto,where:(r.evidence.replacementRendered[0]||{}).samples||r.evidence.replacementInSource});
  else if(r.auto==='RETAINED_STILL_RENDERED'){ s.retainedStillRendered++; if((r.severity||0)>=2||(r.terms&&r.terms.length)) s.watch.push({id:r.id,original:r.original,terms:r.terms,severity:r.severity,classifications:r.classifications,where:(r.evidence.originalRendered[0]||{}).samples}); }
  else if(r.auto==='RETAINED_NO_LONGER_RENDERED') s.retainedGone++;
}
for(const [k,s] of Object.entries(slices)){
  fs.writeFileSync(`obligations/${k}.json`,JSON.stringify(s,null,1));
  console.log(k.padEnd(22),'judge',String(s.judge.length).padStart(4),'verbatim',String(s.verbatim.length).padStart(4),'watch',String(s.watch.length).padStart(3),'retained-still',String(s.retainedStillRendered).padStart(4),'retained-gone',String(s.retainedGone).padStart(4), (fs.statSync(`obligations/${k}.json`).size/1024|0)+'KB');
}
// corpus slices
const lines=fs.readFileSync(ROOT+'/artifacts/language-remediation/rendered-corpus.txt','utf8').split('\n').filter(Boolean);
const by={};
for(const l of lines){const m=l.match(/^\[([^|\]]+) \| ([^|]*) \| ([^\]]+)\] ([\s\S]*)$/); if(!m){(by._other=by._other||[]).push(l);continue;} (by[m[1]]=by[m[1]]||[]).push(`[${m[2]} | ${m[3]}] ${m[4]}`);}
for(const [k,v] of Object.entries(by)){fs.writeFileSync(`corpus/${k}.txt`,v.join('\n')+'\n');}
console.log(Object.entries(by).map(([k,v])=>`${k}:${v.length}`).join(' '));
