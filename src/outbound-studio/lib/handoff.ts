import type {
    OperatorRack,
    Persona,
    Temperature,
    TriggerKey
} from "./types";
import { PERSONAS, TEMPERATURES, TRIGGER_KEYS } from "./types";

/**
 * Phase 4 / Room 6 Wave 5 — cross-room handoff helpers.
 *
 * Faithful port of the legacy `buildOutboundRoomHref(href, focusObject,
 * roomLabel)` (lines 955-959 of `app/outbound-studio/index.html`).
 * Builds the deep-link URL with the canonical continuity params.
 *
 * Per CLAUDE.md §2: these params are "the continuity plumbing — do
 * not break them." Every consumer-side room reads them to render the
 * "Back to Outbound Studio" affordance + restore the focused object.
 */

export interface HandoffOptions {
    readonly href: string;
    readonly focusObject: string;
    readonly roomLabel: string;
    readonly extra?: Readonly<Record<string, string>>;
}

export function buildOutboundRoomHref({
    href,
    focusObject,
    roomLabel,
    extra
}: HandoffOptions): string {
    const [path, existingQs] = href.split("?");
    const params = new URLSearchParams(existingQs ?? "");
    params.set("returnTo", "/app/outbound-studio/");
    params.set("returnLabel", "Back to Outbound Studio");
    if (focusObject) params.set("focusObject", focusObject);
    if (roomLabel) params.set("focusRoom", roomLabel);
    params.set("fromMode", "room");
    params.set("fromSurface", "outbound-studio");
    if (extra) {
        for (const [k, v] of Object.entries(extra)) {
            if (v !== undefined && v !== null && v !== "") params.set(k, v);
        }
    }
    return `${path}?${params.toString()}`;
}

export function hrefToSignalConsole(focus: string): string {
    return buildOutboundRoomHref({
        href: "/app/signal-console/",
        focusObject: focus,
        roomLabel: "Signal Console"
    });
}

export function hrefToLinkedInPlaybook(focus: string): string {
    return buildOutboundRoomHref({
        href: "/app/linkedin-playbook/",
        focusObject: focus,
        roomLabel: "LinkedIn Playbook"
    });
}

export function hrefToColdCallStudio(focus: string): string {
    return buildOutboundRoomHref({
        href: "/app/cold-call-studio/",
        focusObject: focus,
        roomLabel: "Cold Call Studio"
    });
}

// ─── URL inbound ──────────────────────────────────────────────────────

const PERSONA_SET: ReadonlySet<string> = new Set(PERSONAS);
const TEMP_SET: ReadonlySet<string> = new Set(TEMPERATURES);
const TRIGGER_SET: ReadonlySet<string> = new Set(TRIGGER_KEYS);

/**
 * Read the inbound URL params (`?account=`, `?temperature=`,
 * `?trigger=`, `?persona=`) and return a partial rack patch. Other
 * rooms (Signal Console, Future Autopsy, etc.) route IN with these
 * params per their handoff helpers.
 *
 * Pure: accepts the search string for tests.
 */
export function readInboundRack(
    search: string = typeof window !== "undefined" ? window.location.search : ""
): Partial<OperatorRack> {
    const out: {
        -readonly [K in keyof OperatorRack]?: OperatorRack[K];
    } = {};
    try {
        const p = new URLSearchParams(search);
        const account = p.get("account");
        if (account && account.length > 0) out.accountName = account;
        const temp = p.get("temperature");
        if (temp && TEMP_SET.has(temp)) out.temperature = temp as Temperature;
        const trigger = p.get("trigger");
        if (trigger && TRIGGER_SET.has(trigger))
            out.trigger = trigger as TriggerKey;
        const persona = p.get("persona");
        if (persona && PERSONA_SET.has(persona))
            out.persona = persona as Persona;
    } catch {
        // ignore malformed search
    }
    return out;
}
