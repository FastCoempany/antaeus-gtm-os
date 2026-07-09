import { beforeEach, describe, expect, it } from "vitest";
import {
    INBOUND_QUEUE_KEY,
    clearInboundQueue,
    enqueueInboundAccount,
    readInboundQueue
} from "./inbound-queue";

function memStorage(): Storage {
    const map = new Map<string, string>();
    return {
        getItem: (k: string) => map.get(k) ?? null,
        setItem: (k: string, v: string) => void map.set(k, v),
        removeItem: (k: string) => void map.delete(k),
        clear: () => map.clear(),
        key: () => null,
        get length() {
            return map.size;
        }
    } as Storage;
}

describe("signal-console inbound queue", () => {
    let s: Storage;
    beforeEach(() => {
        s = memStorage();
    });

    it("round-trips an entry", () => {
        expect(enqueueInboundAccount({ name: "Vanta", note: "warm intro", from: "prospecting-desk" }, s)).toBe(true);
        const q = readInboundQueue(s);
        expect(q).toHaveLength(1);
        expect(q[0]!.name).toBe("Vanta");
        expect(q[0]!.note).toBe("warm intro");
        expect(q[0]!.at).toBeTruthy();
    });

    it("dedupes by case-insensitive name", () => {
        enqueueInboundAccount({ name: "Vanta" }, s);
        expect(enqueueInboundAccount({ name: "vanta" }, s)).toBe(true);
        expect(readInboundQueue(s)).toHaveLength(1);
    });

    it("rejects a blank name", () => {
        expect(enqueueInboundAccount({ name: "   " }, s)).toBe(false);
        expect(readInboundQueue(s)).toHaveLength(0);
    });

    it("survives malformed storage", () => {
        s.setItem(INBOUND_QUEUE_KEY, "{not json");
        expect(readInboundQueue(s)).toEqual([]);
        expect(enqueueInboundAccount({ name: "Brex" }, s)).toBe(true);
        expect(readInboundQueue(s)).toHaveLength(1);
    });

    it("drops entries without a name and clears", () => {
        s.setItem(
            INBOUND_QUEUE_KEY,
            JSON.stringify({ queue: [{ name: "Ramp" }, { note: "no name" }, "junk"] })
        );
        const q = readInboundQueue(s);
        expect(q).toHaveLength(1);
        expect(q[0]!.name).toBe("Ramp");
        clearInboundQueue(s);
        expect(readInboundQueue(s)).toEqual([]);
    });
});
