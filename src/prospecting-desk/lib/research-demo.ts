/**
 * Sample web-research results for the demo lane.
 *
 * The demo has no backend, so it cannot run a live web search. Instead
 * it returns deterministic samples, clearly labeled as samples on
 * screen, built ONLY from the companies, facts, and titles already in
 * the demo dataset (js/demo-seed-data-ent.js and js/demo-seed-data-smb.js):
 *
 *   - company name, domain, industry, headcount  → the seeded account
 *   - signal text, publisher name, age in days   → the seeded signal
 *   - why it fits / suggested target-fit answer  → the seeded "why it matters"
 *   - who to target                               → a seeded buyer-role map
 *   - opening angle / suggested outreach          → a seeded territory approach
 *
 * The only link shown is the company's own website, built from the
 * seeded domain. Seeded signals carry a publisher name but no URL, so
 * sample signals show the publisher as plain text with no link — no URL
 * is invented. research-demo.test.ts loads both seed files and checks
 * every field here against them.
 */

import type {
    ResearchConfidence,
    ResearchSignal,
    SuggestedAnswers,
    WhoToTarget
} from "./types";

export type DemoBook = "ent" | "smb";

export interface SampleSignalSeed {
    readonly headline: string;
    readonly detail: string;
    readonly source: string;
    readonly agoDays: number;
    readonly confidence: number;
    readonly ai: boolean;
}

export interface SampleCompanySeed {
    readonly book: DemoBook;
    readonly name: string;
    readonly domain: string;
    readonly industry: string;
    readonly employees: string;
    readonly why: string;
    readonly signals: ReadonlyArray<SampleSignalSeed>;
    /** Seeded buyer-role map: title + its notes. */
    readonly personaTitle: string;
    readonly personaNote: string;
    /** Seeded territory approach description. */
    readonly approach: string;
}

const ENT_PERSONA_TITLE = "VP Talent Acquisition";
const ENT_PERSONA_NOTE = "Owns the number the CEO quotes. Open with their own announcement.";
const ENT_RECRUITING_OPS = "Head of Recruiting Operations";
const ENT_RECRUITING_OPS_NOTE = "Wants the demo, not the deck.";
const ENT_APPROACH_EXPERT = "They know this category — skip the basics and open with the difference in results.";
const ENT_APPROACH_SEASON = "Lead with the season: number of applicants, length of the hiring window, and what a missed week costs.";
const ENT_APPROACH_SCALE = "Cost of a slow screen at 10,000 applications a week, in their own arithmetic.";

const SMB_PEOPLE = "Head of People";
const SMB_PEOPLE_NOTE = "Often signs alone under $60K — a deal can close after one call.";
const SMB_RECRUITING = "Recruiting Lead";
const SMB_RECRUITING_NOTE = "Feels the problem every day; the pilot makes the case if the numbers improve.";
const SMB_COO = "COO";
const SMB_COO_NOTE = "Controls the budget and gets involved when the hiring burst has a date.";
const SMB_APPROACH_SOFT = "Recruiter hours per hire, before and after screening — the pilot shows the difference in two weeks.";
const SMB_APPROACH_BURST = "The cost of a bad hire during a hiring burst at a small brand, using their own numbers.";
const SMB_APPROACH_BUSIEST = "Quote their single busiest hiring process first; expand after the numbers improve.";

