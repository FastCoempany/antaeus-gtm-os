import { describe, expect, it } from "vitest";
import {
    accountKeyFromName,
    accountToInsert,
    accountToUpdate,
    extractDataBlob,
    looksLikePersistedId,
    rowToAccount,
    rowsToAccounts
} from "./sc-bridge";
import type { Account } from "./types";

const NOW = "2026-04-28T20:00:00.000Z";

function makeAccount(part: Partial<Account>): Account {
    return {
        id: "acc_legacy_1",
        name: "Acme",
        signals: [],
        ...part
    };
}

describe("looksLikePersistedId", () => {
    it("accepts uuids", () => {
        expect(
            looksLikePersistedId("11111111-2222-3333-4444-555555555555")
        ).toBe(true);
    });
    it("rejects legacy ids", () => {
        expect(looksLikePersistedId("acc_1730000000_x4z")).toBe(false);
        expect(looksLikePersistedId("")).toBe(false);
        expect(looksLikePersistedId("not-a-uuid")).toBe(false);
    });
});

describe("accountKeyFromName", () => {
    it("slugifies simple names", () => {
        expect(accountKeyFromName("Acme")).toBe("acme");
        expect(accountKeyFromName("Meridian Logistics")).toBe(
            "meridian-logistics"
        );
    });
    it("strips non-alphanumerics + collapses runs", () => {
        expect(accountKeyFromName("Foo & Bar / Baz!")).toBe("foo-bar-baz");
    });
    it("trims leading/trailing dashes", () => {
        expect(accountKeyFromName("--hello--")).toBe("hello");
    });
    it("falls back to placeholder when name is unusable", () => {
        expect(accountKeyFromName("")).toBe("untitled-account");
        expect(accountKeyFromName("!!!")).toBe("untitled-account");
    });
    it("caps at 64 chars", () => {
        const long = "a".repeat(100);
        expect(accountKeyFromName(long)).toHaveLength(64);
    });
});

describe("rowToAccount", () => {
    it("returns null for null/wrong-type input", () => {
        expect(rowToAccount(null)).toBeNull();
        expect(rowToAccount(undefined)).toBeNull();
    });

    it("returns null when id or name missing", () => {
        expect(rowToAccount({ id: "", account_name: "Acme" })).toBeNull();
        expect(rowToAccount({ id: "x", account_name: "" })).toBeNull();
    });

    it("hydrates top-level columns + data blob", () => {
        const row = {
            id: "uuid-1",
            user_id: "u",
            workspace_id: "w",
            account_key: "acme",
            account_name: "Acme",
            domain: "acme.com",
            ticker: "ACME",
            industry: "Logistics",
            sector: null,
            heat: 84,
            last_enriched_at: "2026-04-27T00:00:00Z",
            created_at: NOW,
            updated_at: NOW,
            data: {
                hq: "EU",
                employees: "200-500",
                tier: 2,
                approach: "warm intro",
                persona: "VP Ops",
                focus: "Expansion-driven",
                notes: "great fit",
                signals: [
                    {
                        id: "s1",
                        headline: "Series C raise",
                        confidence: 0.9,
                        published_date: "2026-04-26T00:00:00Z"
                    }
                ]
            }
        };
        const acc = rowToAccount(row as never);
        expect(acc).not.toBeNull();
        expect(acc!.id).toBe("uuid-1");
        expect(acc!.name).toBe("Acme");
        expect(acc!.ticker).toBe("ACME");
        expect(acc!.industry).toBe("Logistics");
        expect(acc!.tier).toBe(2);
        expect(acc!.approach).toBe("warm intro");
        expect(acc!.enrichedAt).toBe("2026-04-27T00:00:00Z");
        expect(acc!.signals).toHaveLength(1);
        expect(acc!.signals[0]!.headline).toBe("Series C raise");
    });

    it("ignores invalid tier values", () => {
        const row = {
            id: "x",
            account_name: "Acme",
            data: { tier: 99 }
        };
        const acc = rowToAccount(row as never);
        expect(acc!.tier).toBeUndefined();
    });

    it("hydrates with empty signals array when data.signals missing", () => {
        const row = { id: "x", account_name: "Acme", data: {} };
        const acc = rowToAccount(row as never);
        expect(acc!.signals).toEqual([]);
    });
});

describe("rowsToAccounts", () => {
    it("filters out malformed rows silently", () => {
        const rows = [
            { id: "ok", account_name: "Acme", data: {} },
            { id: "", account_name: "Bad" },
            null,
            { id: "no_name", account_name: "" }
        ];
        const out = rowsToAccounts(rows as never);
        expect(out).toHaveLength(1);
        expect(out[0]!.name).toBe("Acme");
    });
});

