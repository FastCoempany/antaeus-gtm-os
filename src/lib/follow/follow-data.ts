import type { Account, Signal } from "@/signal-console/lib/types";
import { heat as computeHeat, heatBand } from "@/signal-console/lib/heat";
import { STAGE_LABELS, STAGE_ORDER, type Deal, type StageId } from "@/deal-workspace/lib/deal-shape";
import { assessDeal, type RecoveryAssessment } from "@/deal-workspace/lib/recovery";

/**
 * Follow the Object — the data read (G9, founder-locked 2026-07-13).
 *
 * Canon §2 requires every sacred noun to expose, at any surface: current
 * state, pressure on it, best next move, what changes downstream, and
 * what the system remembers. This module assembles that read for one
 * account/deal name from the cross-room localStorage mirrors the rooms
 * already publish (the same substrate the Dashboard aggregator and the
 * birdseye ranker read). Pure + storage-injectable; never throws.
 */

export type FollowStopState = "quiet" | "here" | "next";

export interface FollowStop {
    readonly key: string;
    readonly label: string;
    readonly what: string;
    readonly href: string;
    readonly state: FollowStopState;
}

export interface FollowMove {
    readonly label: string;
    readonly detail: string;
    readonly href: string;
}

export interface FollowRead {
    readonly name: string;
    /** Where it stands. */
    readonly stands: string;
    /** What's pulling on it. */
    readonly pulling: string;
    /** The one move — the only orange on the card. */
    readonly move: FollowMove | null;
    /** What changes downstream if you act. */
    readonly changes: string;
    /** What the system remembers. */
    readonly remembered: string;
    readonly stops: ReadonlyArray<FollowStop>;
}

interface StorageLike {
    getItem(key: string): string | null;
}

export interface FollowOptions {
    readonly storage?: StorageLike | null;
    readonly now?: number;
    /** Current pathname — marks the "you are here" stop + returnTo. */
    readonly herePath?: string;
    /** Label for the back-pill on the destination room. */
    readonly hereLabel?: string;
}

// ─── defensive parsing ────────────────────────────────────────────────

function getStorage(s?: StorageLike | null): StorageLike | null {
    if (s !== undefined) return s;
    if (typeof localStorage === "undefined") return null;
    return localStorage;
}

