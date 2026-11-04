const fs=require('fs');
let p='src/onboarding/seeding/lib/diagnose.ts',s=fs.readFileSync(p,'utf8');
s=s.replace(/\/\*\*[\s\S]*?\*\//, '/** Deterministic assessment of recorded deal fields. These checks identify\n * missing information and follow-up needs; they do not predict the outcome. */');
const changes={
"You're not sure where this sits — and if you can't place it, the buyer probably can't either. That ambiguity is the risk.":"No deal stage is selected. Confirm the buyer’s current decision process before assigning a stage.",
"Pin down their actual next step and who owns it. That tells you the stage.":"Confirm the next buyer action, its owner, and the stage criteria it satisfies.",
"no economic buyer named":"no signer recorded",
"it's gone quiet":"a reported gap in buyer responses",
"Late stage and ${why}. Deals don't close without the person who signs in the room.":"This deal is in a late stage with ${why}. This needs review before relying on the planned close date.",
"Get a name on who signs, and a dated next step, before it goes cold.":"Confirm who can sign and agree on a dated next step.",
"Re-open it with a reason to move now — not a check-in.":"Ask whether the buyer’s priorities or timeline have changed and agree on the next action.",
'"Fragile"':'"Single contact"',
"You're single-threaded this late. One departure or one skeptic kills it.":"The deal is in a late stage and your notes indicate one contact. A change in that person’s availability or support could delay approval.",
"Multi-thread to the buying group before terms land.":"Identify the other decision makers and confirm their approval requirements.",
"Nobody named is fighting for this on the inside. That's the difference between a deal and a hope.":"No champion is recorded. The current information does not show who will advocate for the proposal internally.",
"Find — or build — one person who'll sell it when you're not in the room.":"Identify an internal supporter and confirm whether they can help coordinate the buying process.",
"Early, watch the signer":"Signer not recorded",
"You don't know who signs yet. Find that out before you invest more.":"No signer is recorded. Confirm the approval process before planning the close.",
"Map the economic buyer this week, while the champion's warm.":"Ask your champion who approves the purchase and who signs the agreement.",
'label: "Live"':'label: "Key contacts recorded"',
"Champion named, signer known, nothing screaming. Keep the next step dated.":"A champion and signer are recorded, and these checks found no additional flag. This does not establish overall deal health.",
"Protect the momentum — confirm the next step before this call ends.":"Confirm the next buyer action, owner, and date."
}; for(const [a,b] of Object.entries(changes)) s=s.replaceAll(a,b); fs.writeFileSync(p,s);
p='src/onboarding/seeding/lib/evidence.ts';s=fs.readFileSync(p,'utf8');s=s.replace(/\/\*\*[\s\S]*?\*\//,'/** Explains how each onboarding input is used by the application.\n * Product behavior is the basis for these notes; no external outcome claims. */');s=s.replace(/const SALESFORCE_ICP:[\s\S]*?(?=export const EVIDENCE)/,'');
const notes={door:'Each step explains how its inputs will be used. Review these notes as you enter your workspace information.',icp:'Your ICP describes the companies and buyer roles you want to target. Antaeus uses it to assess account relevance; a match still needs verification.',accounts:'Account names define which companies to research. The next step looks for recent changes with source links. If research is unavailable, you can continue with your list.',wake:'Review the reported changes and their sources before acting. Priority reflects an assessment of recency and ICP relevance, not confirmed buying intent.',deals:'Record what you know about the champion, signer, budget, timeline, and current obstacle. The initial deal assessment uses those fields to identify information to verify and actions to consider.',quota:'Your quota and closed-won total set the revenue target and remaining gap used in Quota Workback. Required pipeline depends on the conversion assumptions you enter.',landing:'Your inputs initialize the workspace. Review the resulting accounts, deals, and recommendations, and update them as you obtain new evidence.'};
for(const [id,note] of Object.entries(notes)) {const re=new RegExp('('+id+': \\{\\s*note: t\\(\\s*)"[^"\\n]*("[\\s\\S]*?source:) [A-Z_]+'); if(id==='door') s=s.replace(/(door: \{\s*note: t\(\s*)"[^"\n]*"/,'$1'+JSON.stringify(note)); else s=s.replace(re,(_,before,after)=>before+JSON.stringify(note).slice(0,-1)+after+' null');}fs.writeFileSync(p,s);
p='supabase/functions/heartbeat/generators.ts';s=fs.readFileSync(p,'utf8');s=s.replace('${account} has been silent for ${daysSilent} days — no fresh signal coverage.','No new signals have been recorded for ${account} in ${daysSilent} days.');s=s.replace('if (t >= new Date(cutoff).getTime()) count += 1;', 'if (t >= new Date(cutoff).getTime() && t <= now.getTime()) count += 1;');s=s.replace('Discovery is the muscle that compounds; a quiet week shows up later as a thin pipeline.', 'Check whether calls are missing from the log or whether more discovery activity is needed for your pipeline plan.');s=s.replace('Below the floor for the cadence to compound.', 'Review this activity against your pipeline plan.');fs.writeFileSync(p,s);
