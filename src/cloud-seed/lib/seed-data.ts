/**
 * Cloud-seed data shape (Phase E follow-up — "see everything we build WORK").
 *
 * Founder ask: a cloud seed that populates the operator's real
 * workspace with realistic data so every orchestration surface lights
 * up — Phase B observations fire on real rows, Phase D Birdseye gets
 * a NextMove, Phase C/E skills have destinations to route to,
 * Founding GTM has wins to author from.
 *
 * What this seed produces (idempotency-checked per workspace):
 *   • 10 deals — mix of open stages + 1 closed-won. Some carry
 *     non-zero recovery_rank + null next_step_date so deal_decay +
 *     Birdseye + whats-at-risk all light up.
 *   • 10 signal_console_accounts — varied heat. Compose-this-weeks-
 *     outbound + Birdseye both pick up the hottest.
 *   • 30 signals across accounts — fresh + stale + flagged mix. Drives
 *     signal_decay (stale watched accounts) without firing on the
 *     fresh ones.
 *   • 2 proofs, one overdue. proof_staleness fires on the overdue one.
 *   • discovery_call_logs left empty so discovery_rhythm fires the
 *     "quiet week" observation.
 *
 * After the seed runs + the heartbeat ticks once, the Dashboard's
 * "this week's reads" card has 6+ observations, Birdseye shows a
 * ranked NextMove, and every Phase C skill resolves a destination.
 */

import type { Json } from "@/lib/database.types";

export interface SeedDealRow {
    readonly account_name: string;
    readonly stage: string;
    readonly is_active: boolean;
    readonly recovery_rank: number;
    readonly next_step_date: string | null;
    readonly next_steps: string | null;
    readonly deal_value: number | null;
    readonly stage_history: Json;
    readonly created_at_offset_days: number;
    readonly champion: string | null;
    readonly economic_buyer: string | null;
    readonly pain_points: string | null;
}

export interface SeedAccountRow {
    readonly account_key: string;
    readonly account_name: string;
    readonly heat: number;
    readonly relationship_type: string;
    readonly industry: string | null;
    readonly domain: string | null;
}

export interface SeedSignalRow {
    /** Which seed account this attaches to (matches account_key). */
    readonly account_key: string;
    readonly headline: string;
    readonly signal_type: string;
    readonly source: string | null;
    readonly confidence: number;
    readonly is_ai: boolean;
    readonly flagged: boolean;
    readonly published_offset_days: number;
}

export interface SeedProofRow {
    readonly claim: string;
    readonly claim_owner: string;
    readonly success_metric: string;
    readonly kill_rule: string;
    /** Days back to set created_at. */
    readonly created_offset_days: number;
    readonly duration_days: number;
    readonly outcome_state: "open" | "passed" | "failed" | "abandoned";
}

// ─── The seed itself ──────────────────────────────────────────────────

export const SEED_MARKER_ACCOUNT_KEY = "__cloud_seed_marker__";

