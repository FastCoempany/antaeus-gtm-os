import { describe, expect, it } from "vitest";
import { buildActions, buildActivationModel, prettyRole } from "./engine";
import { EMPTY_COUNTS, type WorkspaceCounts } from "./types";

function counts(part: Partial<WorkspaceCounts>): WorkspaceCounts {
    return { ...EMPTY_COUNTS, ...part };
}

describe("buildActivationModel", () => {
    it("empty workspace shows 0/4 + the orientation headline", () => {
        const m = buildActivationModel(EMPTY_COUNTS);
        expect(m.completed).toBe(0);
        expect(m.total).toBe(4);
        // Phase 2.1 audit: empty-state copy now names the unit (ICP)
        // and the verb (define). Was: "Set up one ICP before the
        // system starts briefing you" — "ICP" was internal canon.
        expect(m.headline).toMatch(/define one sharp icp/i);
        expect(m.nextMilestone?.key).toBe("icp");
    });

    it("partial workspace surfaces the next missing anchor", () => {
        const m = buildActivationModel(counts({ icps: 1, accounts: 1, signals: 3 }));
        expect(m.completed).toBe(2);
        // Phase 2.1 audit: replaced "moving from setup into a real operating
        // system" (canon-doc voice) with "Next move: {next-anchor}."
        expect(m.headline).toMatch(/next move/i);
        expect(m.nextMilestone?.key).toBe("deal");
    });

    it("complete workspace says all anchors live", () => {
        const m = buildActivationModel(
            counts({ icps: 1, accounts: 1, deals: 1, touches: 1 })
        );
        expect(m.completed).toBe(4);
        expect(m.nextMilestone).toBeNull();
        expect(m.headline).toMatch(/all four anchors are live/i);
    });

    it("calls also count toward the motion anchor", () => {
        const m = buildActivationModel(counts({ icps: 1, calls: 1 }));
        const motion = m.milestones.find((x) => x.key === "motion");
        expect(motion?.done).toBe(true);
    });
});

describe("buildActions", () => {
    it("truly empty workspace returns exactly 1 action (the ICP ICP)", () => {
        // First-90-seconds audit: on a zero-data workspace the operator
        // doesn't need a menu — they need exactly one move. The cap
        // lifts to 4 the moment any anchor exists (see next test).
        const list = buildActions(EMPTY_COUNTS);
        expect(list).toHaveLength(1);
        expect(list[0]!.key).toBe("icp");
        expect(list[0]!.state).toBe("now");
    });

    it("non-empty workspace returns up to 4 actions (1 primary + 3 ghost)", () => {
        const list = buildActions(counts({ icps: 1 }));
        expect(list.length).toBeLessThanOrEqual(4);
        expect(list.length).toBeGreaterThan(1);
        expect(list[0]!.state).toBe("now");
        expect(list[1]!.state).toBe("next");
    });

    it("skips ICP action when one already exists", () => {
        const list = buildActions(counts({ icps: 1 }));
        expect(list.find((a) => a.key === "icp")).toBeUndefined();
    });

    it("offers planner when at least one deal exists", () => {
        const list = buildActions(counts({ icps: 1, accounts: 1, deals: 1 }));
        expect(list.some((a) => a.key === "planner")).toBe(true);
    });

    it("first action gets state=now, second=next, rest=ready", () => {
        const list = buildActions(EMPTY_COUNTS);
        list.forEach((a, i) => {
            if (i === 0) expect(a.state).toBe("now");
            else if (i === 1) expect(a.state).toBe("next");
            else expect(a.state).toBe("ready");
        });
    });
});