export const SAMPLE_COMPANIES: ReadonlyArray<SampleCompanySeed> = [
    {
        book: "ent", name: "Workday", domain: "workday.com", industry: "HR Technology", employees: "18,000+",
        why: "An HR-tech company reorganizing its own workforce around AI is a good candidate to buy AI tools for its own hiring.",
        signals: [{ headline: "2025 restructuring cut ~1,750 roles while the company kept hiring for AI positions", detail: "Real February 2025 event: 8.5% reduction paired with explicit AI-hiring intent.", source: "News coverage", agoDays: 45, confidence: 0.85, ai: false }],
        personaTitle: ENT_RECRUITING_OPS, personaNote: ENT_RECRUITING_OPS_NOTE, approach: ENT_APPROACH_EXPERT
    },
    {
        book: "ent", name: "Nike", domain: "nike.com", industry: "Apparel / Retail", employees: "80,000",
        why: "A new head of HR during a turnaround usually leads to a review of HR tools.",
        signals: [
            { headline: "New CHRO took the people org in January 2025 as part of the broader turnaround", detail: "Real appointment: a new executive VP and chief human resources officer joined with the CEO reset.", source: "Company announcements", agoDays: 52, confidence: 0.85, ai: false },
            { headline: "Retail, corporate, and supply-chain funnels all hire on different rhythms", detail: "Three very different hiring processes inside one company.", source: "Public filings", agoDays: 27, confidence: 0.7, ai: true }
        ],
        personaTitle: ENT_PERSONA_TITLE, personaNote: ENT_PERSONA_NOTE, approach: ENT_APPROACH_SCALE
    },
    {
        book: "ent", name: "Hilton", domain: "hilton.com", industry: "Hospitality", employees: "180,000+",
        why: "They hire the same way as Marriott, and the two companies compare themselves to each other. A win at one helps sell the other.",
        signals: [{ headline: "Record hotel pipeline — property openings drive continuous frontline hiring", detail: "Unit growth publicly guides to hundreds of openings a year worldwide.", source: "Public filings", agoDays: 22, confidence: 0.78, ai: false }],
        personaTitle: ENT_PERSONA_TITLE, personaNote: ENT_PERSONA_NOTE, approach: ENT_APPROACH_SEASON
    },
    {
        book: "ent", name: "Randstad", domain: "randstad.com", industry: "Global Staffing", employees: "40,000+",
        why: "If Luca works at staffing-firm scale, this is the largest possible account. Expect a long sales cycle for a very large deal.",
        signals: [{ headline: "World's largest staffing firm — screening volume IS the product, and AI screening is the industry's live debate", detail: "Randstad places hundreds of thousands of workers; every placement is a screen.", source: "Industry reporting", agoDays: 24, confidence: 0.75, ai: true }],
        personaTitle: ENT_RECRUITING_OPS, personaNote: ENT_RECRUITING_OPS_NOTE, approach: ENT_APPROACH_EXPERT
    },
    {
        book: "ent", name: "Paycom", domain: "paycom.com", industry: "HR Technology", employees: "7,000+",
        why: "They hire many salespeople and many do not last, so better screening directly affects their revenue.",
        signals: [{ headline: "Sales organization recruits and trains hundreds of representatives each year", detail: "Paycom's sales-hiring engine is a known quantity in the HR-tech industry.", source: "Industry reporting", agoDays: 30, confidence: 0.7, ai: true }],
        personaTitle: ENT_RECRUITING_OPS, personaNote: ENT_RECRUITING_OPS_NOTE, approach: ENT_APPROACH_EXPERT
    },
    {
        book: "ent", name: "Spotify", domain: "spotify.com", industry: "Media / Technology", employees: "7,400",
        why: "They hire in many locations with one central HR team, so a tool for consistent screening fits.",
        signals: [{ headline: "Distributed-team hiring across markets after the efficiency years", detail: "Hiring resumed selectively post-2023 cuts, spread across global hubs.", source: "Public filings", agoDays: 32, confidence: 0.65, ai: true }],
        personaTitle: ENT_RECRUITING_OPS, personaNote: ENT_RECRUITING_OPS_NOTE, approach: ENT_APPROACH_SCALE
    },
    {
        book: "smb", name: "Duolingo", domain: "duolingo.com", industry: "Consumer EdTech", employees: "900",
        why: "A company that questions every new role this hard needs very accurate screening, and they buy tools that meet their standard.",
        signals: [
            { headline: "The CEO's AI-first memo reset how the company hires — managers must show a role can't be done by AI before opening it", detail: "Real 2025 policy: contractor work AI can handle winds down, and every new seat gets an AI test first.", source: "News coverage", agoDays: 26, confidence: 0.9, ai: false },
            { headline: "Leadership says AI made employees four to five times as productive — without a single layoff", detail: "Real public statements from late 2025; output per employee is the operating metric.", source: "CNBC", agoDays: 18, confidence: 0.85, ai: false }
        ],
        personaTitle: SMB_RECRUITING, personaNote: SMB_RECRUITING_NOTE, approach: SMB_APPROACH_SOFT
    },
    {
        book: "smb", name: "Figma", domain: "figma.com", industry: "Design Software", employees: "1,700",
        why: "A design-tools company adding people while rivals cut is hiring at high volume and high standards right now.",
        signals: [
            { headline: "Hiring in response to AI, not cutting — the CEO says roles are being added across the company", detail: "Real post-IPO statement from late 2025: headcount grows as AI expands what the company ships.", source: "News coverage", agoDays: 22, confidence: 0.88, ai: false },
            { headline: "Design-engineer hybrid roles are among the hardest screens in software", detail: "Their core craft blends disciplines most rubrics separate.", source: "Industry reporting", agoDays: 30, confidence: 0.7, ai: true }
        ],
        personaTitle: SMB_RECRUITING, personaNote: SMB_RECRUITING_NOTE, approach: SMB_APPROACH_SOFT
    },
    {
        book: "smb", name: "Dr. Squatch", domain: "drsquatch.com", industry: "CPG", employees: "400+",
        why: "Integration plus new growth funding means hiring waves, with new process requirements from the parent company.",
        signals: [{ headline: "Acquired by Unilever in 2025 — brand keeps operating with new resources behind it", detail: "Real 2025 acquisition; the meme-brand growth engine now has CPG-giant backing.", source: "Company announcements", agoDays: 33, confidence: 0.8, ai: false }],
        personaTitle: SMB_COO, personaNote: SMB_COO_NOTE, approach: SMB_APPROACH_BURST
    },
    {
        book: "smb", name: "BARK", domain: "bark.co", industry: "Pet Products", employees: "1,000",
        why: "Companies focused on cost control buy efficiency. Present screening as recruiter capacity they do not have to hire.",
        signals: [{ headline: "First full year of positive adjusted EBITDA — cost control is the priority, and every hire is scrutinized", detail: "Real FY2025 result; the company is proving the model economics.", source: "Company filings", agoDays: 24, confidence: 0.75, ai: true }],
        personaTitle: SMB_PEOPLE, personaNote: SMB_PEOPLE_NOTE, approach: SMB_APPROACH_BUSIEST
    },
    {
        book: "smb", name: "Coursera", domain: "coursera.org", industry: "EdTech", employees: "1,400",
        why: "An education company investing heavily in AI is more likely to try AI tools for its own hiring.",
        signals: [{ headline: "AI product push is reshaping the org — hiring concentrated in AI-adjacent roles", detail: "Public strategy centers AI across the catalog and platform.", source: "Public filings", agoDays: 22, confidence: 0.72, ai: true }],
        personaTitle: SMB_RECRUITING, personaNote: SMB_RECRUITING_NOTE, approach: SMB_APPROACH_SOFT
    },
    {
        book: "smb", name: "Webflow", domain: "webflow.com", industry: "Web Software", employees: "800",
        why: "Hard-to-screen roles are where screening trained on hiring outcomes shows the biggest difference.",
        signals: [{ headline: "Design-engineer hybrid roles are notoriously hard to screen", detail: "Their core roles blend disciplines most rubrics separate.", source: "Industry reporting", agoDays: 32, confidence: 0.65, ai: true }],
        personaTitle: SMB_RECRUITING, personaNote: SMB_RECRUITING_NOTE, approach: SMB_APPROACH_SOFT
    }
];

