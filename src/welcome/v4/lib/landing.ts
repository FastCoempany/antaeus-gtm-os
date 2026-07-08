import { aggregateEngineInput } from "../../../dashboard/lib/snapshot-aggregator";
import { warmUpMissingSnapshots } from "../../../dashboard/lib/snapshot-warmup";
import {
    buildCommandObjects,
    summarizeCommandContext,
    explainCommandObject
} from "../../../dashboard/lib/command-intelligence";
import type { CommandObject } from "../../../dashboard/lib/types";
import { loadCounts, loadActivationContext } from "../../lib/loader";
import { buildWelcomeHref, hrefForActionDestination } from "../../lib/handoff";
import { t } from "@/lib/voice/t";

/**
 * Welcome landing model (canon §4.1) — the 2026-07 "flow's landing".
 *
 * Welcome is where the seeding flow LANDS: the workspace is already deep
 * (ICP + accounts + ≥10 deals + quota), so this is never an empty
 * threshold. The room reads the seeded workspace back: one commanding
 * statement, the system's one overnight pick (from the same command-
 * intelligence engine the Dashboard uses), the payback made visible as a
 * quiet "what the system saw" read, and a recessive operating line.
 *
 * Two lifecycles, one shape — day-one landing vs re-entry reuse the exact
 * same layout; only the headline changes. Never gamified, no finish line.
 *
 * All reads are defensive; every field degrades to a sane empty. Engines
 * are reused unchanged — this module is presentation wiring only.
 */

const SEEN_KEY = "gtmos_welcome_seen";

export type SawTone = "up" | "warn" | "due";

export interface SawRow {
    readonly tone: SawTone;
    readonly lead: string;
    readonly rest: string;
    readonly time: string;
}

export interface LandingMove {
    readonly title: string;
    readonly reason: string;
    readonly cta: string;
    readonly href: string;
}

export interface Landing {
    readonly lifecycle: "day_one" | "re_entry";
    readonly kicker: string;
    readonly headline: string;
    readonly sub: string;
    readonly move: LandingMove | null;
    readonly saw: ReadonlyArray<SawRow>;
    readonly operating: {
        readonly accounts: number;
        readonly deals: number;
        readonly inFlight: string | null;
    };
    readonly dashboardHref: string;
}

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

function getStorage(s?: StorageLike | null): StorageLike | null {
    if (s) return s;
    try {
        return typeof localStorage !== "undefined" ? localStorage : null;
    } catch {
        return null;
    }
}

/** Read a numeric field off the deal-workspace health snapshot. */
function readPipelineValue(store: StorageLike | null): number | null {
    if (!store) return null;
    try {
        const raw = store.getItem("gtmos_deal_workspace_health");
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { pipeline_value?: unknown };
        const v = parsed?.pipeline_value;
        return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
    } catch {
        return null;
    }
}

