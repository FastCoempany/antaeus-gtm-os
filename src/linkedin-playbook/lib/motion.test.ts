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

describe("deriveMotion — default", () => {
    it("returns the default public-interaction recommendation when no account state determines the next action", () => {
        const m = deriveMotion(baseCtx);
        expect(m.key).toBe("credibility");
        expect(m.actionType).toBe("content_engage");
        expect(m.cueIndex).toBe(1);
        expect(m.accountName).toBe("");
        expect(m.label).toContain("Build familiarity");
        expect(m.thresholds).toContain("No fixed acceptance or reply benchmark");
    });
});

describe("deriveMotion — current signal account", () => {
    it("fires when a prioritized account exists and has no connection request", () => {
        const m = deriveMotion({
            ...baseCtx,
            hottestAccount: { name: "Acme", heat: 80 },
            stats: EMPTY_STATS
        });
        expect(m.key).toBe("warm_signal_account");
        expect(m.actionType).toBe("content_engage");
        expect(m.accountName).toBe("Acme");
        expect(m.context).toContain("Acme");
        expect(m.context).toContain("Priority score 80");
        expect(m.whyNow).toContain("no LinkedIn connection request is logged");
        expect(m.cueIndex).toBe(1);
    });

    it("moves cueIndex to 2 once a content engagement exists for the account", () => {
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
        expect(m.cueIndex).toBe(2);
    });
});

describe("deriveMotion — connection request logged", () => {
    it("recommends a DM only when a connection request exists and no DM is logged", () => {
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
        expect(m.context).toContain("connection request");
        expect(m.context).toContain("no recorded DM");
    });

    it("does not re-enter the DM branch when a DM already exists", () => {
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
        expect(m.key).toBe("credibility");
    });
});

describe("deriveMotion — recent outbound touch", () => {
    it("uses the existing compatibility key when no prioritized account exists and a recent outbound touch does", () => {
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
        expect(m.context).toContain("latest recorded outbound touch");
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
    it("prioritized account with no connection request wins over latest outbound touch", () => {
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

    it("connection-request branch wins over recent outbound touch", () => {
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

describe("deriveMotion — recovery guidance", () => {
    it("default guidance allows skipping LinkedIn instead of forcing an interaction", () => {
        const m = deriveMotion(baseCtx);
        expect(m.recovery).toContain("do not force a comment");
    });

    it("signal-account recovery names the account and tells the operator to update context", () => {
        const m = deriveMotion({
            ...baseCtx,
            hottestAccount: { name: "Cascadia Health", heat: 84 }
        });
        expect(m.recovery).toContain("Cascadia Health");
        expect(m.recovery).toContain("update the account context");
    });

    it("DM recovery avoids repeated LinkedIn follow-ups without new context", () => {
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
        expect(m.recovery).toContain("new account context");
    });

    it("recent-outbound recovery names the account and allows skipping LinkedIn", () => {
        const m = deriveMotion({
            ...baseCtx,
            latestTouch: {
                accountName: "Beta Robotics",
                createdAt: "2026-04-27T00:00:00Z"
            }
        });
        expect(m.key).toBe("add_air_cover");
        expect(m.recovery).toContain("Beta Robotics");
        expect(m.recovery).toContain("skip the channel");
    });
});