interface StorageLike {
    getItem(key: string): string | null;
}

/** Which demo book is loaded (from the seed's meta record). Defaults to enterprise. */
export function detectDemoBook(s?: StorageLike | null): DemoBook {
    const st = s !== undefined ? s : typeof localStorage === "undefined" ? null : localStorage;
    try {
        const raw = st?.getItem("gtmos_demo_seed_meta");
        const mode = raw ? (JSON.parse(raw) as { mode?: unknown }).mode : null;
        return mode === "smb" || mode === "mm" ? "smb" : "ent";
    } catch {
        return "ent";
    }
}

function isoDaysAgo(days: number, now: number): string {
    return new Date(now - days * 86_400_000).toISOString().slice(0, 10);
}

export function sampleConfidence(c: SampleCompanySeed): ResearchConfidence {
    const top = c.signals[0];
    if (!top) return "low";
    if (top.confidence >= 0.8 && !top.ai) return "high";
    if (top.confidence >= 0.7) return "medium";
    return "low";
}

export function sampleSignals(c: SampleCompanySeed, now: number): ResearchSignal[] {
    return c.signals.map((s) => ({
        what: s.headline,
        date: isoDaysAgo(s.agoDays, now),
        sourceUrl: null,
        sourceName: s.source
    }));
}

export function sampleSources(c: SampleCompanySeed): string[] {
    return [`https://${c.domain}`];
}

export function sampleWho(c: SampleCompanySeed): WhoToTarget {
    return { role: c.personaTitle, why: c.personaNote };
}

export function sampleSuggested(c: SampleCompanySeed): SuggestedAnswers {
    return { targetFit: c.why, wayIn: c.personaNote, outreach: c.approach };
}

function key(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** Sample companies for a book, minus any names already in the workspace. */
export function sampleFindPool(book: DemoBook, exclude: ReadonlyArray<string>): SampleCompanySeed[] {
    const ex = new Set(exclude.map(key));
    return SAMPLE_COMPANIES.filter((c) => c.book === book && !ex.has(key(c.name)));
}

/** Look up a sample company by a typed name, across both books. */
export function findSampleCompany(name: string): SampleCompanySeed | null {
    const k = key(name);
    if (!k) return null;
    return SAMPLE_COMPANIES.find((c) => key(c.name) === k) ?? null;
}

/** Names to suggest in the demo's "Research companies you name" box. */
export function sampleResearchNames(book: DemoBook): string[] {
    return SAMPLE_COMPANIES.filter((c) => c.book === book).slice(0, 3).map((c) => c.name);
}
