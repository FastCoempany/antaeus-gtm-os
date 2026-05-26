import { describe, expect, it } from "vitest";
import {
    EMPTY_COMMERCIAL_PROFILE,
    profileHasContent,
    profileToInsert,
    profileToUpdate,
    rowToProfile,
    type CommercialProfile
} from "./commercial-profile";
import type { WorkspaceProfile } from "@/lib/database-helpers";

function makeRow(overrides: Partial<WorkspaceProfile> = {}): WorkspaceProfile {
    return {
        workspace_id: "ws-1",
        product_category: "revenue OS",
        what_we_sell: "a GTM operating system",
        value_prop: "make the motion inheritable",
        onboarding_completed: true,
        onboarding_answers: {},
        data: {},
        created_at: "2026-05-26T00:00:00Z",
        updated_at: "2026-05-26T00:00:00Z",
        ...overrides
    };
}

describe("rowToProfile", () => {
    it("projects the three commercial fields", () => {
        const p = rowToProfile(makeRow());
        expect(p).toEqual({
            productCategory: "revenue OS",
            whatWeSell: "a GTM operating system",
            valueProp: "make the motion inheritable"
        });
    });

    it("collapses null columns to empty strings", () => {
        const p = rowToProfile(
            makeRow({ product_category: null, what_we_sell: null, value_prop: null })
        );
        expect(p).toEqual(EMPTY_COMMERCIAL_PROFILE);
    });

    it("does not surface onboarding columns", () => {
        const p = rowToProfile(makeRow());
        expect(p).not.toHaveProperty("onboarding_completed");
        expect(Object.keys(p).sort()).toEqual([
            "productCategory",
            "valueProp",
            "whatWeSell"
        ]);
    });
});

describe("profileToInsert", () => {
    it("includes the workspace_id PK + the three fields", () => {
        const profile: CommercialProfile = {
            productCategory: "revenue OS",
            whatWeSell: "a GTM OS",
            valueProp: "inheritable motion"
        };
        const insert = profileToInsert("ws-9", profile);
        expect(insert).toEqual({
            workspace_id: "ws-9",
            product_category: "revenue OS",
            what_we_sell: "a GTM OS",
            value_prop: "inheritable motion"
        });
    });

    it("does NOT include onboarding columns (leaves DB defaults)", () => {
        const insert = profileToInsert("ws-1", EMPTY_COMMERCIAL_PROFILE);
        expect(insert).not.toHaveProperty("onboarding_completed");
        expect(insert).not.toHaveProperty("onboarding_answers");
    });

    it("stores empty strings as null", () => {
        const insert = profileToInsert("ws-1", {
            productCategory: "  ",
            whatWeSell: "",
            valueProp: "real"
        });
        expect(insert.product_category).toBeNull();
        expect(insert.what_we_sell).toBeNull();
        expect(insert.value_prop).toBe("real");
    });
});

describe("profileToUpdate", () => {
    it("patches ONLY the three commercial fields — never onboarding", () => {
        const patch = profileToUpdate({
            productCategory: "x",
            whatWeSell: "y",
            valueProp: "z"
        });
        expect(Object.keys(patch).sort()).toEqual([
            "product_category",
            "value_prop",
            "what_we_sell"
        ]);
        expect(patch).not.toHaveProperty("onboarding_completed");
        expect(patch).not.toHaveProperty("workspace_id");
    });

    it("trims + nulls empty fields", () => {
        const patch = profileToUpdate({
            productCategory: "  spaced  ",
            whatWeSell: "",
            valueProp: ""
        });
        expect(patch.product_category).toBe("spaced");
        expect(patch.what_we_sell).toBeNull();
        expect(patch.value_prop).toBeNull();
    });
});

describe("profileHasContent", () => {
    it("false for the empty profile", () => {
        expect(profileHasContent(EMPTY_COMMERCIAL_PROFILE)).toBe(false);
    });

    it("false for whitespace-only fields", () => {
        expect(
            profileHasContent({ productCategory: "  ", whatWeSell: "", valueProp: " " })
        ).toBe(false);
    });

    it("true when any field has content", () => {
        expect(
            profileHasContent({ productCategory: "x", whatWeSell: "", valueProp: "" })
        ).toBe(true);
    });
});
