import { describe, expect, it } from "vitest";
import type { Row } from "@/lib/database-helpers";
import type { Signal } from "./types";
import {
    looksLikePersistedSignalId,
    rowsToSignals,
    rowToSignal,
    signalToInsert,
    signalToUpdate
} from "./signals-bridge";

const ACCOUNT_UUID = "11111111-2222-3333-4444-555555555555";
const SIGNAL_UUID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const NOW = "2026-05-22T12:00:00Z";

function makeRow(overrides: Partial<Row<"signals">> = {}): Row<"signals"> {
    return {
        id: SIGNAL_UUID,
        account_id: ACCOUNT_UUID,
        workspace_id: "w",
        signal_type: null,
        headline: null,
        source: null,
        url: null,
        published_date: null,
        fetched_at: null,
        captured_at: null,
        confidence: null,
        is_ai: false,
        flagged: false,
        note: null,
        data: {},
        created_at: NOW,
        updated_at: NOW,
        ...overrides
    };
}

// ─── looksLikePersistedSignalId ────────────────────────────────────────

describe("looksLikePersistedSignalId", () => {
    it("accepts real uuids", () => {
        expect(looksLikePersistedSignalId(SIGNAL_UUID)).toBe(true);
    });
    it("rejects legacy ids", () => {
        expect(looksLikePersistedSignalId("sig_123_abc")).toBe(false);
        expect(looksLikePersistedSignalId("")).toBe(false);
        expect(looksLikePersistedSignalId("not-a-uuid")).toBe(false);
    });
});

// ─── rowToSignal ───────────────────────────────────────────────────────

describe("rowToSignal", () => {
    it("hydrates a populated row", () => {
        const row = makeRow({
            signal_type: "funding",
            headline: "Acme raised $20M Series B",
            source: "TechCrunch",
            url: "https://example.com",
            published_date: "2026-05-15T00:00:00Z",
            confidence: 0.95,
            is_ai: true,
            flagged: false,
            note: "Worth a call"
        });
        const sig = rowToSignal(row);
        expect(sig).not.toBeNull();
        expect(sig!.id).toBe(SIGNAL_UUID);
        expect(sig!.type).toBe("funding");
        expect(sig!.headline).toBe("Acme raised $20M Series B");
        expect(sig!.confidence).toBe(0.95);
        expect(sig!.is_ai).toBe(true);
        expect(sig!.flagged).toBeUndefined(); // false → omitted
        expect(sig!.note).toBe("Worth a call");
    });

    it("returns null on missing id", () => {
        expect(rowToSignal({} as Row<"signals">)).toBeNull();
        expect(rowToSignal(null)).toBeNull();
        expect(rowToSignal(undefined)).toBeNull();
    });

    it("reads is_ai/flagged from data blob fallback", () => {
        const row = makeRow({
            is_ai: false,
            flagged: false,
            data: { is_ai: true, flagged: true }
        });
        const sig = rowToSignal(row);
        expect(sig!.is_ai).toBe(true);
        expect(sig!.flagged).toBe(true);
    });

    it("reads legacy `ai` alias from data blob", () => {
        const row = makeRow({ is_ai: false, data: { ai: true } });
        const sig = rowToSignal(row);
        expect(sig!.is_ai).toBe(true);
    });

    it("omits absent fields entirely instead of emitting null/undefined", () => {
        const sig = rowToSignal(makeRow());
        expect(sig).not.toBeNull();
        expect("headline" in sig!).toBe(false);
        expect("source" in sig!).toBe(false);
        expect("note" in sig!).toBe(false);
    });
});

// ─── rowsToSignals ─────────────────────────────────────────────────────

describe("rowsToSignals", () => {
    it("filters malformed rows silently", () => {
        const rows: ReadonlyArray<Row<"signals">> = [
            makeRow({ id: "" } as Partial<Row<"signals">>) as Row<"signals">,
            makeRow({ headline: "Real signal" }),
            makeRow({ id: "" } as Partial<Row<"signals">>) as Row<"signals">
        ];
        const sigs = rowsToSignals(rows);
        expect(sigs).toHaveLength(1);
        expect(sigs[0]!.headline).toBe("Real signal");
    });
});

