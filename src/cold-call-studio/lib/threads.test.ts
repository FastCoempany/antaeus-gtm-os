import { describe, expect, it } from "vitest";
import {
    findReply,
    findThread,
    nextThreadFor,
    THREADS
} from "./threads";
import type { ThreadId } from "./types";

describe("THREADS spine", () => {
    it("contains six threads in canonical order", () => {
        expect(THREADS.map((t) => t.id)).toEqual([
            "prep",
            "opener",
            "pressure",
            "proof",
            "ask",
            "exit"
        ]);
    });

    it("each thread has a non-empty title, copy, say, coach, and >=2 replies", () => {
        for (const t of THREADS) {
            expect(t.title.length).toBeGreaterThan(0);
            expect(t.copy.length).toBeGreaterThan(0);
            expect(t.say.length).toBeGreaterThan(0);
            expect(t.coach.length).toBeGreaterThan(0);
            expect(t.replies.length).toBeGreaterThanOrEqual(2);
        }
    });

    it("each reply has a buyer, reply, and a valid next target (ThreadId or 'post')", () => {
        const validIds: ReadonlyArray<ThreadId | "post" | null> = [
            "prep",
            "opener",
            "pressure",
            "proof",
            "ask",
            "exit",
            "post",
            null
        ];
        for (const t of THREADS) {
            for (const r of t.replies) {
                expect(r.buyer.length).toBeGreaterThan(0);
                expect(r.reply.length).toBeGreaterThan(0);
                expect(validIds).toContain(r.next);
            }
        }
    });

    it("kicker numbers run 01..06", () => {
        expect(THREADS.map((t) => t.num)).toEqual([
            "01",
            "02",
            "03",
            "04",
            "05",
            "06"
        ]);
    });

    it("opener thread routes all branches into pressure (per legacy contract)", () => {
        const opener = findThread("opener");
        for (const r of opener.replies) {
            expect(r.next).toBe("pressure");
        }
    });

    it("ask thread `yes` and `send` route to post (call ends in scheduling)", () => {
        const ask = findThread("ask");
        expect(findReply(ask, "yes")?.next).toBe("post");
        expect(findReply(ask, "send")?.next).toBe("post");
        expect(findReply(ask, "not-now")?.next).toBe("exit");
    });
});

describe("findThread", () => {
    it("returns the thread by id", () => {
        expect(findThread("proof").label).toBe("Evidence thread");
    });

    it("falls back to prep when id is unknown", () => {
        // @ts-expect-error — testing the runtime fallback
        expect(findThread("ghost").id).toBe("prep");
    });
});

describe("findReply", () => {
    it("returns null when replyId is null", () => {
        const t = findThread("opener");
        expect(findReply(t, null)).toBeNull();
    });

    it("returns the reply by id", () => {
        const t = findThread("opener");
        expect(findReply(t, "busy")?.buyer).toBe("I am busy.");
    });

    it("returns null when reply id is unknown", () => {
        const t = findThread("opener");
        expect(findReply(t, "ghost")).toBeNull();
    });
});

describe("nextThreadFor", () => {
    it("resolves a ThreadId next to its Thread", () => {
        const opener = findThread("opener");
        const reply = findReply(opener, "busy");
        expect(nextThreadFor(reply)?.id).toBe("pressure");
    });

    it("returns null when reply is null", () => {
        expect(nextThreadFor(null)).toBeNull();
    });

    it("returns null when reply.next is 'post'", () => {
        const ask = findThread("ask");
        const reply = findReply(ask, "yes");
        expect(nextThreadFor(reply)).toBeNull();
    });
});
