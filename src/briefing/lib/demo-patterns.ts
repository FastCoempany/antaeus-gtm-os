import type { BriefingPattern } from "./patterns";

/**
 * Demo sample market analyses for the Briefing World view.
 *
 * These examples deliberately model the same language standard required
 * of live generated Briefing output: state what changed, identify the
 * evidence, separate interpretation from observation, and recommend a
 * specific action without using private Antaeus ontology or overstating
 * causality.
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

function demoMode(): "ent" | "smb" {
    try {
        const raw = localStorage.getItem("gtmos_demo_seed_meta");
        if (raw) {
            const meta = JSON.parse(raw) as { mode?: string };
            if (meta.mode === "smb") return "smb";
        }
    } catch {
        // Fall through to the enterprise sample.
    }
    return "ent";
}

function daysAgo(n: number): string {
    return new Date(Date.now() - n * 86_400_000).toISOString();
}

function pattern(
    id: string,
    title: string,
    analysis: string,
    six: BriefingPattern["six_questions"],
    moves: BriefingPattern["recommended_moves"],
    confidence: number,
    counts: [number, number],
    trajectory: BriefingPattern["trajectory"],
    ago: number
): BriefingPattern {
    return {
        id,
        run_id: "demo-run",
        title,
        analysis,
        six_questions: six,
        recommended_moves: moves,
        confidence,
        evidence_count: counts[0],
        source_count: counts[1],
        trajectory,
        surfaced_at: daysAgo(ago),
        target_position: null
    };
}

export function demoSamplePatterns(): BriefingPattern[] {
    if (demoMode() === "smb") {
        return [
            pattern(
                "demo-smb-1",
                "Four watched accounts announced expansion activity within three weeks",
                "Chomps announced a second manufacturing plant, Warby Parker is opening additional stores, Sweetgreen continues entering new markets, and Portillo's expansion in Texas is continuing. Each announcement is a dated event that can be used as a current reason for account research and outreach.",
                {
                    what_changed: "Four watched accounts announced expansions with hiring activity attached.",
                    evidence: "Company announcements and earnings coverage for the four accounts.",
                    confidence_rationale: "The analysis is based primarily on company announcements and other direct reporting of the expansion activity.",
                    why_it_matters: "A dated expansion event provides a current reason to evaluate whether the account has a relevant hiring need.",
                    who_needs_to_know: "The seller responsible for the fast-casual and direct-to-consumer accounts.",
                    what_next: "Reference the company's own expansion announcement and connect it to the specific hiring problem your product addresses."
                },
                [
                    {
                        label: "Draft outreach for the four expansion accounts",
                        rationale: "The announcements are current now and will become less timely as they age.",
                        destination: "Outbound Studio · hooks · draft"
                    }
                ],
                0.88,
                [4, 4],
                "rising",
                1
            ),
            pattern(
                "demo-smb-2",
                "Several watched accounts are publicly focused on cost discipline",
                "Three watched accounts have public cost-control programs. The recorded Eventbrite loss also involved a buyer with a narrow problem and a broader platform proposal, while Calendly and Spindrift closed with a narrower initial package. The current record supports reviewing whether a narrower first proposal fits similar accounts better.",
                {
                    what_changed: "Cost-discipline language appears across three watched accounts.",
                    evidence: "Public filings and earnings coverage for three accounts, plus the recorded Eventbrite, Calendly, and Spindrift outcomes.",
                    confidence_rationale: "The recommendation combines public company evidence with the workspace's own small set of recorded deal outcomes.",
                    who_needs_to_know: "The seller preparing the next proposal for a cost-focused buyer.",
                    why_it_matters: "A narrower first proposal may better match a buyer who is focused on one immediate problem, but the recorded sample is still limited.",
                    what_next: "Review open proposals at cost-focused accounts and decide whether the initial scope should address one specific high-volume workflow."
                },
                [
                    {
                        label: "Review open proposals at cost-focused accounts",
                        rationale: "Two active deals are currently associated with cost-focused buyers.",
                        destination: "Deal Workspace · pipeline · review"
                    }
                ],
                0.81,
                [4, 3],
                "stable",
                3
            ),
            pattern(
                "demo-smb-3",
                "Three watched consumer brands recently changed operating leadership",
                "Bombas appointed a new CEO, Liquid Death added a CFO with large-CPG experience, and OLIPOP appointed a Coca-Cola veteran as president. Leadership changes can create a reason to research whether operating priorities or tooling decisions are being revisited; the appointment itself does not prove that a purchase is underway.",
                {
                    what_changed: "Three watched consumer brands changed senior operating leadership within recent months.",
                    evidence: "Public appointment announcements for each company.",
                    confidence_rationale: "The leadership changes are directly supported by public announcements; the implication for tooling decisions is an assessment, not an observed fact.",
                    why_it_matters: "A new operating leader may revisit processes and tools, which makes the account worth researching for a current initiative.",
                    who_needs_to_know: "The seller responsible for the direct-to-consumer and beverage accounts.",
                    what_next: "Research the new leader's stated priorities before deciding whether the appointment supports outreach."
                },
                [
                    {
                        label: "Research the three leadership changes",
                        rationale: "The appointments are recent enough to evaluate for current priorities.",
                        destination: "Outbound Studio · hooks · draft"
                    }
                ],
                0.84,
                [3, 3],
                "rising",
                2
            )
        ];
    }

    return [
        pattern(
            "demo-ent-1",
            "Three watched accounts have public, dated hiring activity",
            "Boeing is rebuilding its production workforce after the strike, Chipotle has a recurring seasonal hiring program of roughly 20,000 spring hires, and CoreWeave's datacenter expansion has been accompanied by rapid headcount growth. These public events provide current, evidence-based reasons to evaluate whether the accounts have hiring problems relevant to your product.",
            {
                what_changed: "Three watched accounts have public, dated hiring events.",
                evidence: "Company announcements, filings, and news coverage for the three accounts.",
                confidence_rationale: "The underlying events are supported by public sources, including company announcements.",
                why_it_matters: "A public hiring event provides a timely reason to research the account and can support relevant outreach when the hiring need matches your ICP.",
                who_needs_to_know: "The seller responsible for Boeing, Chipotle, and CoreWeave outreach.",
                what_next: "Reference the account's own announcement and connect it to the relevant hiring-volume problem."
            },
            [
                {
                    label: "Draft outreach tied to each hiring event",
                    rationale: "The relevance of a public announcement declines as it becomes older.",
                    destination: "Outbound Studio · hooks · draft"
                }
            ],
            0.9,
            [5, 4],
            "rising",
            1
        ),
        pattern(
            "demo-ent-2",
            "Recorded food-service deals have moved faster than recorded airline deals",
            "The current workspace shows Chipotle closing in 132 days, while the recorded airline deals have taken longer on average and often identify the final approver later in the cycle. The territory tiers currently prioritize aviation. The recorded sample is limited, but it is large enough to justify reviewing whether the current territory priority still matches your own deal history.",
            {
                what_changed: "A cycle-length difference is visible between the recorded food-service and airline deals.",
                evidence: "Closed-deal history compared with the current territory tiers.",
                confidence_rationale: "The observation comes from the workspace's own deal history; the sample size is still limited.",
                why_it_matters: "Territory tiers determine where seller time is concentrated, so a persistent difference in recorded performance should be reviewed.",
                who_needs_to_know: "The person responsible for territory prioritization.",
                what_next: "Review the territory tiers and either change the priority or record why aviation should remain first."
            },
            [
                {
                    label: "Review territory tiers against closed-deal performance",
                    rationale: "The current tiers and recorded outcomes point in different directions.",
                    destination: "Territory Architect · tiers · review"
                }
            ],
            0.79,
            [6, 2],
            "stable",
            4
        ),
        pattern(
            "demo-ent-3",
            "Automated-hiring compliance requirements are appearing in enterprise security reviews",
            "New York's automated-employment law requires bias-audit-related controls, and similar language can appear in enterprise security questionnaires. Boeing's current review includes audit-related questions. The recorded Palantir loss also involved a late security review, which makes early compliance preparation relevant, although that single loss does not establish that security timing alone caused the outcome.",
            {
                what_changed: "Hiring-AI compliance language is present in an active security questionnaire.",
                evidence: "Public New York regulation plus the recorded Boeing security questionnaire and Palantir deal history.",
                confidence_rationale: "The regulatory requirement and current questionnaire are directly supported. The effect of security timing on deal outcomes is an assessment based on limited internal history.",
                why_it_matters: "Known compliance requirements can create review work and delay if they are discovered late in the buying process.",
                who_needs_to_know: "The person responsible for security review on active deals.",
                what_next: "Address known automated-hiring compliance requirements early on deals that require security review."
            },
            [
                {
                    label: "Review the current security workstream",
                    rationale: "An unresolved security issue can delay the expected close date.",
                    destination: "Deal Workspace · pipeline · review"
                }
            ],
            0.83,
            [3, 3],
            "rising",
            2
        )
    ];
}
