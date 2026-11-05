/**
 * Prospecting Desk research client.
 *
 * Calls the `prospecting-research` Edge Function, which runs Antaeus's
 * own cited web search (canon §4.6):
 *   - callFind:     "Search the web" — companies matching a description
 *   - callResearch: "Research companies you name" — a sourced brief each
 *
 * The seller only ever sees plain messages from RESEARCH_MESSAGES; raw
 * transport or Supabase errors go to reportError.
 *
 * Demo lane: when the session is the demo (sessionStorage
 * gtmos_env_mode === "demo") or Supabase isn't configured, both calls
 * return labeled sample results built from the demo dataset
 * (research-demo.ts). They never pretend to be a live search.
 */

import { getSupabaseClient } from "@/lib/supabase-client";
import { createDataClient, type DataClient } from "@/lib/data-client";
import { isDemoModeActive } from "@/lib/data-client-demo-local";
import { reportError, trackEvent } from "@/lib/observability";
import type {
    ResearchConfidence,
    ResearchSignal,
    SuggestedAnswers,
    WhoToTarget
} from "./types";
import { isHttpsUrl } from "./research-parse";
import {
    detectDemoBook,
    findSampleCompany,
    sampleConfidence,
    sampleFindPool,
    sampleSignals,
    sampleSources,
    sampleSuggested,
    sampleWho
} from "./research-demo";

export const RESEARCH_FUNCTION = "prospecting-research";
export const MAX_RESEARCH_NAMES = 5;

export const RESEARCH_MESSAGES = {
    needDescription: "Describe the companies you're after in a sentence or two, then search.",
    needNames: "Type at least one company name to research.",
    tooManyNames: "Research up to five companies at a time.",
    noWorkspace: "Sign in to a workspace to search the web for companies.",
    paused: "This week's research budget is used up. Web search will be available again next week.",
    failed: "The web search didn't finish. Try again in a few minutes.",
    unavailable: "Web search isn't available in this copy of the app."
} as const;

export const BUDGET_NOTES = {
    warn: "Most of this week's research budget is used. A few more searches are available.",
    throttled: "This week's research budget is nearly used up, so this search returned fewer companies."
} as const;

export interface FoundCompany {
    readonly name: string;
    readonly domain: string | null;
    readonly whyFit: string;
    readonly signal: ResearchSignal | null;
    readonly sources: ReadonlyArray<string>;
    readonly whoToTarget: WhoToTarget | null;
    readonly openingAngle: string;
    readonly confidence: ResearchConfidence;
}

export interface ResearchedCompany {
    readonly name: string;
    readonly domain: string | null;
    readonly whatTheyDo: string;
    readonly signals: ReadonlyArray<ResearchSignal>;
    readonly fitMatches: ReadonlyArray<string>;
    readonly fitUnknowns: ReadonlyArray<string>;
    readonly whoToTarget: WhoToTarget | null;
    readonly openingAngle: string;
    readonly suggested: SuggestedAnswers;
    readonly sources: ReadonlyArray<string>;
}

interface BaseResult {
    readonly ok: boolean;
    /** True when these are demo sample results, not a live search. */
    readonly sample: boolean;
    /** Plain-language message for the seller; null on success. */
    readonly error: string | null;
    /** Plain-language budget note for the seller; null when budget is fine. */
    readonly budgetNote: string | null;
    readonly ranAt: string;
}

export interface FindResult extends BaseResult {
    readonly companies: ReadonlyArray<FoundCompany>;
}

export interface ResearchResult extends BaseResult {
    readonly companies: ReadonlyArray<ResearchedCompany>;
    readonly notFound: ReadonlyArray<string>;
}

export interface FindInput {
    readonly description: string;
    readonly icp?: string;
    readonly focus?: string;
    readonly exclude?: ReadonlyArray<string>;
}

export interface ResearchInput {
    readonly companies: ReadonlyArray<string>;
    readonly description?: string;
    readonly icp?: string;
    readonly focus?: string;
}

export interface CallOptions {
    /** Test-only. */
    readonly data?: DataClient;
    /** Test-only: force demo/sample mode on or off. */
    readonly sampleMode?: boolean;
    readonly now?: number;
}

// ─── Mode detection ────────────────────────────────────────────────

function supabaseConfigured(): boolean {
    try {
        getSupabaseClient();
        return true;
    } catch {
        return false;
    }
}

export function useSampleResearch(): boolean {
    return isDemoModeActive() || !supabaseConfigured();
}