function formatMoney(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}m`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
    return `$${Math.round(n)}`;
}

/** Has the operator seen Welcome before (→ re-entry lifecycle)? */
export function hasSeenWelcome(s?: StorageLike | null): boolean {
    const store = getStorage(s);
    if (!store) return false;
    try {
        return store.getItem(SEEN_KEY) != null;
    } catch {
        return false;
    }
}

/** Mark Welcome seen so the next visit reads as re-entry. */
export function markWelcomeSeen(s?: StorageLike | null): void {
    const store = getStorage(s);
    if (!store) return;
    try {
        store.setItem(SEEN_KEY, new Date().toISOString());
    } catch {
        // non-fatal
    }
}

function toneForFamily(family: string): SawTone {
    if (family === "risk") return "warn";
    if (family === "system" || family === "icp") return "due";
    return "up";
}

/** Split an object's headline into a bold lead + plain rest for the read. */
function sawFromObject(o: CommandObject): SawRow {
    const because = explainCommandObject(o, "queue").copy.replace(/^Ranked here because\s*/i, "").replace(/^Visible because\s*/i, "");
    const timeMeta = (o.meta ?? []).find((m) => /\bday|week|hour|today|now\b/i.test(m));
    return {
        tone: toneForFamily(o.commandFamily),
        lead: o.title,
        rest: because ? `— ${because.replace(/\.$/, "")}` : "",
        time: timeMeta ? timeMeta.replace(/[^0-9a-z ]/gi, "").trim().slice(0, 6) || "now" : "now"
    };
}

export interface BuildLandingOptions {
    readonly storage?: StorageLike | null;
}

export function buildLanding(options: BuildLandingOptions = {}): Landing {
    const store = getStorage(options.storage as StorageLike | null);
    const counts = loadCounts(store as never);
    const activation = loadActivationContext(store as never);
    const reEntry = hasSeenWelcome(store);

    // Self-heal the deal/signal health snapshots from the raw seeded
    // nouns FIRST — the Dashboard does the same on boot
    // (warmUpMissingSnapshots), and the canonical onboarding→Welcome path
    // writes gtmos_signal_room_health but not gtmos_deal_workspace_health.
    // Without this, Welcome would only ever see outbound moves (no deal
    // risk cards) and could disagree with the Dashboard's pick. With it,
    // both surfaces read the same board.
    warmUpMissingSnapshots(store as never);

    // The one move + the reads come from the same engine (and now the
    // same warmed snapshots) the Dashboard uses, so Welcome and the
    // Dashboard agree about the pick.
    const engineInput = aggregateEngineInput({ storage: store as never });
    const objects = buildCommandObjects(engineInput);
    const summary = summarizeCommandContext(objects);
    const spotlight = summary.spotlight;

    let move: LandingMove | null = null;
    if (spotlight) {
        const primary =
            spotlight.actions.find((a) => a.variant !== "ghost") ?? spotlight.actions[0];
        const reasonBits = [
            explainCommandObject(spotlight, "spotlight").copy,
            spotlight.copy ?? spotlight.subtitle ?? ""
        ]
            .map((s) => (s ?? "").trim())
            .filter((s) => s.length > 0);
        move = {
            title: spotlight.title,
            reason: reasonBits.join(" ").slice(0, 260),
            cta: primary?.label ?? "Open the deal",
            href: primary?.href
                ? hrefForActionDestination(primary.href)
                : hrefForActionDestination("/deal-workspace/")
        };
    }

    // The reads: the next-ranked objects after the spotlight, so the
    // "what the system saw" list never repeats the one move.
    const rest = summary.ranked.filter((o) => o.id !== spotlight?.id).slice(0, 3);
    const saw: SawRow[] = rest.map(sawFromObject);

    const pipeline = readPipelineValue(store);
    const company = activation.companyName?.trim();
    const who = company && company.length > 0 ? ` · ${company}` : "";

    // The pick's noun follows the actual spotlight family, so the
    // commanding statement never promises "a deal" when the top move is
    // an outbound touch (risk family = a deal; everything else = a move).
    const pickNoun =
        spotlight?.commandFamily === "risk"
            ? t("the one deal that needs you first")
            : t("the first move that needs you");

    const kicker = reEntry
        ? t("Welcome back · what moved since you left")
        : t("You did the hard work — here's the first morning it pays back");

    const headline = reEntry
        ? move
            ? t("Here's what moved — and the one that needs you first.")
            : t("Welcome back. Here's where the workspace stands.")
        : move
          ? `${t("The workspace is awake. It already found")} ${pickNoun}.`
          : t("The workspace is awake.");

    // The seeded workspace is deep on the canonical path, but the
    // kill-switch / preview / re-run paths can reach a thin workspace —
    // never fabricate a dividend on 0 counts.
    const nothingSeeded = counts.deals === 0 && counts.accounts === 0;
    const sub = reEntry
        ? `${t("The system kept reading while you were gone — the heat, the silence, the next steps")}${who}. ${t("Here's the one move that clears the most weight today.")}`
        : nothingSeeded
          ? t("Your workspace is set up. As you add deals and accounts, the system reads them back to you here each morning — which deal is slipping, which move clears the most weight.")
          : `${t("You added")} ${counts.deals} ${counts.deals === 1 ? t("deal") : t("deals")} ${t("and")} ${counts.accounts} ${counts.accounts === 1 ? t("account") : t("accounts")}. ${t("Overnight the system read every one — the heat, the silence, the next steps — so you don't walk in cold. This is the dividend the setup promised, starting today.")}`;

    return {
        lifecycle: reEntry ? "re_entry" : "day_one",
        kicker,
        headline,
        sub,
        move,
        saw,
        operating: {
            accounts: counts.accounts,
            deals: counts.deals,
            inFlight: pipeline != null ? formatMoney(pipeline) : null
        },
        dashboardHref: buildWelcomeHref({
            href: "/dashboard/",
            focusObject: "",
            roomLabel: "Dashboard"
        })
    };
}
