import type {
    InsertRow,
    Json,
    Row,
    UpdateRow
} from "@/lib/database-helpers";
import type {
    Angle,
    Asset,
    Channel,
    CtaKey,
    Persona,
    Temperature,
    Touch,
    TouchOutcome,
    TriggerKey
} from "./types";

/**
 * Outbound Studio ↔ Supabase row bridge.
 *
 * Each outbound Touch becomes one row in the `sequences` table with
 * `sequence_key='outbound'`. Top-level columns: name (account name —
 * downstream rooms can join by name without unpacking JSON), title
 * (a short send-line summary). Editorial fields live inside `data`
 * jsonb so the in-memory Touch shape can evolve without a migration.
 *
 * Convention: a Touch.id IS the row id (uuid) once cloud-synced.
 * Legacy localStorage rows have non-uuid ids (e.g. "touch_1730…_x4z");
 * on first cloud sync those rows are inserted (Supabase generates a
 * uuid) and the Touch.id is rewritten to the new uuid before save
 * resolves.
 */

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const SEQUENCE_KEY_OUTBOUND = "outbound";
export const SEQUENCE_KEY_OUTBOUND_ANGLE = "outbound-angle";

export function looksLikePersistedId(id: string): boolean {
    return UUID_RE.test(id);
}

function asString(v: unknown): string {
    return typeof v === "string" ? v : "";
}

function asNumber(v: unknown): number {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
        const n = Number(v);
        if (Number.isFinite(n)) return n;
    }
    return 0;
}

function asObject(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : null;
}

const PERSONAS: ReadonlyArray<Persona> = ["csuite", "vp", "ic", "procurement"];
function asPersona(v: unknown, fallback: Persona = "vp"): Persona {
    return typeof v === "string" && PERSONAS.includes(v as Persona)
        ? (v as Persona)
        : fallback;
}

const TEMPERATURES: ReadonlyArray<Temperature> = [
    "ice_cold",
    "cool",
    "warm",
    "hot",
    "closing"
];
function asTemperature(
    v: unknown,
    fallback: Temperature = "cool"
): Temperature {
    return typeof v === "string" && TEMPERATURES.includes(v as Temperature)
        ? (v as Temperature)
        : fallback;
}

const TRIGGERS: ReadonlyArray<TriggerKey> = [
    "funding",
    "expansion",
    "hiring",
    "vendor",
    "cost",
    "product",
    "churn",
    "leadership",
    "tech",
    "compliance"
];
function asTrigger(v: unknown, fallback: TriggerKey = "funding"): TriggerKey {
    return typeof v === "string" && TRIGGERS.includes(v as TriggerKey)
        ? (v as TriggerKey)
        : fallback;
}

const CHANNELS: ReadonlyArray<Channel> = ["email", "linkedin", "call"];
function asChannel(v: unknown, fallback: Channel = "email"): Channel {
    return typeof v === "string" && CHANNELS.includes(v as Channel)
        ? (v as Channel)
        : fallback;
}

function asAsset(v: unknown, fallback: Asset = "none"): Asset {
    if (typeof v !== "string") return fallback;
    return v as Asset;
}

function asCta(v: unknown, fallback: CtaKey = "no_ask"): CtaKey {
    if (typeof v !== "string") return fallback;
    return v as CtaKey;
}

const TOUCH_OUTCOMES: ReadonlyArray<TouchOutcome> = [
    "sent",
    "no_response",
    "replied",
    "meeting_booked",
    "referred",
    "unsubscribed"
];
function asOutcome(v: unknown): TouchOutcome | null {
    if (typeof v !== "string") return null;
    return TOUCH_OUTCOMES.includes(v as TouchOutcome)
        ? (v as TouchOutcome)
        : null;
}

/**
 * Hydrate a Touch from a Supabase row. Returns null when the row is
 * malformed (missing id) so callers can `.filter(Boolean)`.
 */
export function rowToTouch(
    row:
        | Row<"sequences">
        | { id?: unknown; data?: unknown }
        | null
        | undefined
): Touch | null {
    if (!row || typeof row !== "object") return null;
    const r = row as Row<"sequences">;
    const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
    if (!id) return null;
    if (r.sequence_key !== SEQUENCE_KEY_OUTBOUND) return null;

    const data = asObject(r.data) ?? {};
    const accountName = asString(r.name) || asString(data["accountName"]);
    const createdAt = asString(r.created_at) || new Date().toISOString();

    return {
        id,
        account: asString(data["account"]) || accountName.toLowerCase(),
        accountName,
        contactName: asString(data["contactName"]),
        contactTitle: asString(data["contactTitle"]),
        persona: asPersona(data["persona"]),
        temperature: asTemperature(data["temperature"]),
        channel: asChannel(data["channel"]),
        trigger: asTrigger(data["trigger"]),
        ctaType: asCta(data["ctaType"]),
        assetUsed: asAsset(data["assetUsed"]),
        content: asString(r.title) || asString(data["content"]),
        outcome: asOutcome(data["outcome"]),
        outcomeDate: asString(data["outcomeDate"]) || null,
        dealId: asString(data["dealId"]) || null,
        qualityScore: asNumber(data["qualityScore"]),
        motionBand: asString(data["motionBand"]),
        createdAt
    };
}

