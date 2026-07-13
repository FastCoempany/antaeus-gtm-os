import type { BriefingPattern } from "./patterns";

/**
 * Demo-lane sample Patterns. The "Launch interactive demo" lane is
 * isolated sample data by declaration — the demo workspace seeds sample
 * deals, accounts, and signals everywhere else, so the Briefing's World
 * view and the market ticker get a matching authored sample set instead
 * of sitting empty. These NEVER render outside demo mode: the loader
 * checks `sessionStorage.gtmos_env_mode === "demo"` (the canonical demo
 * flag set by js/demo-storage-bootstrap.js). Real workspaces only ever
 * see live Patterns — never a fake feed.
 */

export function isDemoEnv(): boolean {
    try {
        return (
            typeof sessionStorage !== "undefined" &&
            sessionStorage.getItem("gtmos_env_mode") === "demo"
        );
    } catch {
        return false;
    }
}

function daysAgo(n: number): string {
    return new Date(Date.now() - n * 86_400_000).toISOString();
}

export function demoSamplePatterns(): BriefingPattern[] {
    return [
        {
            id: "demo-pattern-1",
            run_id: "demo-run",
            title: "Three of your ICP accounts opened RevOps leadership roles this week",
            analysis:
                "Ramp, Vanta, and Northwind Robotics all posted VP or Director of RevOps roles inside six days. A new RevOps leader usually re-opens the tooling conversation in their first quarter — this is the window where a first meeting is easy to justify.",
            six_questions: {
                what_changed: "Three watched accounts posted senior RevOps roles inside one week.",
                evidence: "Job posts on each company's careers page, all dated this week.",
                confidence_rationale: "Primary sources — the postings themselves, not secondhand chatter.",
                why_it_matters: "New RevOps leaders re-evaluate the stack in their first quarter.",
                who_needs_to_know: "Whoever owns outreach to these three accounts.",
                what_next: "Reference the new role in the opener while the hire is still news."
            },
            recommended_moves: [
                {
                    label: "Draft openers for the three accounts",
                    rationale: "The hiring window is the reason-to-write; it fades in weeks.",
                    destination: "Outbound Studio · hooks · draft"
                }
            ],
            confidence: 0.86,
            evidence_count: 3,
            source_count: 3,
            trajectory: "rising",
            surfaced_at: daysAgo(1),
            target_position: null
        },
        {
            id: "demo-pattern-2",
            run_id: "demo-run",
            title: "Series B fintechs are consolidating vendors — two of your prospects named it publicly",
            analysis:
                "Two prospect CFOs said on record this month that they're cutting tool count, not adding. That reframes your pitch: you're not a new line item, you're the replacement for two.",
            six_questions: {
                what_changed: "Two prospect CFOs publicly committed to vendor consolidation.",
                evidence: "A podcast appearance and an earnings-adjacent blog post, both this month.",
                confidence_rationale: "Direct quotes from the buyers themselves.",
                why_it_matters: "A consolidation buyer needs a replaces-two-tools story, not an add-a-tool story.",
                who_needs_to_know: "Anyone running discovery calls with fintech CFO committees.",
                what_next: "Lead the next two discovery calls with the consolidation frame."
            },
            recommended_moves: [
                {
                    label: "Reframe the discovery opener",
                    rationale: "Meet the consolidation posture head-on instead of fighting it.",
                    destination: "Discovery Studio · opening frame · refresh"
                }
            ],
            confidence: 0.74,
            evidence_count: 2,
            source_count: 2,
            trajectory: "stable",
            surfaced_at: daysAgo(2),
            target_position: null
        },
        {
            id: "demo-pattern-3",
            run_id: "demo-run",
            title: "A competitor raised $40M and is hiring twelve sellers in your segment",
            analysis:
                "The raise closed last week; the sales roles went up two days later. Expect louder outbound into your ICP within the quarter — the accounts you've warmed are about to hear from someone else too.",
            six_questions: {
                what_changed: "A direct competitor closed a $40M round and posted twelve sales roles.",
                evidence: "The funding announcement plus the careers page, cross-checked.",
                confidence_rationale: "Both sources are public and dated within the same week.",
                why_it_matters: "Warmed accounts that sit untouched will start hearing a rival pitch.",
                who_needs_to_know: "Whoever prioritizes which warm accounts get touched first.",
                what_next: "Move the warmest untouched accounts to the front of the outreach queue."
            },
            recommended_moves: [
                {
                    label: "Prioritize the warm untouched accounts",
                    rationale: "First voice in the room tends to set the comparison.",
                    destination: "Signal Console · watchlist · reorder"
                }
            ],
            confidence: 0.81,
            evidence_count: 2,
            source_count: 2,
            trajectory: "rising",
            surfaced_at: daysAgo(3),
            target_position: null
        },
        {
            id: "demo-pattern-4",
            run_id: "demo-run",
            title: "Security questionnaires are getting longer in your segment — plan for it at terms",
            analysis:
                "Three deals in your market closed this quarter only after 100-plus-question security reviews. Buyers aren't getting meaner; procurement is getting earlier. Deals that prepare the papers before the verbal yes close weeks faster.",
            six_questions: {
                what_changed: "Security review depth in your segment stepped up this quarter.",
                evidence: "Three public buyer-side write-ups describing 100-plus-question reviews.",
                confidence_rationale: "Consistent pattern across three independent accounts.",
                why_it_matters: "The gap between verbal yes and signature is where deals stall now.",
                who_needs_to_know: "Anyone with a deal approaching terms.",
                what_next: "Stage the security papers before the next verbal yes, not after."
            },
            recommended_moves: [
                {
                    label: "Stage the security papers now",
                    rationale: "The review starts the day they say yes — be ready that day.",
                    destination: "Getting to Signed · security front · prepare"
                }
            ],
            confidence: 0.7,
            evidence_count: 3,
            source_count: 3,
            trajectory: "rising",
            surfaced_at: daysAgo(4),
            target_position: null
        }
    ];
}