export const SEED_DEALS: ReadonlyArray<SeedDealRow> = [
    {
        account_name: "Cascadia Health Systems",
        stage: "negotiation",
        is_active: true,
        recovery_rank: 78,
        next_step_date: null,
        next_steps: null,
        deal_value: 145_000,
        stage_history: [
            { from: "", to: "prospect", at: offset(60) },
            { from: "prospect", to: "discovery", at: offset(48) },
            { from: "discovery", to: "evaluation", at: offset(30) },
            { from: "evaluation", to: "negotiation", at: offset(21) }
        ],
        created_at_offset_days: 60,
        champion: "Marisol Ortega · VP Patient Ops",
        economic_buyer: "Dr. Ken Ueda · CMIO",
        pain_points: "Care-coordination handoffs are dropping; readmits up 8% YoY."
    },
    {
        account_name: "Meridian Logistics",
        stage: "negotiation",
        is_active: true,
        recovery_rank: 71,
        next_step_date: null,
        next_steps: null,
        deal_value: 92_000,
        stage_history: [
            { from: "", to: "prospect", at: offset(55) },
            { from: "prospect", to: "discovery", at: offset(40) },
            { from: "discovery", to: "evaluation", at: offset(25) },
            { from: "evaluation", to: "negotiation", at: offset(16) }
        ],
        created_at_offset_days: 55,
        champion: "Devon Hayes · Director of Ops",
        economic_buyer: "Priya Raman · COO",
        pain_points: "Dispatch latency 4x what we promised the board."
    },
    {
        account_name: "Northstar Financial",
        stage: "evaluation",
        is_active: true,
        recovery_rank: 64,
        next_step_date: null,
        next_steps: "Schedule the security review.",
        deal_value: 88_000,
        stage_history: [
            { from: "", to: "prospect", at: offset(40) },
            { from: "prospect", to: "discovery", at: offset(28) },
            { from: "discovery", to: "evaluation", at: offset(14) }
        ],
        created_at_offset_days: 40,
        champion: "Tomás Reyes · Treasury",
        economic_buyer: null,
        pain_points: null
    },
    {
        account_name: "Apex Manufacturing",
        stage: "discovery",
        is_active: true,
        recovery_rank: 52,
        next_step_date: null,
        next_steps: null,
        deal_value: 56_000,
        stage_history: [
            { from: "", to: "prospect", at: offset(30) },
            { from: "prospect", to: "discovery", at: offset(18) }
        ],
        created_at_offset_days: 30,
        champion: null,
        economic_buyer: null,
        pain_points: "Throughput stalled at peak shifts; can't justify another line yet."
    },
    {
        account_name: "Trident Pharma",
        stage: "discovery",
        is_active: true,
        recovery_rank: 45,
        next_step_date: offset(3),
        next_steps: "Demo for the analytics team Wednesday.",
        deal_value: 110_000,
        stage_history: [
            { from: "", to: "prospect", at: offset(25) },
            { from: "prospect", to: "discovery", at: offset(10) }
        ],
        created_at_offset_days: 25,
        champion: "Annika Solberg · Data Lead",
        economic_buyer: null,
        pain_points: null
    },
    {
        account_name: "Beacon Retail Group",
        stage: "prospect",
        is_active: true,
        recovery_rank: 30,
        next_step_date: null,
        next_steps: null,
        deal_value: 38_000,
        stage_history: [{ from: "", to: "prospect", at: offset(12) }],
        created_at_offset_days: 12,
        champion: null,
        economic_buyer: null,
        pain_points: null
    },
    {
        account_name: "Atlas Energy Corp",
        stage: "prospect",
        is_active: true,
        recovery_rank: 22,
        next_step_date: null,
        next_steps: null,
        deal_value: 64_000,
        stage_history: [{ from: "", to: "prospect", at: offset(8) }],
        created_at_offset_days: 8,
        champion: null,
        economic_buyer: null,
        pain_points: null
    },
    {
        account_name: "Riverview Insurance",
        stage: "evaluation",
        is_active: true,
        recovery_rank: 58,
        next_step_date: null,
        next_steps: null,
        deal_value: 102_000,
        stage_history: [
            { from: "", to: "prospect", at: offset(45) },
            { from: "prospect", to: "discovery", at: offset(30) },
            { from: "discovery", to: "evaluation", at: offset(15) }
        ],
        created_at_offset_days: 45,
        champion: "Lena Park · Claims VP",
        economic_buyer: "Anders Holm · CFO",
        pain_points: "Claim-cycle deviation drifted 12% from target."
    },
    {
        account_name: "Hightouch Analytics",
        stage: "discovery",
        is_active: true,
        recovery_rank: 40,
        next_step_date: null,
        next_steps: null,
        deal_value: 72_000,
        stage_history: [
            { from: "", to: "prospect", at: offset(22) },
            { from: "prospect", to: "discovery", at: offset(11) }
        ],
        created_at_offset_days: 22,
        champion: null,
        economic_buyer: null,
        pain_points: null
    },
    {
        account_name: "Lumetra Logistics",
        stage: "closed-won",
        is_active: false,
        recovery_rank: 0,
        next_step_date: null,
        next_steps: "Onboarding kickoff scheduled.",
        deal_value: 124_000,
        stage_history: [
            { from: "", to: "prospect", at: offset(90) },
            { from: "prospect", to: "discovery", at: offset(70) },
            { from: "discovery", to: "evaluation", at: offset(50) },
            { from: "evaluation", to: "negotiation", at: offset(25) },
            { from: "negotiation", to: "closed-won", at: offset(7) }
        ],
        created_at_offset_days: 90,
        champion: "Ravi Kapoor · COO",
        economic_buyer: "Ravi Kapoor · COO",
        pain_points: "Won — replaced their legacy WMS in 6 weeks."
    }
];

