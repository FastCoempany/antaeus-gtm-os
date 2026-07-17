import type { BriefingPattern } from "./patterns";

/**
 * Demo sample Patterns — the declared-sample content the demo lane
 * shows in the Briefing's World view (real workspaces only ever see
 * live pipeline output; the gate below is the same one the Live Edge
 * demo stream uses).
 *
 * Luca reseed (2026-07-16, plan: antaeus-demo-seed-luca-plan): the
 * patterns are scenario-aware — the enterprise book and the SMB book
 * each get reads written from their own roster, drawn from the same
 * real public events the Signal Console seed cites.
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
        // fall through to the enterprise read
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
                "Expansion news landed on four of your accounts inside three weeks",
                "Chomps announced a second manufacturing plant, Warby Parker is opening stores at roughly one a week, Sweetgreen keeps entering new markets, and Portillo's Texas run continues. Every one of those announcements dates a hiring need — and your fastest closes this year all rode a dated event.",
                {
                    what_changed: "Four watched accounts announced expansions with hiring attached.",
                    evidence: "Company announcements and earnings coverage, all public.",
                    confidence_rationale: "Primary sources — the announcements themselves.",
                    why_it_matters: "Expansion news dates the hiring need; the call lands warm the week it prints.",
                    who_needs_to_know: "Whoever owns outreach on the fast-casual and DTC accounts.",
                    what_next: "Open with their own announcement — the date does the urgency."
                },
                [
                    {
                        label: "Draft openers for the four accounts",
                        rationale: "The announcement window fades in weeks.",
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
                "Discipline-era buyers keep choosing point tools — your Eventbrite loss says quote one funnel first",
                "Three of your watch accounts are in public cost programs. The Eventbrite loss followed the same shape: a lean buyer with one problem, offered a platform. The one-funnel package closed Calendly and Spindrift; it is the right first quote for every discipline-era account on the book.",
                {
                    what_changed: "Cost-discipline language is showing up across the watch tier.",
                    evidence: "Public filings and earnings coverage on three accounts, plus your own loss record.",
                    confidence_rationale: "The pattern matches a loss you already paid for.",
                    who_needs_to_know: "Whoever quotes the next lean-team deal.",
                    why_it_matters: "Platform pricing loses to point tools when the buyer has one problem.",
                    what_next: "Quote the single busiest funnel first; expand after the number moves."
                },
                [
                    {
                        label: "Re-check open quotes against the one-funnel package",
                        rationale: "Two live deals are at lean-team accounts.",
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
                "New operating leadership at three brands in your patch",
                "Bombas installed a new CEO, Liquid Death added a CFO from big-CPG lineage, and OLIPOP put a Coca-Cola veteran in the president seat. New operating leaders professionalize tooling in their first two quarters — the window is open on all three.",
                {
                    what_changed: "Three consumer brands changed operating leadership within months.",
                    evidence: "Public appointment announcements on each.",
                    confidence_rationale: "Named appointments from primary coverage.",
                    why_it_matters: "New leaders re-pick the operating stack early.",
                    who_needs_to_know: "Whoever owns the DTC and beverage accounts.",
                    what_next: "Reference the new leader's mandate in the opener — not the product."
                },
                [
                    {
                        label: "Draft leadership-window openers",
                        rationale: "First-two-quarters windows close on their own.",
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
            "Three of your watched accounts are running public hiring pushes right now",
            "Boeing is rebuilding its production workforce after the strike, Chipotle's burrito-season engine hires ~20,000 every spring, and CoreWeave's datacenter buildout roughly tripled its headcount in a year. Public hiring events are the book's whole engine — each one dates the conversation for you.",
            {
                what_changed: "Three accounts have live, public, dated hiring events.",
                evidence: "Company announcements, filings, and news coverage on each.",
                confidence_rationale: "Primary sources — their own announcements.",
                why_it_matters: "A public hiring push is urgency you don't have to manufacture.",
                who_needs_to_know: "Whoever owns Boeing, Chipotle, and CoreWeave outreach.",
                what_next: "Open on their own announcement; bring the seasonal math."
            },
            [
                {
                    label: "Draft openers keyed to each hiring event",
                    rationale: "Announced events fade from the news cycle fast.",
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
            "Your food-service accounts close twice as fast as your airline accounts — the book is tiered the other way",
            "Chipotle closed in 132 days and Sweetgreen's sister motion runs faster still; the airline deals average past 150 with the signer arriving late. The tiering puts aviation first. The record says the fast-casual lane deserves the first hour of the day.",
            {
                what_changed: "The close-rate gap between lanes is now visible in your own record.",
                evidence: "Your closed-won history against the current tier map.",
                confidence_rationale: "Your own workspace data, not market chatter.",
                why_it_matters: "The book's tiering decides where mornings go — and it disagrees with the record.",
                who_needs_to_know: "Whoever owns the territory carve.",
                what_next: "Re-tier or defend the airline-first bet deliberately."
            },
            [
                {
                    label: "Review the tier map against the close record",
                    rationale: "A deliberate bet beats an inherited one.",
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
            "Automated-hiring rules keep tightening — buyers now cite NYC's audit law in security reviews",
            "New York's automated employment-decision law made bias audits table stakes, and enterprise security reviews increasingly borrow its language. Boeing's 150-question review already asks for it. The compliance answer is a paper you hold — make it part of the first conversation, not the last.",
            {
                what_changed: "Hiring-AI compliance language is showing up inside security questionnaires.",
                evidence: "The NYC law is public; your own Boeing review cites audit requirements.",
                confidence_rationale: "One primary regulation plus a live deal artifact.",
                why_it_matters: "Deals die in late security reviews — the Palantir loss already proved it.",
                who_needs_to_know: "Whoever runs the security front on live deals.",
                what_next: "Open the compliance conversation in week one on every gated deal."
            },
            [
                {
                    label: "Check the security front on the live negotiation",
                    rationale: "The blocking front is the deal's clock.",
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