describe("accountToInsert", () => {
    it("derives account_key + drops legacy id", () => {
        const ins = accountToInsert(
            makeAccount({ id: "acc_legacy", name: "Meridian Logistics" })
        );
        // No id key on insert payload — Supabase generates the uuid
        expect((ins as { id?: string }).id).toBeUndefined();
        expect(ins.account_key).toBe("meridian-logistics");
        expect(ins.account_name).toBe("Meridian Logistics");
    });

    it("only includes set top-level columns", () => {
        const ins = accountToInsert(
            makeAccount({ name: "X", domain: "x.com" })
        );
        expect(ins.domain).toBe("x.com");
        expect((ins as { ticker?: string }).ticker).toBeUndefined();
    });

    it("packs editorial fields into data jsonb (signals omitted post-Step 5)", () => {
        const ins = accountToInsert(
            makeAccount({
                name: "Y",
                tier: 3,
                approach: "back-channel",
                signals: [{ id: "s1", headline: "hi" }]
            })
        );
        // Step 5 dropped signals from the blob — they live in the
        // `signals` Postgres table now (Step 2 / PR #140 schema).
        expect(ins.data).toEqual({
            tier: 3,
            approach: "back-channel"
        });
    });
});

describe("accountToUpdate", () => {
    it("clears top-level columns when undefined (so updates can null fields)", () => {
        const up = accountToUpdate(makeAccount({ name: "Z" }));
        expect(up.domain).toBeNull();
        expect(up.ticker).toBeNull();
        expect(up.industry).toBeNull();
        expect(up.last_enriched_at).toBeNull();
    });

    it("preserves set top-level columns", () => {
        const up = accountToUpdate(
            makeAccount({ name: "Z", industry: "FinTech" })
        );
        expect(up.industry).toBe("FinTech");
    });
});

describe("extractDataBlob", () => {
    // Step 5 (drop legacy): signals are NO LONGER included in the
    // data blob — they live in the `signals` Postgres table now
    // (canonical since Step 2 / PR #140). Tests updated below.
    it("includes only set fields; signals are NOT in the blob anymore", () => {
        const blob = extractDataBlob(makeAccount({ name: "X" }));
        expect(blob).toEqual({});
    });
    it("includes every set editorial field (signals omitted)", () => {
        const blob = extractDataBlob(
            makeAccount({
                name: "X",
                hq: "NY",
                employees: "10-50",
                tier: 1,
                focus: "Expansion",
                approach: "Cold",
                persona: "VP",
                notes: "x",
                signals: [{ id: "s1" }] // still present in-memory but dropped from blob
            })
        );
        expect(blob).toEqual({
            hq: "NY",
            employees: "10-50",
            tier: 1,
            focus: "Expansion",
            approach: "Cold",
            persona: "VP",
            notes: "x"
            // signals intentionally absent — they live in the
            // `signals` Postgres table, not in this jsonb blob.
        });
    });
});

describe("rowToAccount roundtrip", () => {
    it("preserves account fields through insert→hydrate (signals now live in `signals` table, post-Step 5)", () => {
        const original = makeAccount({
            id: "acc_legacy",
            name: "Meridian",
            domain: "meridian.com",
            industry: "Logistics",
            tier: 2,
            persona: "VP Ops",
            signals: [
                { id: "s1", headline: "EU expansion", confidence: 0.8 }
            ]
        });
        const insert = accountToInsert(original);
        const fakeRow = {
            id: "uuid-after-insert",
            account_key: insert.account_key,
            account_name: insert.account_name,
            domain: insert.domain ?? null,
            ticker: insert.ticker ?? null,
            industry: insert.industry ?? null,
            sector: null,
            heat: 0,
            last_enriched_at: insert.last_enriched_at ?? null,
            data: insert.data,
            created_at: NOW,
            updated_at: NOW
        };
        const back = rowToAccount(fakeRow as never);
        expect(back).not.toBeNull();
        expect(back!.id).toBe("uuid-after-insert");
        expect(back!.name).toBe("Meridian");
        expect(back!.industry).toBe("Logistics");
        expect(back!.tier).toBe(2);
        expect(back!.persona).toBe("VP Ops");
        // Step 5: signals no longer roundtrip via the blob — extractDataBlob
        // doesn't include them. The signals[] array is hydrated separately
        // from the `signals` table via loadSignalsForAccounts at boot.
        // For accounts written under the new code, the blob has no
        // `signals` key → in-memory signals[] is empty.
        expect(back!.signals).toEqual([]);
    });

    it("STILL hydrates signals from a legacy blob row (back-compat for pre-Step 5 data)", () => {
        // Legacy rows written before Step 5 have signals nested under
        // data.signals[]. rowToAccount keeps reading them so the room
        // works across the deploy boundary.
        const legacyRow = {
            id: "uuid",
            account_key: "meridian",
            account_name: "Meridian",
            domain: null,
            ticker: null,
            industry: null,
            sector: null,
            heat: 0,
            last_enriched_at: null,
            data: {
                tier: 2,
                signals: [{ id: "s1", headline: "Pre-Step-5 signal" }]
            },
            created_at: NOW,
            updated_at: NOW
        };
        const back = rowToAccount(legacyRow as never);
        expect(back!.signals).toHaveLength(1);
        expect(back!.signals[0]!.headline).toBe("Pre-Step-5 signal");
    });
});