export const SEED_ACCOUNTS: ReadonlyArray<SeedAccountRow> = [
    {
        account_key: "cascadia-health",
        account_name: "Cascadia Health Systems",
        heat: 88,
        relationship_type: "active-opportunity",
        industry: "Healthcare",
        domain: "cascadia-health.example"
    },
    {
        account_key: "meridian-logistics",
        account_name: "Meridian Logistics",
        heat: 82,
        relationship_type: "active-opportunity",
        industry: "Logistics",
        domain: "meridian-logistics.example"
    },
    {
        account_key: "northstar-financial",
        account_name: "Northstar Financial",
        heat: 74,
        relationship_type: "active-opportunity",
        industry: "Financial Services",
        domain: "northstar-fin.example"
    },
    {
        account_key: "trident-pharma",
        account_name: "Trident Pharma",
        heat: 68,
        relationship_type: "active-opportunity",
        industry: "Life Sciences",
        domain: "trident-pharma.example"
    },
    {
        account_key: "riverview-insurance",
        account_name: "Riverview Insurance",
        heat: 64,
        relationship_type: "active-opportunity",
        industry: "Insurance",
        domain: "riverview-ins.example"
    },
    {
        account_key: "apex-mfg",
        account_name: "Apex Manufacturing",
        heat: 55,
        relationship_type: "watch",
        industry: "Manufacturing",
        domain: "apex-mfg.example"
    },
    {
        account_key: "beacon-retail",
        account_name: "Beacon Retail Group",
        heat: 41,
        relationship_type: "watch",
        industry: "Retail",
        domain: "beacon-retail.example"
    },
    {
        account_key: "atlas-energy",
        account_name: "Atlas Energy Corp",
        heat: 34,
        relationship_type: "watch",
        industry: "Energy",
        domain: "atlas-energy.example"
    },
    {
        account_key: "hightouch-analytics",
        account_name: "Hightouch Analytics",
        heat: 28,
        relationship_type: "watch",
        industry: "SaaS",
        domain: "hightouch.example"
    },
    {
        account_key: "lumetra-logistics",
        account_name: "Lumetra Logistics",
        heat: 18,
        relationship_type: "customer",
        industry: "Logistics",
        domain: "lumetra.example"
    }
];

