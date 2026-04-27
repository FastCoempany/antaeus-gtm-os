import { reportError } from "@/lib/observability";
import {
    MAX_ANGLE_HISTORY,
    MAX_TOUCH_HISTORY,
    type Angle,
    type Asset,
    type Channel,
    type CtaKey,
    type Persona,
    type Temperature,
    type Touch,
    type TouchOutcome,
    type TriggerKey
} from "./types";

/**
 * Phase 4 / Room 6 Wave 4 — touch + angle persistence.
 *
 * Two storage keys, both already consumed by Phase 4 / Rooms 3 + 4 +
 * Dashboard's command-intelligence rail (`gtmos_outbound_touches`
 * specifically). Field shapes mirror the legacy writes so existing
 * data flows in without translation.
 *
 * Same defensive posture as Phase 4 / Rooms 1-5: malformed JSON →
 * empty list, hostile storage swallowed via reportError.
 */

export const TOUCHES_KEY = "gtmos_outbound_touches";
export const ANGLES_KEY = "gtmos_angles";

interface TouchesShape {
    readonly touches?: ReadonlyArray<unknown>;
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

function asString(v: unknown): string | undefined {
    return typeof v === "string" && v.length > 0 ? v : undefined;
}

function asNumber(v: unknown, fallback = 0): number {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
        const n = Number(v);
        if (Number.isFinite(n)) return n;
    }
    return fallback;
}

const VALID_PERSONAS = new Set(["csuite", "vp", "ic", "procurement"]);
const VALID_TEMPS = new Set(["ice_cold", "cool", "warm", "hot", "closing"]);
const VALID_CHANNELS = new Set(["email", "linkedin", "call"]);
const VALID_OUTCOMES = new Set([
    "sent",
    "no_response",
    "replied",
    "meeting_booked",
    "referred",
    "unsubscribed"
]);

// ─── Touch ────────────────────────────────────────────────────────────

function parseTouch(raw: unknown): Touch | null {
    const o = asObject(raw);
    if (!o) return null;
    const id = asString(o.id);
    if (!id) return null;
    const account =
        asString(o.account) ?? asString(o.accountName)?.toLowerCase() ?? "";
    if (!account) return null;
    const persona = (
        VALID_PERSONAS.has(String(o.persona)) ? o.persona : "vp"
    ) as Persona;
    const temperature = (
        VALID_TEMPS.has(String(o.temperature)) ? o.temperature : "cool"
    ) as Temperature;
    const channel = (
        VALID_CHANNELS.has(String(o.channel)) ? o.channel : "email"
    ) as Channel;
    const outcomeRaw = String(o.outcome ?? "");
    const outcome: TouchOutcome | null = VALID_OUTCOMES.has(outcomeRaw)
        ? (outcomeRaw as TouchOutcome)
        : null;
    return {
        id,
        account,
        accountName: asString(o.accountName) ?? account,
        contactName: asString(o.contactName) ?? "",
        contactTitle: asString(o.contactTitle) ?? "",
        persona,
        temperature,
        channel,
        trigger: (asString(o.trigger) ?? "funding") as TriggerKey,
        ctaType: (asString(o.ctaType) ?? "give_to_get") as CtaKey,
        assetUsed: (asString(o.assetUsed) ?? "none") as Asset,
        content: asString(o.content) ?? "",
        outcome,
        outcomeDate: asString(o.outcomeDate) ?? null,
        dealId: asString(o.dealId) ?? null,
        qualityScore: asNumber(o.qualityScore, 0),
        motionBand: asString(o.motionBand) ?? "thin",
        createdAt: asString(o.createdAt) ?? new Date().toISOString()
    };
}

export function loadTouches(
    storage: Pick<Storage, "getItem"> | null = typeof localStorage !== "undefined"
        ? localStorage
        : null
): ReadonlyArray<Touch> {
    if (!storage) return [];
    try {
        const raw = storage.getItem(TOUCHES_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        const root = asObject(parsed) as TouchesShape | null;
        const arr = Array.isArray(root?.touches) ? root!.touches! : [];
        return arr.map(parseTouch).filter((t): t is Touch => t !== null);
    } catch (err) {
        reportError(err, { op: "outbound-studio.loadTouches" });
        return [];
    }
}

export function saveTouches(
    touches: ReadonlyArray<Touch>,
    storage: Pick<Storage, "setItem"> | null = typeof localStorage !== "undefined"
        ? localStorage
        : null
): void {
    if (!storage) return;
    try {
        const capped = touches.slice(0, MAX_TOUCH_HISTORY);
        storage.setItem(TOUCHES_KEY, JSON.stringify({ touches: capped }));
    } catch (err) {
        reportError(err, { op: "outbound-studio.saveTouches" });
    }
}

// ─── Angle ────────────────────────────────────────────────────────────

function parseAngle(raw: unknown): Angle | null {
    const o = asObject(raw);
    if (!o) return null;
    const id = asString(o.id);
    const company = asString(o.company);
    if (!id || !company) return null;
    const persona = (
        VALID_PERSONAS.has(String(o.persona)) ? o.persona : "vp"
    ) as Persona;
    const temperature = (
        VALID_TEMPS.has(String(o.temperature)) ? o.temperature : "cool"
    ) as Temperature;
    const channel = (
        VALID_CHANNELS.has(String(o.channel)) ? o.channel : "email"
    ) as Channel;
    return {
        id,
        company,
        trigger: (asString(o.trigger) ?? "funding") as TriggerKey,
        persona,
        email: asString(o.email) ?? "",
        temperature,
        channel,
        ctaType: (asString(o.ctaType) ?? "give_to_get") as CtaKey,
        assetUsed: (asString(o.assetUsed) ?? "none") as Asset,
        qualityScore: asNumber(o.qualityScore, 0),
        motionBand: asString(o.motionBand) ?? "thin",
        nextMove: asString(o.nextMove) ?? "",
        savedAt: asString(o.savedAt) ?? new Date().toISOString()
    };
}

export function loadAngles(
    storage: Pick<Storage, "getItem"> | null = typeof localStorage !== "undefined"
        ? localStorage
        : null
): ReadonlyArray<Angle> {
    if (!storage) return [];
    try {
        const raw = storage.getItem(ANGLES_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(parseAngle).filter((a): a is Angle => a !== null);
    } catch (err) {
        reportError(err, { op: "outbound-studio.loadAngles" });
        return [];
    }
}

export function saveAngles(
    angles: ReadonlyArray<Angle>,
    storage: Pick<Storage, "setItem"> | null = typeof localStorage !== "undefined"
        ? localStorage
        : null
): void {
    if (!storage) return;
    try {
        const capped = angles.slice(0, MAX_ANGLE_HISTORY);
        storage.setItem(ANGLES_KEY, JSON.stringify(capped));
    } catch (err) {
        reportError(err, { op: "outbound-studio.saveAngles" });
    }
}