/** Split a typed list ("Vanta, Drata; Ramp") into names. */
export function splitCompanyNames(text: string): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const part of text.split(/[,;\n]+/)) {
        const name = part.trim().replace(/\s+/g, " ");
        if (!name) continue;
        const k = name.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(name);
    }
    return out;
}

// ─── Response parsing (camelCase, defensive) ───────────────────────

function obj(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}
function str(v: unknown): string {
    return typeof v === "string" ? v.trim() : "";
}
function strList(v: unknown): string[] {
    return Array.isArray(v) ? v.map(str).filter(Boolean) : [];
}
function confidence(v: unknown): ResearchConfidence {
    return v === "high" || v === "medium" ? v : "low";
}
function signal(v: unknown): ResearchSignal | null {
    const o = obj(v);
    if (!o) return null;
    const what = str(o["what"]);
    const url = o["source_url"];
    if (!what || !isHttpsUrl(url)) return null;
    const date = str(o["date"]);
    return { what, date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null, sourceUrl: url.trim(), sourceName: null };
}
function who(v: unknown): WhoToTarget | null {
    const o = obj(v);
    const role = o ? str(o["role"]) : "";
    return o && role ? { role, why: str(o["why"]) } : null;
}
function sources(v: unknown): string[] {
    return strList(v).filter(isHttpsUrl);
}

export function parseFoundCompanies(v: unknown): FoundCompany[] {
    if (!Array.isArray(v)) return [];
    const out: FoundCompany[] = [];
    for (const raw of v) {
        const o = obj(raw);
        if (!o) continue;
        const name = str(o["name"]);
        const src = sources(o["sources"]);
        if (!name || src.length === 0) continue;
        out.push({
            name,
            domain: str(o["domain"]) || null,
            whyFit: str(o["why_fit"]),
            signal: signal(o["signal"]),
            sources: src,
            whoToTarget: who(o["who_to_target"]),
            openingAngle: str(o["opening_angle"]),
            confidence: confidence(o["confidence"])
        });
    }
    return out;
}

export function parseResearchedCompanies(v: unknown): ResearchedCompany[] {
    if (!Array.isArray(v)) return [];
    const out: ResearchedCompany[] = [];
    for (const raw of v) {
        const o = obj(raw);
        if (!o) continue;
        const name = str(o["name"]);
        const src = sources(o["sources"]);
        if (!name || src.length === 0) continue;
        const d = obj(o["draft_answers"]) ?? {};
        out.push({
            name,
            domain: str(o["domain"]) || null,
            whatTheyDo: str(o["what_they_do"]),
            signals: Array.isArray(o["signals"])
                ? (o["signals"] as unknown[]).map(signal).filter((x): x is ResearchSignal => x !== null)
                : [],
            fitMatches: strList(o["fit_matches"]),
            fitUnknowns: strList(o["fit_unknowns"]),
            whoToTarget: who(o["who_to_target"]),
            openingAngle: str(o["opening_angle"]),
            suggested: {
                targetFit: str(d["target_fit"]),
                wayIn: str(d["way_in"]),
                outreach: str(d["outreach"])
            },
            sources: src
        });
    }
    return out;
}

function budgetNote(v: unknown): string | null {
    const state = obj(v)?.["state"];
    if (state === "warn") return BUDGET_NOTES.warn;
    if (state === "throttled") return BUDGET_NOTES.throttled;
    return null;
}

// ─── Transport ─────────────────────────────────────────────────────

type Invoke = { ok: true; body: Record<string, unknown> } | { ok: false; error: string };

async function invoke(payload: Record<string, unknown>, opts: CallOptions): Promise<Invoke> {
    try {
        const sb = getSupabaseClient();
        const data = opts.data ?? createDataClient();
        const workspace = await data.currentWorkspace();
        if (!workspace) return { ok: false, error: RESEARCH_MESSAGES.noWorkspace };
        const { data: res, error } = await sb.functions.invoke(RESEARCH_FUNCTION, {
            body: { ...payload, workspaceId: workspace.id }
        });
        if (error) {
            reportError(error, { op: "prospecting-desk.research.invoke", action: String(payload["action"]) });
            return { ok: false, error: RESEARCH_MESSAGES.failed };
        }
        const body = obj(res);
        if (!body) return { ok: false, error: RESEARCH_MESSAGES.failed };
        if (body["ok"] !== true) {
            if (body["status"] === "paused") return { ok: false, error: RESEARCH_MESSAGES.paused };
            if (body["error"]) {
                reportError(new Error(String(body["error"])), { op: "prospecting-desk.research.result", action: String(payload["action"]) });
            }
            return { ok: false, error: RESEARCH_MESSAGES.failed };
        }
        return { ok: true, body };
    } catch (err) {
        reportError(err, { op: "prospecting-desk.research", action: String(payload["action"]) });
        const raw = err instanceof Error ? err.message : String(err);
        return {
            ok: false,
            error: /VITE_SUPABASE|Supabase client/i.test(raw)
                ? RESEARCH_MESSAGES.unavailable
                : RESEARCH_MESSAGES.failed
        };
    }
}

