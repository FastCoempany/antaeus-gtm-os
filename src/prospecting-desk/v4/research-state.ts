/**
 * State + actions for the Prospecting Desk "Find" stage: the cited web
 * search, research briefs, adding results to "Just added", and saved
 * searches that can be re-checked for new matches.
 *
 * Adding a company never answers the three qualification questions and
 * never moves it past "captured": research drafts are stored as
 * suggestions the seller must accept or edit (see ResearchDetail).
 */

import { signal, type Signal } from "@preact/signals";
import {
    prospects,
    queryCards,
    queryCardDraft,
    patchQueryCardDraft,
    setProspects,
    setQueryCards
} from "../state";
import type { Prospect, ProspectResearch, QueryCard } from "../lib/types";
import {
    callFind,
    callResearch,
    splitCompanyNames,
    type CallOptions,
    type FindResult,
    type FoundCompany,
    type ResearchedCompany,
    type ResearchResult
} from "../lib/research";
import {
    readIcpSummary,
    readActiveFocus,
    readSignalConsoleNames,
    suggestedDescription
} from "../lib/research-context";
import { saveProspect, saveQueryCard } from "../lib/cloud-persistence";
import { normalizeNameKey } from "./name-key";

export interface FindRun {
    readonly result: FindResult;
    /** Saved search this run came from, when it was a re-check. */
    readonly fromCardId: string | null;
    /** The saved search's previous check time, for "N new since {date}". */
    readonly since: string | null;
}

export const findBusy: Signal<boolean> = signal(false);
export const findRun: Signal<FindRun | null> = signal(null);
export const researchText: Signal<string> = signal("");
export const researchBusy: Signal<boolean> = signal(false);
export const researchRun: Signal<ResearchResult | null> = signal(null);

let prefilled = false;

/** Prefill the description box once from the territory group or ICP. */
export function prefillDescriptionOnce(inboundFocus: string): void {
    if (prefilled) return;
    prefilled = true;
    if (queryCardDraft.value.query.trim()) return;
    const text = suggestedDescription(inboundFocus);
    if (text) patchQueryCardDraft({ query: text });
}

/** Names already in the workspace: every Prospecting Desk company + Signal Console accounts. */
export function workspaceNames(): string[] {
    return [...prospects.value.map((p) => p.accountName), ...readSignalConsoleNames()];
}

function inWorkspace(name: string): boolean {
    const k = normalizeNameKey(name);
    return prospects.value.some((p) => normalizeNameKey(p.accountName) === k);
}

export function isAdded(name: string): boolean {
    return inWorkspace(name);
}

function context(inboundFocus: string): { icp: string; focus: string } {
    return { icp: readIcpSummary(), focus: inboundFocus.trim() || readActiveFocus() };
}

export async function runFind(
    inboundFocus: string,
    card: QueryCard | null = null,
    opts: CallOptions = {}
): Promise<FindResult | null> {
    if (findBusy.value) return null;
    const description = (card ? card.query : queryCardDraft.value.query).trim();
    findBusy.value = true;
    try {
        const result = await callFind(
            { description, ...context(inboundFocus), exclude: workspaceNames() },
            opts
        );
        findRun.value = { result, fromCardId: card?.id ?? null, since: card?.lastCheckedAt ?? null };
        if (card && result.ok) {
            const updated: QueryCard = {
                ...card,
                lastCheckedAt: result.ranAt,
                lastNewCount: result.companies.length,
                updatedAt: result.ranAt
            };
            setQueryCards(queryCards.value.map((c) => (c.id === card.id ? updated : c)));
            void saveQueryCard(updated);
        }
        return result;
    } finally {
        findBusy.value = false;
    }
}

export async function runResearch(
    inboundFocus: string,
    opts: CallOptions = {}
): Promise<ResearchResult | null> {
    if (researchBusy.value) return null;
    researchBusy.value = true;
    try {
        const result = await callResearch(
            {
                companies: splitCompanyNames(researchText.value),
                description: queryCardDraft.value.query,
                ...context(inboundFocus)
            },
            opts
        );
        researchRun.value = result;
        return result;
    } finally {
        researchBusy.value = false;
    }
}

function uid(now: number): string {
    return `pr_${now}_${Math.random().toString(36).slice(2, 7)}`;
}

function newProspect(name: string, research: ProspectResearch, sourceQueryId: string, now: number): Prospect {
    const iso = new Date(now).toISOString();
    return {
        id: uid(now),
        accountName: name,
        contactName: "",
        contactTitle: research.whoToTarget?.role ?? "",
        sourceQueryId,
        leverage: research.signals.length > 0 ? "market-signal" : "cold",
        // Always "captured": research never answers the qualification checks.
        stage: "captured",
        entryPoint: "",
        approach: "",
        notes: "",
        createdAt: iso,
        updatedAt: iso,
        webResearch: research
    };
}

function addProspect(p: Prospect): Prospect | null {
    if (inWorkspace(p.accountName)) return null;
    setProspects([...prospects.value, p]);
    void saveProspect(p);
    return p;
}

export function researchFromFound(c: FoundCompany, sample: boolean, now: number = Date.now()): ProspectResearch {
    return {
        kind: "find",
        researchedAt: new Date(now).toISOString(),
        summary: c.whyFit,
        domain: c.domain,
        signals: c.signal ? [c.signal] : [],
        sources: c.sources,
        whoToTarget: c.whoToTarget,
        openingAngle: c.openingAngle,
        confidence: c.confidence,
        fitMatches: [],
        fitUnknowns: [],
        suggested: null,
        sample
    };
}

export function researchFromBrief(c: ResearchedCompany, sample: boolean, now: number = Date.now()): ProspectResearch {
    const s = c.suggested;
    return {
        kind: "research",
        researchedAt: new Date(now).toISOString(),
        summary: c.whatTheyDo,
        domain: c.domain,
        signals: c.signals,
        sources: c.sources,
        whoToTarget: c.whoToTarget,
        openingAngle: c.openingAngle,
        confidence: null,
        fitMatches: c.fitMatches,
        fitUnknowns: c.fitUnknowns,
        suggested: s.targetFit || s.wayIn || s.outreach ? s : null,
        sample
    };
}

export function addFoundCompany(c: FoundCompany, now: number = Date.now()): Prospect | null {
    const run = findRun.value;
    return addProspect(
        newProspect(c.name, researchFromFound(c, run?.result.sample ?? false, now), run?.fromCardId ?? "", now)
    );
}

export function addAllFound(now: number = Date.now()): number {
    const run = findRun.value;
    if (!run) return 0;
    let n = 0;
    for (const c of run.result.companies) if (addFoundCompany(c, now)) n += 1;
    return n;
}

export function addResearchedCompany(c: ResearchedCompany, now: number = Date.now()): Prospect | null {
    const sample = researchRun.value?.sample ?? false;
    return addProspect(newProspect(c.name, researchFromBrief(c, sample, now), "", now));
}

/** Test-only. */
export function __resetResearchStateForTests(): void {
    findBusy.value = false;
    findRun.value = null;
    researchText.value = "";
    researchBusy.value = false;
    researchRun.value = null;
    prefilled = false;
}
