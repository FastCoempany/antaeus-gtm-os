import fs from "node:fs";

function replace(path, from, to) {
  let s = fs.readFileSync(path, "utf8");
  if (!s.includes(from)) return false;
  s = s.split(from).join(to);
  fs.writeFileSync(path, s);
  return true;
}

const reps = [
  // Stale tests: preserve behavior assertions while aligning copy expectations
  ["src/cold-call-studio/state.test.ts", 'expect(entry?.threadTitle).toBe("Get permission in the first breath.");', 'expect(entry?.threadTitle).toBe("Acknowledge the interruption and ask for a short window.");'],
  ["src/linkedin-playbook/state.test.ts", 'expect(entry.cueLabel).toContain("Comment");', 'expect(entry.cueLabel).toContain("useful comment");'],
  ["src/quota-workback/state.test.ts", 'expect(quality.value.label).toBe("Ready now");', 'expect(quality.value.label).toBe("Near benchmark");'],
  ["src/quota-workback/state.test.ts", 'expect(quality.value.label).toBe("Thin");', 'expect(quality.value.label).toBe("Low benchmark alignment");'],
  ["src/dashboard/components/ReadinessDrawer.test.tsx", 'getByText("You are the system.")', 'getByText("Founder-dependent")'],
  ["src/linkedin-playbook/ds/ds-components.test.tsx", '["Connection", "Public cue", "Give-first", "Ask"]', '["Connection", "Comment", "Useful information", "Meeting request"]'],
  ["src/lib/follow/follow-data.test.ts", 'toContain("Stalled")', 'toContain("No recorded activity")'],
  ["src/lib/operator-help/registry.test.ts", '/recovery board/i', '/ranks open deals/i'],
  ["src/lib/operator-help/registry.test.ts", '/ranks everything under pressure/i', '/summarizes current activity/i'],
  ["src/territory-architect/lib/field-read.test.ts", 'toContain("haven\'t carved a division")', 'toContain("no territory segments have been created")'],
  ["src/territory-architect/lib/field-read.test.ts", 'toContain("open the conversation")', 'toContain("record a sales approach")'],
  ["src/territory-architect/lib/field-read.test.ts", 'toContain("retier")', 'toContain("reassign")'],
  ["src/territory-architect/lib/field-read.test.ts", 'toContain("lost accounts off the map")', 'toContain("remove closed-lost accounts")'],
  ["src/territory-architect/lib/field-read.test.ts", 'toContain("one division covers everything")', 'toContain("one segment currently contains the entire territory")'],
  ["src/territory-architect/lib/field-read.test.ts", 'toContain("paused accounts")', 'toContain("accounts are paused")'],
  ["src/territory-architect/lib/field-read.test.ts", 'toContain("nothing needs replacing")', 'toContain("no account replacement is currently required")'],
  ["src/briefing/lib/llm/prompts.test.ts", 'toBe("enrich-1.0")', 'toBe("enrich-1.1")'],
  ["src/briefing/lib/llm/prompts.test.ts", 'toContain("Relevance is anchored on this category")', 'toContain("Score user_relevance_score by how much the item touches the operator\'s category")'],
  ["src/briefing/lib/llm/prompts.test.ts", 'toContain("Workspace has not yet declared")', 'toContain("Workspace context is incomplete")'],
  ["src/briefing/lib/llm/prompts.test.ts", 'toContain("must be \'{\'")', 'toContain("matching the schema")'],
  ["src/briefing/lib/llm/prompts.test.ts", 'toContain("factual")', 'toContain("Preserve what the source actually establishes")'],
  ["src/briefing/lib/llm/prompts.test.ts", 'toContain("ADDITIONAL RULE")', 'toContain("When the item mentions a company that appears in the ownership map")'],
  ["src/briefing/lib/synthesis/prompts.test.ts", 'toContain("hasn\'t fully declared")', 'toContain("Commercial profile/ICP is incomplete")'],
  ["src/briefing/lib/synthesis/prompts.test.ts", 'toBe("synthesis-1.0")', 'toBe("synthesis-1.1")'],
  ["src/dashboard/v4/lib/cockpit.test.ts", 'toBe("Right now,")', 'toBe("Current readiness:")'],
  ["src/dashboard/v4/lib/cockpit.test.ts", 'toBe("you\'re the system")', 'toBe("Founder-dependent")'],
  ["src/dashboard/v4/lib/cockpit.test.ts", 'toBe("2 will slip")', 'toBe("2 at elevated risk")'],
  ["src/dashboard/v4/lib/cockpit.test.ts", 'toBe("Behind")', 'toBe("Below required pace")'],
  ["src/dashboard/v4/lib/cockpit.test.ts", 'toBe("Holding")', 'toBe("No elevated risk")'],
  ["src/quota-workback/v4/lib/pace.test.ts", 'toContain("stretch")', 'toContain("Assumption above benchmark")'],
  ["src/signal-console/v4/lib/attention.test.ts", 'toContain("Motion-ready")', 'toContain("high priority")'],
  ["src/territory-architect/ds/lib/adapters.test.ts", 'toContain("division")', 'toContain("territory segment")'],
  ["src/welcome/v4/lib/landing.test.ts", 'toContain("hard work")', 'toContain("Setup complete")'],

  // Voice gate: prose remains prose; status labels remain concise and explicit.
  ["src/call-in-a-favor/v4/CallInAFavorV4.tsx", 't("No open deals currently need outside help.")', 't("No open deals currently need outside help.", { class: "body" })'],
  ["src/deal-workspace/v4/DealWorkspaceV4.tsx", 't("Other open deals · ranked by risk")', 't("Other open deals · ranked by risk", { class: "body" })'],
  ["src/deal-workspace/v4/DealWorkspaceV4.tsx", 't("No deals are currently in the high-risk band.")', 't("No deals are currently in the high-risk band.", { class: "body" })'],
  ["src/deal-workspace/v4/DealWorkspaceV4.tsx", 't("No elevated-risk deals in the current ranking.")', 't("No elevated-risk deals in the current ranking.", { class: "body" })'],
  ["src/discovery-studio/v4/DiscoveryStudioV4.tsx", 't("complete")', 't("Step complete")'],
  ["src/future-autopsy/v4/FutureAutopsyV4.tsx", 't("No open deals currently require a risk review.")', 't("No open deals currently require a risk review.", { class: "body" })'],
  ["src/getting-to-signed/v4/GettingToSignedV4.tsx", 't("No workstream is currently marked as blocking.")', 't("No workstream is currently marked as blocking.", { class: "body" })'],
  ["src/getting-to-signed/v4/GettingToSignedV4.tsx", 't("still need input from the appropriate technical owner.")', 't("still need input from the appropriate technical owner.", { class: "body" })'],
  ["src/icp-studio/v4/IcpStudioV4.tsx", 't("Accounts that do not match · and why")', 't("Accounts that do not match · and why", { class: "body" })'],
  ["src/icp-studio/v4/IcpStudioV4.tsx", 't("more accounts that do not match this ICP")', 't("more accounts that do not match this ICP", { class: "body" })'],
  ["src/linkedin-playbook/v4/LinkedInPlaybookV4.tsx", 't("No account is available for a LinkedIn action yet.")', 't("No account is available for a LinkedIn action yet.", { class: "body" })'],
  ["src/pilot-desk/v4/PilotDeskV4.tsx", 't("complete")', 't("Step complete")'],
  ["src/prospecting-desk/v4/ProspectingDeskV4.tsx", 't("complete")', 't("Step complete")'],
  ["src/quota-workback/v4/QuotaWorkbackV4.tsx", 't("outreach actions per working day this month")', 't("outreach actions per working day this month", { class: "body" })'],
  ["src/quota-workback/v4/QuotaWorkbackV4.tsx", 't("Activity and pipeline required by current assumptions")', 't("Activity and pipeline required by current assumptions", { class: "body" })'],
  ["src/quota-workback/v4/QuotaWorkbackV4.tsx", 't("additional outreach actions per working day under the current model")', 't("additional outreach actions per working day under the current model", { class: "body" })']
];

// Workspace-map descriptions are descriptive prose, not compact labels.
const motionPath = "src/lib/ground/motion.ts";
let motion = fs.readFileSync(motionPath, "utf8");
motion = motion.replace(/desc: t\(("[^"]+")\)/g, 'desc: t($1, { class: "body" })');
fs.writeFileSync(motionPath, motion);

let changed = 0;
for (const [path, from, to] of reps) if (replace(path, from, to)) changed++;
console.log(`Applied ${changed} targeted remediation/test sync replacements.`);
