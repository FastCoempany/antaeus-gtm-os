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
        expect(m.headline).toMatch(/needs first operating truth/);
        expect(m.nextMilestone?.key).toBe("icp");
    });

    it("partial workspace surfaces the next missing anchor", () => {
        const m = buildActivationModel(counts({ icps: 1, accounts: 1, signals: 3 }));
        expect(m.completed).toBe(2);
        expect(m.headline).toMatch(/moving from setup/);
        expect(m.nextMilestone?.key).toBe("deal");
    });

    it("complete workspace says all anchors live", () => {
        const m = buildActivationModel(
            counts({ icps: 1, accounts: 1, deals: 1, touches: 1 })
        );
        expect(m.completed).toBe(4);
        expect(m.nextMilestone).toBeNull();
        expect(m.headline).toMatch(/anchors are live/);
    });

    it("calls also count toward the motion anchor", () => {
        const m = buildActivationModel(counts({ icps: 1, calls: 1 }));
        const motion = m.milestones.find((x) => x.key === "motion");
        expect(motion?.done).toBe(true);
    });
});

describe("buildActions", () => {
    it("empty workspace prioritizes the 4 zero-to-one moves first", () => {
        const list = buildActions(EMPTY_COUNTS);
        const keys = list.map((a) => a.key);
        expect(keys.slice(0, 4)).toEqual(["icp", "signal", "deal", "motion"]);
        expect(list[0]!.state).toBe("now");
        expect(list[1]!.state).toBe("next");
    });

    it("returns at most 5 actions", () => {
        const list = buildActions(EMPTY_COUNTS);
        expect(list.length).toBeLessThanOrEqual(5);
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