// ─── signalToInsert ────────────────────────────────────────────────────

describe("signalToInsert", () => {
    it("packs canonical names into top-level columns", () => {
        const sig: Signal = {
            id: "sig_local_123",
            type: "funding",
            headline: "Acme raised $20M",
            source: "TC",
            confidence: 0.9,
            is_ai: true
        };
        const insert = signalToInsert(sig, ACCOUNT_UUID);
        expect(insert.account_id).toBe(ACCOUNT_UUID);
        expect(insert.signal_type).toBe("funding");
        expect(insert.headline).toBe("Acme raised $20M");
        expect(insert.source).toBe("TC");
        expect(insert.confidence).toBe(0.9);
        expect(insert.is_ai).toBe(true);
        expect(insert.flagged).toBe(false);
        expect(insert.id).toBeUndefined(); // legacy id → DB mints uuid
    });

    it("preserves the id when input is already a uuid (idempotency)", () => {
        const sig: Signal = { id: SIGNAL_UUID, headline: "x" };
        const insert = signalToInsert(sig, ACCOUNT_UUID);
        expect(insert.id).toBe(SIGNAL_UUID);
    });

    it("translates legacy fields (cat → type, title → headline, ai → is_ai)", () => {
        const sig: Signal = {
            id: "sig_1",
            cat: "hiring",
            title: "Acme posted 12 AI roles",
            ai: true
        };
        const insert = signalToInsert(sig, ACCOUNT_UUID);
        expect(insert.signal_type).toBe("hiring");
        expect(insert.headline).toBe("Acme posted 12 AI roles");
        expect(insert.is_ai).toBe(true);
    });

    it("derives flagged from status='flagged'", () => {
        const sig: Signal = { id: "sig_1", status: "flagged" };
        const insert = signalToInsert(sig, ACCOUNT_UUID);
        expect(insert.flagged).toBe(true);
    });

    it("stashes forward-compat fields in data blob", () => {
        const sig: Signal = {
            id: "sig_1",
            type: "funding",
            cat: "trigger", // differs from type → goes to data
            title: "X", // matches no headline → goes to data
            status: "draft" // non-flagged status → goes to data
        };
        const insert = signalToInsert(sig, ACCOUNT_UUID);
        const blob = insert.data as Record<string, unknown>;
        expect(blob.cat).toBe("trigger");
        expect(blob.title).toBe("X");
        expect(blob.status).toBe("draft");
    });

    it("does NOT stash matching aliases in data blob (avoid double-write)", () => {
        const sig: Signal = {
            id: "sig_1",
            type: "funding",
            cat: "funding", // matches type
            headline: "x",
            title: "x" // matches headline
        };
        const insert = signalToInsert(sig, ACCOUNT_UUID);
        const blob = insert.data as Record<string, unknown>;
        expect("cat" in blob).toBe(false);
        expect("title" in blob).toBe(false);
    });
});

// ─── signalToUpdate ────────────────────────────────────────────────────

describe("signalToUpdate", () => {
    it("emits patch fields for set values", () => {
        const sig: Signal = {
            id: SIGNAL_UUID,
            flagged: true,
            note: "Operator flagged"
        };
        const patch = signalToUpdate(sig);
        expect(patch.flagged).toBe(true);
        expect(patch.note).toBe("Operator flagged");
    });

    it("does not emit account_id (FK is immutable post-insert)", () => {
        const sig: Signal = { id: SIGNAL_UUID, flagged: true };
        const patch = signalToUpdate(sig);
        expect("account_id" in patch).toBe(false);
    });

    it("always emits is_ai + flagged (booleans default false; the row is patched)", () => {
        const sig: Signal = { id: SIGNAL_UUID };
        const patch = signalToUpdate(sig);
        expect(patch.is_ai).toBe(false);
        expect(patch.flagged).toBe(false);
    });
});