function safeParse(raw: string | null): unknown {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

function str(v: unknown): string | undefined {
    return typeof v === "string" && v.trim() !== "" ? v : undefined;
}

function num(v: unknown): number {
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function sameName(a: string | undefined, b: string): boolean {
    return (a ?? "").trim().toLowerCase() === b.trim().toLowerCase();
}

// ─── per-source readers ───────────────────────────────────────────────

function readAccount(
    storage: StorageLike,
    name: string
): { account: Account; heat: number; band: string; topSignal: string | null; signalCount: number } | null {
    const root = asObject(safeParse(storage.getItem("gtmos_sc_v4")));
    const rows = Array.isArray(root?.accounts) ? (root!.accounts as ReadonlyArray<unknown>) : [];
    for (const raw of rows) {
        const o = asObject(raw);
        if (!o) continue;
        const accName = str(o.name) ?? str(o.account_name);
        if (!accName || !sameName(accName, name)) continue;
        const signals = Array.isArray(o.signals)
            ? (o.signals.filter((s) => asObject(s)) as ReadonlyArray<Signal>)
            : [];
        const account = {
            id: str(o.id) ?? accName,
            name: accName,
            signals
        } as Account;
        const h = computeHeat(account);
        const top = signals.length > 0 ? asObject(signals[0]) : null;
        return {
            account,
            heat: h,
            band: heatBand(h),
            topSignal: top ? (str(top.headline) ?? str(top.title) ?? null) : null,
            signalCount: signals.length
        };
    }
    return null;
}

function sanitizeStage(v: unknown): StageId {
    return typeof v === "string" && v in STAGE_LABELS ? (v as StageId) : "prospect";
}

function readDeal(storage: StorageLike, name: string): Deal | null {
    const parsed = safeParse(storage.getItem("gtmos_deal_workspaces"));
    const rows = Array.isArray(parsed)
        ? parsed
        : asObject(parsed) && Array.isArray((parsed as Record<string, unknown>).deals)
          ? ((parsed as Record<string, unknown>).deals as ReadonlyArray<unknown>)
          : asObject(parsed)
            ? Object.values(parsed as Record<string, unknown>)
            : [];
    let fallback: Deal | null = null;
    for (const raw of rows) {
        const o = asObject(raw);
        if (!o) continue;
        const accName = str(o.accountName) ?? str(o.account_name) ?? str(o.name);
        if (!accName || !sameName(accName, name)) continue;
        const deal = {
            id: str(o.id) ?? accName,
            accountName: accName,
            value: num(o.value),
            stage: sanitizeStage(o.stage),
            nextStep: str(o.nextStep) ?? str(o.next_step),
            nextStepDate: str(o.nextStepDate) ?? str(o.next_step_date),
            closeDate: str(o.closeDate) ?? str(o.close_date),
            champion: str(o.champion),
            economicBuyer: str(o.economicBuyer) ?? str(o.economic_buyer),
            created_at: str(o.created_at) ?? str(o.createdAt),
            updated_at: str(o.updated_at) ?? str(o.updatedAt)
        } as Deal;
        if (deal.stage !== "closed-won" && deal.stage !== "closed-lost") return deal;
        fallback = fallback ?? deal;
    }
    return fallback;
}

interface TouchRead {
    readonly count: number;
    readonly lastOutcome: string | null;
    readonly meetingBooked: boolean;
    readonly replied: boolean;
}

function readTouches(storage: StorageLike, name: string): TouchRead {
    const root = asObject(safeParse(storage.getItem("gtmos_outbound_touches")));
    const rows = Array.isArray(root?.touches) ? (root!.touches as ReadonlyArray<unknown>) : [];
    let count = 0;
    let lastOutcome: string | null = null;
    let meetingBooked = false;
    let replied = false;
    for (const raw of rows) {
        const o = asObject(raw);
        if (!o) continue;
        const accName = str(o.accountName) ?? str(o.account);
        if (!accName || !sameName(accName, name)) continue;
        count++;
        const outcome = str(o.outcome) ?? null;
        if (outcome) lastOutcome = outcome;
        if (outcome === "meeting_booked") meetingBooked = true;
        if (outcome === "replied" || outcome === "meeting_booked") replied = true;
    }
    return { count, lastOutcome, meetingBooked, replied };
}

function readAdvisors(storage: StorageLike, name: string): ReadonlyArray<string> {
    const root = asObject(safeParse(storage.getItem("gtmos_advisor_registry")));
    const rows = Array.isArray(root?.advisors) ? (root!.advisors as ReadonlyArray<unknown>) : [];
    const target = name.trim().toLowerCase();
    const out: string[] = [];
    for (const raw of rows) {
        const o = asObject(raw);
        if (!o) continue;
        const advisorName = str(o.name);
        if (!advisorName) continue;
        const companies = Array.isArray(o.companies) ? o.companies : [];
        const carries = companies.some((c) => {
            const cs = typeof c === "string" ? c.trim().toLowerCase() : "";
            return cs !== "" && (cs.includes(target) || target.includes(cs));
        });
        if (carries) out.push(advisorName);
    }
    return out;
}

// ─── composition ──────────────────────────────────────────────────────

function money(value: number): string {
    if (value >= 1000) return `$${Math.round(value / 1000)}k`;
    return `$${Math.round(value)}`;
}

function followHref(
    path: string,
    name: string,
    herePath: string,
    hereLabel: string,
    extra?: Record<string, string>
): string {
    const params = new URLSearchParams();
    params.set("focusObject", name);
    params.set("returnTo", herePath);
    params.set("returnLabel", hereLabel);
    params.set("fromMode", "room");
    params.set("fromSurface", "follow");
    if (extra) {
        for (const [k, v] of Object.entries(extra)) params.set(k, v);
    }
    return `${path}?${params.toString()}`;
}

const OUTCOME_LABEL: Record<string, string> = {
    sent: "sent, no reply yet",
    no_response: "no reply",
    replied: "they replied",
    meeting_booked: "a meeting got booked",
    referred: "they referred you onward",
    unsubscribed: "they opted out"
};

export function buildFollowRead(name: string, opts: FollowOptions = {}): FollowRead | null {
    const storage = getStorage(opts.storage);
    const clean = name.trim();
    if (!storage || clean === "") return null;

    const herePath =
        opts.herePath ?? (typeof location !== "undefined" ? location.pathname : "/");
    const hereLabel = opts.hereLabel ?? "Back";

    const acct = readAccount(storage, clean);
    const deal = readDeal(storage, clean);
    if (!acct && !deal) return null;

    const assessment: RecoveryAssessment | null = deal ? assessDeal(deal) : null;
    const touches = readTouches(storage, clean);
    const advisors = readAdvisors(storage, clean);
    const href = (path: string, extra?: Record<string, string>) =>
        followHref(path, clean, herePath, hereLabel, extra);

    // Where it stands.
    const stands = deal
        ? `${money(deal.value)} · ${STAGE_LABELS[deal.stage]}${
              deal.nextStepDate
                  ? ` · next step ${deal.nextStepDate}`
                  : " · no dated next step"
          }`
        : `Watched in Signal Console · heat ${acct!.heat} (${acct!.band})`;

    // What's pulling.
    const pulling =
        assessment && assessment.causes.length > 0
            ? assessment.causes.slice(0, 2).join(" · ")
            : acct?.topSignal
              ? `Newest signal: ${acct.topSignal}`
              : "Nothing pulling right now.";

    // The one move + where it runs.
    const atTerms = deal ? deal.stage === "negotiation" || deal.stage === "verbal" : false;
    let nextStopKey: string;
    if (atTerms) nextStopKey = "getting-to-signed";
    else if (assessment && assessment.lane !== "healthy") nextStopKey = "deal-workspace";
    else if (!deal && acct) nextStopKey = "outbound-studio";
    else if (deal && (deal.stage === "prospect" || deal.stage === "discovery"))
        nextStopKey = "discovery-studio";
    else nextStopKey = "deal-workspace";

    const moveHref =
        nextStopKey === "getting-to-signed"
            ? href("/getting-to-signed/", deal ? { deal: deal.id } : undefined)
            : nextStopKey === "outbound-studio"
              ? href("/outbound-studio/", { account: clean })
              : nextStopKey === "discovery-studio"
                ? href("/discovery-studio/")
                : href("/deal-workspace/");

    const move: FollowMove | null = assessment
        ? {
              label: assessment.nextMove,
              detail: atTerms
                  ? "Terms are live — run it from Getting to Signed."
                  : "The smallest thing that changes the read.",
              href: moveHref
          }
        : acct
          ? {
                label: "Turn the heat into a first conversation.",
                detail: acct.topSignal
                    ? `Open with what just happened: ${acct.topSignal}`
                    : "Compose the first message while the account is warm.",
                href: href("/outbound-studio/", { account: clean })
            }
          : null;

    // What changes downstream.
    const changes = assessment
        ? assessment.lane === "critical"
            ? `Act and ${clean} comes off the slipping list — the close date holds.`
            : assessment.lane === "at-risk"
              ? "Act and this deal is back at a healthy pace."
              : "Nothing is decaying today — acting keeps it that way."
        : "Reach out while the signal is fresh — heat fades week by week.";

    // What the system remembers.
    const rememberedParts: string[] = [];
    if (deal?.champion) rememberedParts.push(`Champion ${deal.champion}`);
    if (deal?.economicBuyer) rememberedParts.push(`${deal.economicBuyer} signs off`);
    if (touches.count > 0)
        rememberedParts.push(`${touches.count} ${touches.count === 1 ? "touch" : "touches"} logged`);
    if (acct && acct.signalCount > 0)
        rememberedParts.push(`${acct.signalCount} ${acct.signalCount === 1 ? "signal" : "signals"} on file`);
    if (advisors.length > 0) rememberedParts.push(`${advisors[0]} carries weight here`);
    const remembered =
        rememberedParts.length > 0
            ? rememberedParts.join(" · ")
            : "Everything logged so far rides along — nothing needs restating.";

    // The thread stops.
    const pastDiscovery = deal ? STAGE_ORDER[deal.stage] > STAGE_ORDER.discovery : false;
    const stopDefs: ReadonlyArray<{ key: string; label: string; path: string; what: string; extra?: Record<string, string> }> = [
        {
            key: "signal-console",
            label: "Signal Console",
            path: "/signal-console/",
            what: acct
                ? `Heat ${acct.heat} · ${acct.signalCount} ${acct.signalCount === 1 ? "signal" : "signals"}${
                      acct.topSignal ? ` · newest: ${acct.topSignal}` : ""
                  }`
                : "Not watched yet — add the account to start building heat."
        },
        {
            key: "outbound-studio",
            label: "Outbound Studio",
            path: "/outbound-studio/",
            what:
                touches.count > 0
                    ? `${touches.count} ${touches.count === 1 ? "touch" : "touches"}${
                          touches.lastOutcome
                              ? ` · last: ${OUTCOME_LABEL[touches.lastOutcome] ?? touches.lastOutcome}`
                              : ""
                      }`
                    : "No outreach logged yet — the first message starts here.",
            extra: { account: clean }
        },
        {
            key: "discovery-studio",
            label: "Discovery Studio",
            path: "/discovery-studio/",
            what:
                touches.meetingBooked || pastDiscovery
                    ? "A meeting happened — prep and run the next call from here."
                    : "No discovery call on file yet."
        },
        {
            key: "deal-workspace",
            label: "Deal Workspace",
            path: "/deal-workspace/",
            what: deal
                ? `${money(deal.value)} · ${STAGE_LABELS[deal.stage]} · ${
                      deal.nextStep ? deal.nextStep : "no next step set"
                  }`
                : "No live deal yet — a booked meeting creates one."
        },
        {
            key: "getting-to-signed",
            label: "Getting to Signed",
            path: "/getting-to-signed/",
            what: atTerms
                ? "Terms are live — the run to signature happens here."
                : deal
                  ? "Not at terms yet."
                  : "Comes into play once a deal reaches terms.",
            extra: deal ? { deal: deal.id } : undefined
        },
        {
            key: "call-in-a-favor",
            label: "Call in a Favor",
            path: "/call-in-a-favor/",
            what:
                advisors.length > 0
                    ? `${advisors[0]} carries weight here — a favor is available.`
                    : "No one lined up who carries weight here yet."
        }
    ];

    const stops: FollowStop[] = stopDefs.map((s) => {
        const isHere = herePath.startsWith(s.path);
        const state: FollowStopState = isHere ? "here" : s.key === nextStopKey ? "next" : "quiet";
        return {
            key: s.key,
            label: s.label,
            what: s.what,
            href: href(s.path, s.extra),
            state
        };
    });

    return { name: clean, stands, pulling, move, changes, remembered, stops };
}
