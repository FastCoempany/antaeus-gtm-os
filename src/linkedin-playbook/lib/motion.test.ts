import { describe, expect, it } from "vitest";
import { deriveMotion } from "./motion";
import {
    EMPTY_STATS,
    type AccountCounts,
    type ChannelStats,
    type MotionContext
} from "./types";

function statsWith(byAccount: Record<string, AccountCounts>): ChannelStats {
    return { ...EMPTY_STATS, byAccount };
}

const baseCtx: MotionContext = {
    icp: null,
    hottestAccount: null,
    latestTouch: null,
    stats: EMPTY_STATS
};

describe("deriveMotion — credibility default", () => {
    it("returns the credibility motion when no signals exist", () => {
        const m = deriveMotion(baseCtx);
        expect(m.key).toBe("credibility");
        expect(m.actionType).toBe("content_engage");
        expect(m.cueIndex).toBe(1);
        expect(m.accountName).toBe("");
        expect(m.label).toContain("name familiarity");
    });

    it("uses the latest touch's accountName when no hottest signal account", () => {
        // This is a subtle case: latestTouch alone routes to add_air_cover
        // not credibility (per legacy line 109's else-if), so test that
        // credibility's accountName fallback only fires when neither
        // latestTouch nor hottest set the route.
        const m = deriveMotion({ ...baseCtx });
        expect(m.accountName).toBe("");
    });
});

describe("deriveMotion — warm_signal_account", () => {
    it("fires when hottest account exists and has 0 connection_requests", () => {
        const m = deriveMotion({
            ...baseCtx,
            hottestAccount: { name: "Acme", heat: 80 },
            stats: EMPTY_STATS
        });
        expect(m.key).toBe("warm_signal_account");
        expect(m.actionType).toBe("content_engage");
        expect(m.accountName).toBe("Acme");
        expect(m.context).toContain("Acme");
        expect(m.context).toContain("(heat 80)");
        expect(m.cueIndex).toBe(1);
    });

    it("bumps cueIndex to 2 once a content_engage exists for the hottest account", () => {
        const m = deriveMotion({
            ...baseCtx,
            hottestAccount: { name: "Acme", heat: 80 },
            stats: statsWith({
                acme: {
                    content_engage: 1,
                    connection_request: 0,
                    dm: 0
                }
            })
        });
        expect(m.cueIndex).toBe(2);
    });

    it("omits the heat parenthetical when heat is 0", () => {
        const m = deriveMotion({
            ...baseCtx,
            hottestAccount: { name: "Acme", heat: 0 }
        });
        expect(m.context).not.toContain("(heat ");
    });

    it("matches account stats case-insensitively", () => {
        const m = deriveMotion({
            ...baseCtx,
            hottestAccount: { name: "Acme", heat: 50 },
            stats: statsWith({
                acme: {
                    content_engage: 2,
                    connection_request: 0,
                    dm: 0
                }
            })
        });
        // Despite "Acme" → key "acme" lookup, content_engage > 0 should bump.
        expect(m.cueIndex).toBe(2);
    });
});

describe("deriveMotion — convert_connection", () => {
    it("fires when hottest exists with a connection_request and no DM", () => {
        const m = deriveMotion({
            ...baseCtx,
            hottestAccount: { name: "Acme", heat: 80 },
            stats: statsWith({
                acme: {
                    content_engage: 2,
                    connection_request: 1,
                    dm: 0
                }
            })
        });
        expect(m.key).toBe("convert_connection");
        expect(m.actionType).toBe("dm");
        expect(m.cueIndex).toBe(3);
        expect(m.context).toContain("Acme");
    });

    it("does NOT fire when a DM already exists (returns to credibility/default)", () => {
        const m = deriveMotion({
            ...baseCtx,
            hottestAccount: { name: "Acme", heat: 80 },
            stats: statsWith({
                acme: {
                    content_engage: 2,
                    connection_request: 1,
                    dm: 1
                }
            })
        });
        // Neither warm_signal_account nor convert_connection nor add_air_cover
        // fires; defaults pass through with the credibility motion.
        expect(m.key).toBe("credibility");
    });
});

describe("deriveMotion — add_air_cover", () => {
    it("fires when no hottest signal but a latest outbound touch exists", () => {
        const m = deriveMotion({
            ...baseCtx,
            latestTouch: {
                accountName: "Beta",
                createdAt: "2026-04-27T00:00:00Z"
            }
        });
        expect(m.key).toBe("add_air_cover");
        expect(m.actionType).toBe("content_share");
        expect(m.accountName).toBe("Beta");
        expect(m.context).toContain("Beta");
        expect(m.cueIndex).toBe(1);
    });

    it("does not fire when latest touch has empty accountName", () => {
        const m = deriveMotion({
            ...baseCtx,
            latestTouch: {
                accountName: "",
                createdAt: "2026-04-27T00:00:00Z"
            }
        });
        expect(m.key).toBe("credibility");
    });
});

describe("deriveMotion — branch precedence", () => {
    it("hottest with no connection_request wins over latest touch", () => {
        const m = deriveMotion({
            ...baseCtx,
            hottestAccount: { name: "Acme", heat: 80 },
            latestTouch: {
                accountName: "Beta",
                createdAt: "2026-04-27T00:00:00Z"
            }
        });
        expect(m.key).toBe("warm_signal_account");
        expect(m.accountName).toBe("Acme");
    });

    it("convert_connection wins over add_air_cover even with both context", () => {
        const m = deriveMotion({
            ...baseCtx,
            hottestAccount: { name: "Acme", heat: 80 },
            latestTouch: {
                accountName: "Beta",
                createdAt: "2026-04-27T00:00:00Z"
            },
            stats: statsWith({
                acme: {
                    content_engage: 1,
                    connection_request: 1,
                    dm: 0
                }
            })
        });
        expect(m.key).toBe("convert_connection");
    });
});

describe("deriveMotion — recovery line (Program 6 / PR 11)", () => {
    it("credibility motion carries a recovery-line copy", () => {
        const m = deriveMotion(baseCtx);
        expect(m.recovery).toBeTruthy();
        expect(m.recovery.toLowerCase()).toContain("narrower");
    });

    it("warm_signal_account recovery names the account", () => {
        const m = deriveMotion({
            ...baseCtx,
            hottestAccount: { name: "Cascadia Health", heat: 84 }
        });
        expect(m.recovery).toContain("Cascadia Health");
        expect(m.recovery.toLowerCase()).toContain("narrow");
    });

    it("convert_connection recovery hands the next touch back to Outbound", () => {
        const m = deriveMotion({
            ...baseCtx,
            hottestAccount: { name: "Acme", heat: 80 },
            stats: statsWith({
                acme: {
                    content_engage: 0,
                    connection_request: 1,
                    dm: 0
                }
            })
        });
        expect(m.key).toBe("convert_connection");
        expect(m.recovery.toLowerCase()).toContain("outbound");
    });

    it("add_air_cover recovery names the outbound account", () => {
        const m = deriveMotion({
            ...baseCtx,
            latestTouch: {
                accountName: "Beta Robotics",
                createdAt: "2026-04-27T00:00:00Z"
            }
        });
        expect(m.key).toBe("add_air_cover");
        expect(m.recovery).toContain("Beta Robotics");
    });
});
