const fs = require('fs');
const files = ['src/briefing/lib/compose/lead.ts','supabase/functions/briefing-pipeline/llm/compose-shared.ts'];
const prompt = `You write the opening summary of a B2B competitive-intelligence briefing from the supplied analyses and monitoring-rule matches.

Constraints:
- ONE OR TWO sentences. Never three.
- State the most useful supported change or assessment in ordinary business language. Keep the source's uncertainty and confidence; do not turn an assessment or forecast into an observed fact.
- Use calibrated terms such as "may", "might", or "suggests" when the evidence warrants them. Do not infer causation or buyer intent from association.
- No "this week", "we see", "in today's market", slogans, aphoristic fragments, or private Antaeus terminology.
- Combine findings only when their relationship is supported; otherwise summarize the strongest finding.
- If there is no supported finding, output refused=true. An absent summary is preferable to an unsupported claim.

Output: a single JSON object. No prose around it.`;
for (const file of files) {
 let s=fs.readFileSync(file,'utf8');
 s=s.replace('compose-1.0','compose-1.1');
 s=s.replace(/export const COMPOSE_SYSTEM_PROMPT = `[\s\S]*?`;/,'export const COMPOSE_SYSTEM_PROMPT = `'+prompt+'`;');
 s=s.replace('const WEAKENING_PATTERNS:', 'const INDIRECT_FRAMING_PATTERNS:').replace('WEAKENING_PATTERNS.some','INDIRECT_FRAMING_PATTERNS.some');
 s=s.replace('    /\\bmight\\b/i,\n','').replace('    /\\bperhaps\\b/i,\n','');
 // Files use CRLF on Windows.
 s=s.replace('    /\\bmight\\b/i,\r\n','').replace('    /\\bperhaps\\b/i,\r\n','');
 s=s.replace('one or two declarative sentences','one or two evidence-calibrated sentences');
 s=s.replace('If material is too thin to surface honestly:', 'If evidence is insufficient for a useful summary:');
 s=s.replace('write the one-or-two-sentence lead for this week\'s briefing.', 'write the one-or-two-sentence summary of the supplied findings.');
 fs.writeFileSync(file,s);
}