describe("buildActions — after-access first move", () => {
    // Post-onboarding state: an ICP + one named account + a quota, but
    // no motion and no deal. The first move should act on the account,
    // not ask for a deal that doesn't exist on day one.
    const postOnboarding = counts({ icps: 1, accounts: 1 });

    it("leads with motion (not deal) once an account exists but no motion has run", () => {
        const list = buildActions(postOnboarding);
        expect(list[0]!.key).toBe("motion");
        expect(list[0]!.state).toBe("now");
        const deal = list.findIndex((a) => a.key === "deal");
        const motion = list.findIndex((a) => a.key === "motion");
        expect(motion).toBeLessThan(deal);
    });

    it("names the seeded account in the first move and routes pre-loaded", () => {
        const list = buildActions(postOnboarding, "Deel");
        const top = list[0]!;
        expect(top.key).toBe("motion");
        expect(top.title).toContain("Deel");
        expect(top.cta).toBe("Compose outbound");
        expect(top.href).toBe("/outbound-studio/?account=Deel");
    });

    it("url-encodes account names with spaces", () => {
        const list = buildActions(postOnboarding, "Velocity Global");
        const top = list[0]!;
        expect(top.href).toBe("/outbound-studio/?account=Velocity%20Global");
    });

    it("falls back to the generic motion action when no account is named", () => {
        const list = buildActions(postOnboarding, null);
        const top = list[0]!;
        expect(top.key).toBe("motion");
        expect(top.title).toBe("Log the first motion.");
        expect(top.href).toBe("/outbound-studio/");
    });

    it("keeps deal ahead of motion once a motion has already run", () => {
        // Account + a logged touch but no deal: the deal is now the
        // pressing gap, so it leads.
        const list = buildActions(counts({ icps: 1, accounts: 1, touches: 1 }));
        const deal = list.findIndex((a) => a.key === "deal");
        expect(deal).toBe(0);
        expect(list.find((a) => a.key === "motion")).toBeUndefined();
    });

    it("still leads with the account add when no account exists yet", () => {
        // No account at all: adding one comes before any motion/deal.
        const list = buildActions(counts({ icps: 1 }), null);
        expect(list[0]!.key).toBe("signal");
    });
});

describe("buildActions URL safety", () => {
    it("quota + backup actions point at legacy /app/ routes", () => {
        // These rooms (Quota Workback / Settings) are still in open
        // PRs at the time Welcome migrated. The legacy `/app/<room>/`
        // pages always exist and Wave 6 flag-redirects forward to the
        // new room when the Posthog flag is on. Pointing at the new
        // /<room>/ path directly produces a 404 for anyone whose flag
        // is off + on whatever environments haven't deployed the new
        // room yet.
        const list = buildActions(EMPTY_COUNTS);
        const quota = list.find((a) => a.key === "quota");
        const backup = list.find((a) => a.key === "backup");
        if (quota) expect(quota.href).toBe("/quota-workback/");
        if (backup) expect(backup.href).toBe("/settings/");
    });

    it("rooms already merged on main use the new-stack /<room>/ path", () => {
        // ICP Studio is also still in open PR #28, but my Welcome
        // engine intentionally uses /app/icp-studio/ for the same
        // reason. The other actions point at rooms already merged
        // (signal-console / deal-workspace / outbound-studio /
        // call-planner / dashboard) so they use the new-stack paths.
        const list = buildActions(counts({ icps: 1, accounts: 1, deals: 1 }));
        const dashboard = list.find((a) => a.key === "dashboard");
        if (dashboard) expect(dashboard.href).toBe("/dashboard/");
        const planner = list.find((a) => a.key === "planner");
        if (planner) expect(planner.href).toBe("/call-planner/");
    });
});

describe("prettyRole", () => {
    it("title-cases hyphenated/underscored values", () => {
        expect(prettyRole("founder_ceo")).toBe("Founder Ceo");
        expect(prettyRole("vp-sales")).toBe("Vp Sales");
        expect(prettyRole("head_of_marketing")).toBe("Head Of Marketing");
    });

    it("falls back to Operator when null/empty", () => {
        expect(prettyRole(null)).toBe("Operator");
        expect(prettyRole("")).toBe("Operator");
        expect(prettyRole("   ")).toBe("Operator");
    });
});
