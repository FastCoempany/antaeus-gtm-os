import { describe, expect, it } from "vitest";
import {
    blobToLegacyDealArray,
    dbRowToDeal,
    dealToDbWrite,
    legacyDealToDeal,
    rowsToDeals
} from "./deal-bridge";

describe("legacyDealToDeal", () => {
    it("returns sensible defaults for empty input", () => {
        const d = legacyDealToDeal(null, "fallback");
        expect(d.id).toBe("fallback");
        expect(d.accountName).toBe("");
        expect(d.value).toBe(0);
        expect(d.stage).toBe("prospect");
    });

    it("maps a typical legacy item with snake_case + camelCase fields", () => {
        const d = legacyDealToDeal({
            id: "deal-1",
            accountName: "Acme",
            value: 50000,
            stage: "evaluation",
            nextStep: "Call CFO",
            nextStepDate: "2026-05-01",
            momentum: "neutral",
            champion: "Jane",
            stakeholders: [{ name: "Pat", role: "champion", engaged: true }]
        });
        expect(d.id).toBe("deal-1");
        expect(d.accountName).toBe("Acme");
        expect(d.value).toBe(50000);
        expect(d.stage).toBe("evaluation");
        expect(d.nextStep).toBe("Call CFO");
        expect(d.nextStepDate).toBe("2026-05-01");
        expect(d.momentum).toBe("neutral");
        expect(d.champion).toBe("Jane");
        expect(d.stakeholders).toHaveLength(1);
        expect(d.stakeholders?.[0]?.role).toBe("champion");
    });

    it("falls back gracefully on invalid stage / momentum / loss reason", () => {
        const d = legacyDealToDeal({
            id: "x",
            stage: "not-a-stage",
            momentum: "garbage",
            lossReason: "made-up"
        });
        expect(d.stage).toBe("prospect");
        expect(d.momentum).toBeUndefined();
        expect(d.lossReason).toBeUndefined();
    });

    it("filters malformed stakeholders", () => {
        const d = legacyDealToDeal({
            id: "x",
            stakeholders: [
                { name: "Real Person", role: "champion" },
                { role: "eb" }, // no name
                "not-an-object",
                null
            ]
        });
        expect(d.stakeholders).toHaveLength(1);
        expect(d.stakeholders?.[0]?.name).toBe("Real Person");
    });
});

describe("dbRowToDeal", () => {
    it("maps column data + jsonb back into the flat shape", () => {
        const row = {
            id: "row-1",
            account_name: "Acme",
            stage: "negotiation",
            deal_value: 100000,
            close_date: "2026-06-01",
            next_step_date: "2026-05-15",
            forecast_category: "commit",
            loss_reason: null,
            data: {
                nextStep: "Send proposal",
                champion: "Jane",
                momentum: "strong"
            },
            created_at: "2026-04-01T00:00:00Z",
            updated_at: "2026-04-25T00:00:00Z"
        };
        const d = dbRowToDeal(row);
        expect(d.id).toBe("row-1");
        expect(d.accountName).toBe("Acme");
        expect(d.value).toBe(100000);
        expect(d.stage).toBe("negotiation");
        expect(d.closeDate).toBe("2026-06-01");
        expect(d.nextStepDate).toBe("2026-05-15");
        expect(d.forecastCategory).toBe("commit");
        expect(d.lossReason).toBeUndefined();
        expect(d.nextStep).toBe("Send proposal");
        expect(d.champion).toBe("Jane");
        expect(d.momentum).toBe("strong");
    });

    it("handles missing data jsonb without throwing", () => {
        const d = dbRowToDeal({
            id: "row-2",
            account_name: "Beta Co",
            stage: "discovery",
            deal_value: 25000
        });
        expect(d.id).toBe("row-2");
        expect(d.nextStep).toBeUndefined();
    });
});

describe("blobToLegacyDealArray", () => {
    it("returns null for non-blob rows", () => {
        expect(blobToLegacyDealArray({ data: { migration_version: "other" } })).toBeNull();
        expect(blobToLegacyDealArray({ data: {} })).toBeNull();
        expect(blobToLegacyDealArray(null)).toBeNull();
    });

    it("extracts the gtmos_deal_workspaces array from a Phase 2.3 blob", () => {
        const arr = [
            { id: "a", accountName: "A" },
            { id: "b", accountName: "B" }
        ];
        const result = blobToLegacyDealArray({
            id: "blob-row",
            data: {
                migration_version: "phase-2.3-passthrough",
                migrated_from_localstorage: {
                    gtmos_deal_workspaces: arr
                }
            }
        });
        expect(result).toEqual(arr);
    });

    it("returns null when the blob exists but has no deals key", () => {
        const result = blobToLegacyDealArray({
            data: {
                migration_version: "phase-2.3-passthrough",
                migrated_from_localstorage: {
                    gtmos_other_key: [1, 2]
                }
            }
        });
        expect(result).toBeNull();
    });
});

describe("rowsToDeals", () => {
    it("returns native deals when both native + blob exist (native wins)", () => {
        const result = rowsToDeals([
            {
                id: "native-1",
                account_name: "Native One",
                stage: "discovery",
                deal_value: 10000
            },
            {
                id: "blob-row",
                data: {
                    migration_version: "phase-2.3-passthrough",
                    migrated_from_localstorage: {
                        gtmos_deal_workspaces: [
                            { id: "blob-1", accountName: "Blob One" }
                        ]
                    }
                }
            }
        ]);
        expect(result).toHaveLength(1);
        expect(result[0]?.id).toBe("native-1");
    });

    it("falls back to blob deals when no native rows exist", () => {
        const result = rowsToDeals([
            {
                id: "blob-row",
                data: {
                    migration_version: "phase-2.3-passthrough",
                    migrated_from_localstorage: {
                        gtmos_deal_workspaces: [
                            { id: "blob-1", accountName: "Blob One", value: 7777 }
                        ]
                    }
                }
            }
        ]);
        expect(result).toHaveLength(1);
        expect(result[0]?.accountName).toBe("Blob One");
        expect(result[0]?.value).toBe(7777);
    });

    it("returns empty array for empty input", () => {
        expect(rowsToDeals([])).toEqual([]);
    });
});

describe("dealToDbWrite", () => {
    it("produces column data + jsonb shape", () => {
        const out = dealToDbWrite({
            id: "x",
            accountName: "Acme",
            value: 100000,
            stage: "negotiation",
            nextStep: "Send proposal",
            nextStepDate: "2026-05-15",
            closeDate: "2026-06-01",
            champion: "Jane",
            momentum: "strong"
        });
        expect(out.account_name).toBe("Acme");
        expect(out.deal_value).toBe(100000);
        expect(out.stage).toBe("negotiation");
        expect(out.next_step_date).toBe("2026-05-15");
        expect(out.close_date).toBe("2026-06-01");
        const blob = out.data as Record<string, unknown>;
        expect(blob.nextStep).toBe("Send proposal");
        expect(blob.champion).toBe("Jane");
        expect(blob.momentum).toBe("strong");
    });

    it("nulls null-able columns when fields are absent", () => {
        const out = dealToDbWrite({
            id: "x",
            accountName: "Acme",
            value: 0,
            stage: "prospect"
        });
        expect(out.close_date).toBeNull();
        expect(out.next_step_date).toBeNull();
        expect(out.forecast_category).toBeNull();
        expect(out.loss_reason).toBeNull();
    });
});