function base(ok: boolean, sample: boolean, error: string | null, note: string | null, now: number): BaseResult {
    return { ok, sample, error, budgetNote: note, ranAt: new Date(now).toISOString() };
}

// ─── Public API ────────────────────────────────────────────────────

export async function callFind(input: FindInput, opts: CallOptions = {}): Promise<FindResult> {
    const now = opts.now ?? Date.now();
    const description = input.description.trim();
    if (description.length < 3) {
        return { ...base(false, false, RESEARCH_MESSAGES.needDescription, null, now), companies: [] };
    }
    const sample = opts.sampleMode ?? useSampleResearch();
    if (sample) {
        const pool = sampleFindPool(detectDemoBook(), input.exclude ?? []);
        trackEvent("prospecting_research_find", { sample: true, results: pool.length });
        return {
            ...base(true, true, null, null, now),
            companies: pool.map((c) => ({
                name: c.name,
                domain: c.domain,
                whyFit: c.why,
                signal: sampleSignals(c, now)[0] ?? null,
                sources: sampleSources(c),
                whoToTarget: sampleWho(c),
                openingAngle: c.approach,
                confidence: sampleConfidence(c)
            }))
        };
    }
    const res = await invoke(
        {
            action: "find",
            description,
            icp: input.icp ?? "",
            focus: input.focus ?? "",
            exclude: [...(input.exclude ?? [])]
        },
        opts
    );
    if (!res.ok) return { ...base(false, false, res.error, null, now), companies: [] };
    const companies = parseFoundCompanies(res.body["companies"]);
    trackEvent("prospecting_research_find", { sample: false, results: companies.length });
    return { ...base(true, false, null, budgetNote(res.body["budget"]), now), companies };
}

export async function callResearch(input: ResearchInput, opts: CallOptions = {}): Promise<ResearchResult> {
    const now = opts.now ?? Date.now();
    const names = splitCompanyNames(input.companies.join(","));
    if (names.length === 0) {
        return { ...base(false, false, RESEARCH_MESSAGES.needNames, null, now), companies: [], notFound: [] };
    }
    if (names.length > MAX_RESEARCH_NAMES) {
        return { ...base(false, false, RESEARCH_MESSAGES.tooManyNames, null, now), companies: [], notFound: [] };
    }
    const sample = opts.sampleMode ?? useSampleResearch();
    if (sample) {
        const companies: ResearchedCompany[] = [];
        const notFound: string[] = [];
        for (const name of names) {
            const c = findSampleCompany(name);
            if (!c) {
                notFound.push(name);
                continue;
            }
            companies.push({
                name: c.name,
                domain: c.domain,
                whatTheyDo: `${c.name} is a ${c.industry} company with about ${c.employees} employees.`,
                signals: sampleSignals(c, now),
                fitMatches: c.signals.map((s) => s.detail),
                fitUnknowns: ["The demo has no information about their current tools, budget, or contract dates."],
                whoToTarget: sampleWho(c),
                openingAngle: c.approach,
                suggested: sampleSuggested(c),
                sources: sampleSources(c)
            });
        }
        trackEvent("prospecting_research_brief", { sample: true, results: companies.length });
        return { ...base(true, true, null, null, now), companies, notFound };
    }
    const res = await invoke(
        {
            action: "research",
            companies: names,
            description: input.description ?? "",
            icp: input.icp ?? "",
            focus: input.focus ?? ""
        },
        opts
    );
    if (!res.ok) return { ...base(false, false, res.error, null, now), companies: [], notFound: [] };
    const companies = parseResearchedCompanies(res.body["companies"]);
    const notFound = strList(res.body["not_found"]);
    trackEvent("prospecting_research_brief", { sample: false, results: companies.length });
    return { ...base(true, false, null, budgetNote(res.body["budget"]), now), companies, notFound };
}
