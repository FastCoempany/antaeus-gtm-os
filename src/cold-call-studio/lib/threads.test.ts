import { describe, expect, it } from "vitest";
import {
    findReply,
    findThread,
    nextThreadFor,
    THREADS
} from "./threads";
import type { ThreadId } from "./types";

describe("THREADS sequence", () => {
    it("contains six threads in the existing routing order", () => {
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

    it("each reply has a buyer, reply, and a valid next target", () => {
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

    it("opener routes all branches into impact questions", () => {
        const opener = findThread("opener");
        for (const r of opener.replies) {
            expect(r.next).toBe("pressure");
        }
    });

    it("ask yes and send branches route to post-call capture", () => {
        const ask = findThread("ask");
        expect(findReply(ask, "yes")?.next).toBe("post");
        expect(findReply(ask, "send")?.next).toBe("post");
        expect(findReply(ask, "not-now")?.next).toBe("exit");
    });

    it("the legacy proof id no longer manufactures proof or benchmark claims", () => {
        const currentApproach = findThread("proof");
        const text = [
            currentApproach.title,
            currentApproach.copy,
            currentApproach.say,
            currentApproach.coach,
            ...currentApproach.replies.flatMap((r) => [r.buyer, r.reply])
        ].join(" ").toLowerCase();
        expect(currentApproach.label).toBe("Understand the current approach");
        expect(text).not.toContain("we've seen both");
        expect(text).not.toContain("this becomes expensive");
        expect(text).not.toContain("send the benchmark");
    });
});

describe("findThread", () => {
    it("returns the thread by id", () => {
        expect(findThread("proof").label).toBe("Understand the current approach");
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

    it("returns null when reply.next is post", () => {
        const ask = findThread("ask");
        const reply = findReply(ask, "yes");
        expect(nextThreadFor(reply)).toBeNull();
    });
});