export function rowsToTouches(
    rows: ReadonlyArray<Row<"sequences">>
): ReadonlyArray<Touch> {
    return rows.map(rowToTouch).filter((t): t is Touch => t !== null);
}

export function extractDataBlob(touch: Touch): Record<string, unknown> {
    return {
        account: touch.account,
        accountName: touch.accountName,
        contactName: touch.contactName,
        contactTitle: touch.contactTitle,
        persona: touch.persona,
        temperature: touch.temperature,
        channel: touch.channel,
        trigger: touch.trigger,
        ctaType: touch.ctaType,
        assetUsed: touch.assetUsed,
        content: touch.content,
        outcome: touch.outcome,
        outcomeDate: touch.outcomeDate,
        dealId: touch.dealId,
        qualityScore: touch.qualityScore,
        motionBand: touch.motionBand
    };
}

/** Build a short title from the touch's content (first line, ~80 chars). */
function deriveTitle(content: string): string {
    const trimmed = content.trim();
    if (!trimmed) return "Outbound touch";
    const firstLine = trimmed.split(/\r?\n/)[0]?.trim() ?? "";
    return firstLine.slice(0, 200) || "Outbound touch";
}

export function touchToInsert(touch: Touch): InsertRow<"sequences"> {
    const title = deriveTitle(touch.content);
    return {
        sequence_key: SEQUENCE_KEY_OUTBOUND,
        name: touch.accountName || title,
        title,
        data: extractDataBlob(touch) as Json
    };
}

export function touchToUpdate(touch: Touch): UpdateRow<"sequences"> {
    const title = deriveTitle(touch.content);
    return {
        sequence_key: SEQUENCE_KEY_OUTBOUND,
        name: touch.accountName || title,
        title,
        data: extractDataBlob(touch) as Json
    };
}

// ─── Angle (saved value-prop template) ─────────────────────────────────

/**
 * Hydrate an Angle from a `sequences` row tagged
 * sequence_key='outbound-angle'. Returns null when the row is wrong
 * kind / malformed.
 */
export function rowToAngle(
    row:
        | Row<"sequences">
        | { id?: unknown; data?: unknown }
        | null
        | undefined
): Angle | null {
    if (!row || typeof row !== "object") return null;
    const r = row as Row<"sequences">;
    const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
    if (!id) return null;
    if (r.sequence_key !== SEQUENCE_KEY_OUTBOUND_ANGLE) return null;
    const data = asObject(r.data) ?? {};
    const company = asString(r.name) || asString(data["company"]);
    const savedAt = asString(r.created_at) || new Date().toISOString();
    return {
        id,
        company,
        trigger: asTrigger(data["trigger"]),
        persona: asPersona(data["persona"]),
        email: asString(r.title) || asString(data["email"]),
        temperature: asTemperature(data["temperature"]),
        channel: asChannel(data["channel"]),
        ctaType: asCta(data["ctaType"]),
        assetUsed: asAsset(data["assetUsed"]),
        qualityScore: asNumber(data["qualityScore"]),
        motionBand: asString(data["motionBand"]),
        nextMove: asString(data["nextMove"]),
        savedAt
    };
}

export function rowsToAngles(
    rows: ReadonlyArray<Row<"sequences">>
): ReadonlyArray<Angle> {
    return rows.map(rowToAngle).filter((a): a is Angle => a !== null);
}

export function extractAngleDataBlob(angle: Angle): Record<string, unknown> {
    return {
        company: angle.company,
        trigger: angle.trigger,
        persona: angle.persona,
        email: angle.email,
        temperature: angle.temperature,
        channel: angle.channel,
        ctaType: angle.ctaType,
        assetUsed: angle.assetUsed,
        qualityScore: angle.qualityScore,
        motionBand: angle.motionBand,
        nextMove: angle.nextMove
    };
}

function deriveAngleTitle(email: string): string {
    const trimmed = email.trim();
    if (!trimmed) return "Saved angle";
    const firstLine = trimmed.split(/\r?\n/)[0]?.trim() ?? "";
    return firstLine.slice(0, 200) || "Saved angle";
}

export function angleToInsert(angle: Angle): InsertRow<"sequences"> {
    const title = deriveAngleTitle(angle.email);
    return {
        sequence_key: SEQUENCE_KEY_OUTBOUND_ANGLE,
        name: angle.company || title,
        title,
        data: extractAngleDataBlob(angle) as Json
    };
}

export function angleToUpdate(angle: Angle): UpdateRow<"sequences"> {
    const title = deriveAngleTitle(angle.email);
    return {
        sequence_key: SEQUENCE_KEY_OUTBOUND_ANGLE,
        name: angle.company || title,
        title,
        data: extractAngleDataBlob(angle) as Json
    };
}
