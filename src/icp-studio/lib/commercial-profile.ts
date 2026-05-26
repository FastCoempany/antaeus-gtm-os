import type { WorkspaceProfile } from "@/lib/database-helpers";

/**
 * Commercial profile — the operator's own selling identity (ADR-007).
 *
 * What WE sell, not who we sell to. Distinct from the ICP (which the
 * rest of this room shapes). One per workspace; the single source of
 * truth lives in the `workspace_profile` Supabase table.
 *
 * ICP Studio edits only the three commercial-identity fields here. The
 * same table also carries onboarding state (onboarding_completed /
 * onboarding_answers), owned by the Onboarding room — this room never
 * touches those, and its update path patches only the three fields it
 * owns so onboarding state is never clobbered.
 *
 * The Briefing reads product_category + value_prop to anchor its
 * category-specific intelligence.
 */

export interface CommercialProfile {
    readonly productCategory: string;
    readonly whatWeSell: string;
    readonly valueProp: string;
}

export const EMPTY_COMMERCIAL_PROFILE: CommercialProfile = {
    productCategory: "",
    whatWeSell: "",
    valueProp: ""
};

/**
 * Project a workspace_profile row into the editable CommercialProfile
 * shape. Nullable DB columns collapse to empty strings for the form.
 */
export function rowToProfile(row: WorkspaceProfile): CommercialProfile {
    return {
        productCategory: row.product_category ?? "",
        whatWeSell: row.what_we_sell ?? "",
        valueProp: row.value_prop ?? ""
    };
}

/**
 * The insert payload for a brand-new workspace_profile row. Sets the
 * commercial fields + the required workspace_id PK; leaves onboarding
 * columns to their DB defaults (false / {}). Empty strings are stored
 * as null so "unset" is unambiguous downstream.
 */
export function profileToInsert(
    workspaceId: string,
    profile: CommercialProfile
): {
    workspace_id: string;
    product_category: string | null;
    what_we_sell: string | null;
    value_prop: string | null;
} {
    return {
        workspace_id: workspaceId,
        product_category: emptyToNull(profile.productCategory),
        what_we_sell: emptyToNull(profile.whatWeSell),
        value_prop: emptyToNull(profile.valueProp)
    };
}

/**
 * The update patch for an existing row. Patches ONLY the three
 * commercial fields — never onboarding_* — so the Onboarding room's
 * state survives an ICP Studio profile edit (single source of truth,
 * no clobber).
 */
export function profileToUpdate(profile: CommercialProfile): {
    product_category: string | null;
    what_we_sell: string | null;
    value_prop: string | null;
} {
    return {
        product_category: emptyToNull(profile.productCategory),
        what_we_sell: emptyToNull(profile.whatWeSell),
        value_prop: emptyToNull(profile.valueProp)
    };
}

/** Whether a profile carries any operator-entered content. */
export function profileHasContent(profile: CommercialProfile): boolean {
    return (
        profile.productCategory.trim().length > 0 ||
        profile.whatWeSell.trim().length > 0 ||
        profile.valueProp.trim().length > 0
    );
}

function emptyToNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