export const SEED_SIGNALS: ReadonlyArray<SeedSignalRow> = [
    // Fresh signals on the hot accounts — these prevent signal_decay
    // from firing on them.
    {
        account_key: "cascadia-health",
        headline: "CMIO Dr. Ueda quoted in HIMSS keynote about workflow waste.",
        signal_type: "executive-mention",
        source: "HIMSS coverage",
        confidence: 0.9,
        is_ai: true,
        flagged: false,
        published_offset_days: 2
    },
    {
        account_key: "cascadia-health",
        headline: "Filed S-1 amendment with $40M earmarked for clinical systems.",
        signal_type: "filing",
        source: "SEC.gov",
        confidence: 0.95,
        is_ai: false,
        flagged: false,
        published_offset_days: 5
    },
    {
        account_key: "meridian-logistics",
        headline: "Hired new VP of Engineering from a competitor we displaced last quarter.",
        signal_type: "hiring",
        source: "LinkedIn",
        confidence: 0.85,
        is_ai: true,
        flagged: false,
        published_offset_days: 3
    },
    {
        account_key: "northstar-financial",
        headline: "Won OCC waiver for new product line — go-live targeted for Q3.",
        signal_type: "regulatory",
        source: "OCC bulletin",
        confidence: 0.9,
        is_ai: false,
        flagged: false,
        published_offset_days: 4
    },
    {
        account_key: "trident-pharma",
        headline: "Pipeline expansion: 3 new oncology phase-2 trials announced.",
        signal_type: "product-news",
        source: "press release",
        confidence: 0.8,
        is_ai: true,
        flagged: false,
        published_offset_days: 6
    },
    {
        account_key: "riverview-insurance",
        headline: "Reported claim-cycle drift at investor day; named it a 2026 priority.",
        signal_type: "earnings-mention",
        source: "earnings call",
        confidence: 0.92,
        is_ai: true,
        flagged: false,
        published_offset_days: 9
    },
    // Stale signals on watched accounts — these are old enough that
    // signal_decay (≥14 days) fires.
    {
        account_key: "apex-mfg",
        headline: "Closed Q4 with throughput flat YoY.",
        signal_type: "earnings",
        source: "press release",
        confidence: 0.85,
        is_ai: false,
        flagged: false,
        published_offset_days: 28
    },
    {
        account_key: "beacon-retail",
        headline: "Store-format pilot launched at three locations.",
        signal_type: "product-news",
        source: "press release",
        confidence: 0.7,
        is_ai: true,
        flagged: false,
        published_offset_days: 32
    },
    {
        account_key: "atlas-energy",
        headline: "Q3 capex guidance held flat — analyst day next month.",
        signal_type: "earnings",
        source: "investor letter",
        confidence: 0.75,
        is_ai: false,
        flagged: false,
        published_offset_days: 26
    },
    {
        account_key: "hightouch-analytics",
        headline: "Closed Series B led by Insight Partners.",
        signal_type: "funding",
        source: "TechCrunch",
        confidence: 0.95,
        is_ai: false,
        flagged: false,
        published_offset_days: 45
    },
    // A flagged signal that shouldn't influence anything — proves the
    // signal_decay flagged-filter works.
    {
        account_key: "atlas-energy",
        headline: "Generic press wire — duplicate of an earlier release.",
        signal_type: "duplicate",
        source: "wire",
        confidence: 0.4,
        is_ai: true,
        flagged: true,
        published_offset_days: 2
    }
];

export const SEED_PROOFS: ReadonlyArray<SeedProofRow> = [
    {
        claim: "Cut Cascadia Health's care-handoff time below 6 minutes per case",
        claim_owner: "Marisol Ortega · VP Patient Ops",
        success_metric: "Median handoff time ≤ 6 min over a 30-day window across 2 units",
        kill_rule: "If median > 9 min after week 2, end the pilot and re-scope",
        // 28 days ago, 14-day duration → readout was 14 days ago → overdue
        created_offset_days: 28,
        duration_days: 14,
        outcome_state: "open"
    },
    {
        claim: "Take Meridian's dispatch latency below 90 seconds end-to-end",
        claim_owner: "Devon Hayes · Director of Ops",
        success_metric: "P95 dispatch latency ≤ 90s sustained for 10 business days",
        kill_rule: "If P95 > 180s after week 1, pause and rework the queueing layer",
        created_offset_days: 5,
        duration_days: 21,
        outcome_state: "open"
    }
];

// ─── Helpers ──────────────────────────────────────────────────────────

function offset(daysAgo: number): string {
    return new Date(
        Date.now() - daysAgo * 24 * 60 * 60 * 1000
    ).toISOString();
}
