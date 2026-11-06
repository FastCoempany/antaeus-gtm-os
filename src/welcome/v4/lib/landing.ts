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
 * Welcome landing model.
 *
 * Welcome summarizes the workspace after onboarding and on later visits:
 * the highest-priority recommended action, recent account/deal changes,
 * and basic workspace totals. It reuses the same ranking engine as the
 * Dashboard so both surfaces agree about priority.
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

export function hasSeenWelcome(s?: StorageLike | null): boolean {
    const store = getStorage(s);
    if (!store) return false;
    try {
        return store.getItem(SEEN_KEY) != null;
    } catch {
        return false;
    }
}

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

    // Keep the health snapshots current before ranking so Welcome and the
    // Dashboard evaluate the same workspace state.
    warmUpMissingSnapshots(store as never);

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

    // Show up to three additional ranked objects without repeating the
    // highest-priority recommendation.
    const rest = summary.ranked.filter((o) => o.id !== spotlight?.id).slice(0, 3);
    const saw: SawRow[] = rest.map(sawFromObject);

    const pipeline = readPipelineValue(store);
    const company = activation.companyName?.trim();
    const who = company && company.length > 0 ? ` · ${company}` : "";
    const body = { class: "body" } as const;

    const kicker = reEntry
        ? t("Welcome back", body)
        : t("Setup complete", body);

    const headline = reEntry
        ? move
            ? t("Your accounts and deals have been updated since your last visit.", body)
            : t("No new priority action is available right now.", body)
        : t("Antaeus analyzed the active deals and watched accounts in this workspace.", body);

    const nothingSeeded = counts.deals === 0 && counts.accounts === 0;
    const sub = reEntry
        ? `${t("Antaeus analyzed current account signals, buyer activity, and recorded next steps", body)}${who}. ${t("The current recommendation is ranked from that workspace data.", body)}`
        : nothingSeeded
          ? t("The workspace is ready. Add deals and watched accounts to generate ranked recommendations, deal-risk assessments, and account-priority analysis.", body)
          : `${t("This workspace contains", body)} ${counts.deals} ${counts.deals === 1 ? t("active deal", body) : t("active deals", body)} ${t("and", body)} ${counts.accounts} ${counts.accounts === 1 ? t("watched account", body) : t("watched accounts", body)}. ${t("Antaeus analyzed recent account signals, buyer activity, and recorded next steps to rank the current recommendations.", body)}`;

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
